#!/usr/bin/env python3
"""Import a CSV of applications into issues + the project board.

Usage:
    python3 scripts/import_csv.py applications.csv USER/job-applications PROJECT_NUMBER
        [--period P ...] [--archive] [--update-fields]

Headers:
    Date, Company, Position, Recruiter, City, Salary Range, Job Link, Response, Status
    (optional) Source: LinkedIn job post / Company website / Recruiter outreach / Referral / Other
    (optional) Period: any name for a job search period, e.g. 2023. Added as the label "period: 2023".
        With no Period, the dates make the periods: a gap of more than periodGapDays (config.yaml)
        starts a new one, named by its first and last month (2025-12-to-2026-04).
Status = a Status name from the board (Applied, Rejected without interview, ...) or the row colour:
    white / green / yellow / red / gray (or pink = wishlist, purple = offer)
    yellow / withdrawn = Rejected without interview + the "withdrawn interest" label
"Response" is added to the issue as a "Timeline" section.
The project fields (Applied date, Last update, Company, ...) are filled in. "Last update" is the
last date found in "Response" (for example "9 oct red"), or "Date" when there is none.

--period P        Import only the rows of period P. Use it more than once for more periods.
--archive         Close every imported issue and archive its card, so it is not on the board.
--update-fields   For rows that are already imported, fill in the project fields again.

Rows that are already imported (same title, date and link) are skipped, so you can run it again.
"""
import read_config
import argparse, csv, json, re, subprocess, sys, time
from pathlib import Path
from datetime import date, timedelta
from urllib.parse import urlparse

STATUS = {
    "pink": "Wishlist", "wishlist": "Wishlist",
    "purple": "Offer", "offer": "Offer",
    "white": "Applied", "applied": "Applied",
    "green": "In progress", "in progress": "In progress",
    "on hold": "On hold",
    # You stopped the process: Rejected without interview + the "withdrawn interest" label
    "yellow": "Rejected without interview", "withdrawn": "Rejected without interview",
    "withdrawn interest": "Rejected without interview",
    "red": "Rejected after interview", "rejected after interview": "Rejected after interview",
    "gray": "Rejected without interview", "grey": "Rejected without interview",
    "rejected": "Rejected without interview",
    "rejected without interview": "Rejected without interview",
}
WITHDRAWN = {"yellow", "withdrawn", "withdrawn interest"}
CLOSED = {"Rejected after interview", "Rejected without interview"}
NO_INTERVIEW = {"Applied", "Rejected without interview"}
# Status names, fields, sources, and labels
CONFIG = read_config.load()
SOURCE_LABEL = {s["option"]: s["label"] for s in CONFIG["sources"]}
# First 3 letters of month names -> month
MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}
# A word right after a date that makes it a plan, not an update
PLAN_WORDS = ("apply",)


def last_update(applied, text):
    """Last date in a free-text timeline like "7 sep first interview, 9 oct rejected".

    The year is guessed: dates go forward from the application date, so a month
    that comes "before" the previous date (January after December) is in the next year.
    A date for a plan ("19 december apply", or any date after today) is not an update.
    """
    last = applied
    text = text.lower()
    for mt in re.finditer(r"\b(\d{1,2})(?:-\d{1,2})?\.?\s+([^\W\d_]{3,})", text):
        d, m = mt.groups()
        month = MONTHS.get(m[:3])
        if not month or any(w in text[mt.end():mt.end() + 12] for w in PLAN_WORDS):
            continue
        try:
            x = date(last.year, month, int(d))
        except ValueError:
            continue
        if x < last - timedelta(days=60):
            x = x.replace(year=x.year + 1)
        if x > date.today():
            continue
        last = x
    return last


def gh(*args):
    for attempt in range(6):
        p = subprocess.run(["gh", *args], capture_output=True, text=True)
        if p.returncode == 0:
            return p.stdout.strip()
        if "rate limit" in p.stderr.lower() and attempt < 5:
            print("  rate limited, waiting 60 s…", file=sys.stderr)
            time.sleep(60)
            continue
        raise RuntimeError(f"gh {' '.join(args[:3])}…: {p.stderr.strip()}")


def guess_source(link):
    if not link:
        return "Recruiter outreach"
    if "linkedin.com/jobs" in link:
        return "LinkedIn job post"
    host = urlparse(link if "://" in link else "https://" + link).hostname or ""
    if any(host == b or host.endswith("." + b) for b in CONFIG.get("jobBoards", [])):
        return "Job board"
    return "Company website"


def section(title, value):
    return f"### {title}\n\n{(value or '').strip() or '_No response_'}"


def set_fields(item, values):
    """Set several project fields of one item in a single GraphQL request."""
    parts = []
    for n, (name, value) in enumerate(values.items()):
        if value is None or value == "":
            continue
        kind = "date" if isinstance(value, date) else "number" if isinstance(value, int) else "text"
        parts.append(f'f{n}: updateProjectV2ItemFieldValue(input:{{projectId:"{project_id}", itemId:"{item}", '
                     f'fieldId:"{field_ids[name]}", value:{{{kind}:{json.dumps(value if kind == "number" else str(value))}}}}}) {{ clientMutationId }}')
    if parts:
        gh("api", "graphql", "-f", "query=mutation{ " + " ".join(parts) + " }")


def imported_issues():
    """(title, Date, Job link) -> (project item id, archived?) of the issues already imported."""
    sec = lambda body, title: body.split(f"### {title}\n\n", 1)[-1].split("\n", 1)[0].strip()
    name = repo.split("/")[1]
    q = """query($o:String!, $r:String!, $after:String) { repository(owner:$o, name:$r) {
      issues(first:100, after:$after, labels:["imported"]) {
        pageInfo { hasNextPage endCursor }
        nodes { title body projectItems(first:10, includeArchived:true) {
          nodes { id isArchived project { number } } } } } } }"""
    out, after = {}, None
    while True:
        args = ["api", "graphql", "-f", f"query={q}", "-F", f"o={owner}", "-F", f"r={name}"]
        if after:
            args += ["-F", f"after={after}"]
        page = json.loads(gh(*args))["data"]["repository"]["issues"]
        for i in page["nodes"]:
            d = sec(i["body"], "Date")
            link = sec(i["body"], "Job link")
            items = [(p["id"], p["isArchived"]) for p in i["projectItems"]["nodes"]
                     if str(p["project"]["number"]) == proj]
            out[(i["title"], d, "" if link == "_No response_" else link)] = items[0] if items else None
        if not page["pageInfo"]["hasNextPage"]:
            return out
        after = page["pageInfo"]["endCursor"]


ap = argparse.ArgumentParser()
ap.add_argument("csv")
ap.add_argument("repo")
ap.add_argument("project")
ap.add_argument("--period", action="append", help="import only this period (repeatable)")
ap.add_argument("--archive", action="store_true", help="close the issues and archive the cards")
ap.add_argument("--update-fields", action="store_true", help="refill the fields of imported rows")
a = ap.parse_args()

repo, proj = a.repo, a.project
owner = repo.split("/")[0]
project_id = json.loads(gh("project", "view", proj, "--owner", owner, "--format", "json"))["id"]
fields = json.loads(gh("project", "field-list", proj, "--owner", owner, "--format", "json"))["fields"]
field_ids = {f["name"]: f["id"] for f in fields}
status_field = next(f for f in fields if f["name"] == "Status")
options = {o["name"]: o["id"] for o in status_field["options"]}
missing = {f["name"] for f in CONFIG["fields"]} - field_ids.keys()
if missing:
    sys.exit(f"Missing project fields {sorted(missing)}. Run the setup again: bash scripts/setup.sh")

existing = imported_issues()

def auto_periods(dates):
    """Period names from the dates: a gap of more than periodGapDays between two applications
    starts a new period, named by its first and last month (2025-12-to-2026-04, or 2025-12)."""
    names, group = {}, []
    days = sorted(set(dates))
    for n, d in enumerate(days):
        group.append(d)
        if n == len(days) - 1 or (date.fromisoformat(days[n + 1]) - date.fromisoformat(d)).days > CONFIG["periodGapDays"]:
            first, end = group[0][:7], group[-1][:7]
            names.update({x: first if first == end else f"{first}-to-{end}" for x in group})
            group = []
    return names


def period_of(r):
    """The Period column, or the period made from the dates."""
    return (r.get("Period") or "").strip() or AUTO.get((r.get("Date") or "").strip(), "")

with open(a.csv, encoding="utf-8") as f:
    all_rows = [r for r in csv.DictReader(f) if (r.get("Company") or "").strip()]
AUTO = auto_periods([d for r in all_rows if not (r.get("Period") or "").strip()
                     and re.fullmatch(r"\d{4}-\d{2}-\d{2}", d := (r.get("Date") or "").strip())])
rows = [r for r in all_rows if not a.period or period_of(r) in a.period]
print(f"{len(rows)} rows")

for period in sorted({period_of(r) for r in rows} - {""}):
    gh("label", "create", f"period: {period}", "-R", repo, "-c", CONFIG["periodLabelColor"],
       "-d", "Job search period", "--force")

# The sync workflow would run once per new issue; it is not needed for imported issues.
sync_off = subprocess.run(["gh", "workflow", "disable", "sync.yaml", "-R", repo],
                          capture_output=True).returncode == 0
try:
    for n, r in enumerate(rows, 1):
        company = r["Company"].strip()
        position = (r.get("Position") or "").strip()
        applied = (r.get("Date") or "").strip()
        title = f"[{company}] {position}"
        link = (r.get("Job Link") or "").strip().lstrip("-").strip()
        response = (r.get("Response") or "").strip()
        applied_d = date.fromisoformat(applied) if re.fullmatch(r"\d{4}-\d{2}-\d{2}", applied) else None
        values = {
            "Applied date": applied_d,
            "Last update": applied_d and last_update(applied_d, response),
            "Company": company, "Position": position,
            "City": (r.get("City") or "").strip(),
            "Salary range": (r.get("Salary Range") or "").strip().strip("-"),
            "Recruiter": (r.get("Recruiter") or "").strip(),
            "Job link": link,
        }

        if (title, applied, link) in existing:
            item, archived = existing[(title, applied, link)] or (None, False)
            if a.update_fields and item:
                # Archived cards cannot be edited: take the card out, edit it, put it back.
                if archived:
                    gh("project", "item-archive", proj, "--owner", owner, "--id", item, "--undo")
                set_fields(item, values)
                if archived:
                    gh("project", "item-archive", proj, "--owner", owner, "--id", item)
                print(f"✓ {n}/{len(rows)} fields updated: {title} (last update {values['Last update']})")
            else:
                print(f"- skip (already imported): {title} {applied}")
            continue

        source = (r.get("Source") or "").strip() or guess_source(link)
        raw_status = (r.get("Status") or "white").strip().lower()
        status = STATUS.get(raw_status, "Applied")
        period = period_of(r)

        body = "\n\n".join([
            section("Stage", "Wishlist (not applied yet)" if status == "Wishlist" else "Applied"),
            section("Source", source),
            section("Date", applied),
            section("Company", company),
            section("Position", position),
            section("Recruiter / contact", r.get("Recruiter")),
            section("City", r.get("City")),
            section("Salary range", values["Salary range"]),
            section("Job link", link),
            section("Timeline (imported)", response),
        ])
        labels = ["imported", SOURCE_LABEL.get(source, "source: other")]
        if period:
            labels.append(f"period: {period}")
        if raw_status in WITHDRAWN:
            labels.append("withdrawn interest")
        url = gh("issue", "create", "-R", repo, "--title", title, "--body", body,
                 "--label", ",".join(labels))

        item = json.loads(gh("project", "item-add", proj, "--owner", owner,
                             "--url", url, "--format", "json"))["id"]
        gh("project", "item-edit", "--id", item, "--project-id", project_id,
           "--field-id", status_field["id"], "--single-select-option-id", options[status])
        # No interviews in these statuses; for the others, fill in "Interviews" on the card yourself
        set_fields(item, {**values, "Interviews": 0 if status in NO_INTERVIEW else None})
        if status in CLOSED:
            gh("issue", "close", url, "--reason", "not planned")
        elif a.archive:
            gh("issue", "close", url, "--reason", "completed" if status == "Offer" else "not planned")
        if a.archive:
            gh("project", "item-archive", proj, "--owner", owner, "--id", item)
        print(f"✓ {n}/{len(rows)} {company} – {position} → {status}{' (archived)' if a.archive else ''}")
finally:
    if sync_off:
        subprocess.run(["gh", "workflow", "enable", "sync.yaml", "-R", repo], capture_output=True)
