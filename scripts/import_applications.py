#!/usr/bin/env python3
"""Import applications from a JSON file (schema/applications.schema.json) into issues + the board.

The import-applications skill (skills/import-applications) makes the JSON from any spreadsheet,
export, or notes; the export workflow makes the same format.

Usage:
    python3 scripts/import_applications.py --check data/import/applications.json
    python3 scripts/import_applications.py data/import/applications.json USER/job-applications PROJECT_NUMBER
        [--dry-run] [--period P ...] [--archive] [--update-fields]

--check           Only check the file against the schema and config.yaml (no Github, no gh).
--dry-run         Show what the import would do, change nothing.
--period P        Import only the applications of period P. Use it more than once for more periods.
                  An application without a period gets one from the dates: a gap of more than
                  periodGapDays (config.yaml) starts a new period, named like 2025-12-to-2026-04.
--archive         Close every imported issue and archive its card, so it is not on the board.
--update-fields   For applications that are already imported, fill in the project fields again.

An application is imported once: the issue has a hidden "import-id" marker (or, for older
imports, the same title, Date, and Job link). So you can run it again.
"""
import read_config
import argparse, json, re, subprocess, sys, time
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

CONFIG = read_config.load()
STATUSES = [s["name"] for s in CONFIG["statuses"]]
SOURCE_LABEL = {s["option"]: s["label"] for s in CONFIG["sources"]}
CLOSED = {"Rejected after interview", "Rejected without interview"}
NO_INTERVIEW = {"Applied", "Rejected without interview"}
ISO = re.compile(r"\d{4}-\d{2}-\d{2}")
TEXT = ("position", "source", "period", "city", "salary", "recruiter", "link", "notes")


def is_date(v):
    if not isinstance(v, str) or not ISO.fullmatch(v):
        return False
    try:
        date.fromisoformat(v)
        return True
    except ValueError:
        return False


def check(data):
    """The problems of the file: a list of strings (empty: the file is OK)."""
    if not isinstance(data, dict) or data.get("version") != 1 or not isinstance(data.get("applications"), list):
        return ['The file must be {"version": 1, "applications": [...]}']
    errors, ids = [], set()
    for n, a in enumerate(data["applications"]):
        where = f"applications[{n}]"
        if not isinstance(a, dict):
            errors.append(f"{where}: not an object")
            continue
        where += f" ({a.get('company') or '?'})"
        err = lambda msg: errors.append(f"{where}: {msg}")
        if not a.get("id") or not isinstance(a["id"], str):
            err("id is missing")
        elif a["id"] in ids:
            err(f"id {a['id']!r} is not unique")
        ids.add(a.get("id"))
        if not isinstance(a.get("company"), str) or not a["company"].strip():
            err("company is missing")
        for k in TEXT:
            if a.get(k) is not None and not isinstance(a[k], str):
                err(f"{k} must be text")
        for k in ("date", "lastUpdate"):
            if a.get(k) is not None and not is_date(a[k]):
                err(f"{k} must be YYYY-MM-DD or null, not {a[k]!r}")
        if a.get("status") not in STATUSES:
            err(f"status {a.get('status')!r} is not one of {STATUSES}")
        if a.get("source") and a["source"] not in SOURCE_LABEL:
            err(f"source {a['source']!r} is not one of {list(SOURCE_LABEL)} (or empty)")
        if a.get("withdrawn") not in (None, True, False):
            err("withdrawn must be true or false")
        if a.get("interviews") is not None and (not isinstance(a["interviews"], int) or a["interviews"] < 0):
            err("interviews must be a number (0 or more) or null")
        for t in a.get("timeline") or []:
            if not isinstance(t, dict) or not isinstance(t.get("event"), str) or (t.get("date") is not None and not is_date(t["date"])):
                err(f"timeline entry {t!r} must be {{\"date\": \"YYYY-MM-DD\" or null, \"event\": \"...\"}}")
    return errors


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


def auto_periods(dates):
    """Period names from the dates: a gap of more than periodGapDays (config.yaml) between two
    applications starts a new period. A period is named by its first and last month:
    2025-12-to-2026-04, or 2025-12 when it is one month. Returns {date: name}."""
    names, group = {}, []
    days = sorted(set(dates))
    for n, d in enumerate(days):
        group.append(d)
        last = n == len(days) - 1
        if last or (date.fromisoformat(days[n + 1]) - date.fromisoformat(d)).days > CONFIG["periodGapDays"]:
            first, end = group[0][:7], group[-1][:7]
            names.update({x: first if first == end else f"{first}-to-{end}" for x in group})
            group = []
    return names


def period_of(a):
    """The period of the file, or the one made from the dates of the applications without one."""
    return (a.get("period") or "").strip() or AUTO.get(a.get("date") or "", "")


ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
ap.add_argument("json")
ap.add_argument("repo", nargs="?")
ap.add_argument("project", nargs="?")
ap.add_argument("--check", action="store_true", help="only check the file (no Github)")
ap.add_argument("--dry-run", action="store_true", help="show what would happen, change nothing")
ap.add_argument("--period", action="append", help="import only this period (repeatable)")
ap.add_argument("--archive", action="store_true", help="close the issues and archive the cards")
ap.add_argument("--update-fields", action="store_true", help="refill the fields of imported applications")
a = ap.parse_args()

data = json.loads(Path(a.json).read_text(encoding="utf-8"))
problems = check(data)
for p in problems:
    print(f"✗ {p}")
if problems:
    sys.exit(f"{len(problems)} problem(s) in {a.json}")
AUTO = auto_periods([x["date"] for x in data["applications"] if x.get("date") and not (x.get("period") or "").strip()])
apps = [x for x in data["applications"] if not a.period or period_of(x) in a.period]
warned = sum(1 for x in apps if x.get("warnings"))
print(f"✓ {a.json}: {len(apps)} applications" + (f", {warned} with warnings (see mapping.md)" if warned else ""))
counts = {}
for x in apps:
    counts[period_of(x) or "(no period: no date)"] = counts.get(period_of(x) or "(no period: no date)", 0) + 1
for p in sorted(counts):
    print(f"  period {p}: {counts[p]}" + (" (made from the dates)" if p in AUTO.values() else ""))
if a.check:
    sys.exit(0)
if not (a.repo and a.project):
    ap.error("repo and project are needed (or use --check)")

repo, proj = a.repo, a.project
owner, name = repo.split("/")
project_id = json.loads(gh("project", "view", proj, "--owner", owner, "--format", "json"))["id"]
fields = json.loads(gh("project", "field-list", proj, "--owner", owner, "--format", "json"))["fields"]
field_ids = {f["name"]: f["id"] for f in fields}
status_field = next(f for f in fields if f["name"] == "Status")
options = {o["name"]: o["id"] for o in status_field["options"]}
missing = ({f["name"] for f in CONFIG["fields"]} - field_ids.keys()) | (set(STATUSES) - options.keys())
if missing:
    sys.exit(f"Missing on the board: {sorted(missing)}. Run: bash scripts/setup.sh")


def set_fields(item, values):
    """Set several project fields of one item in a single GraphQL request."""
    parts = []
    for n, (fname, value) in enumerate(values.items()):
        if value is None or value == "":
            continue
        kind = "date" if isinstance(value, date) else "number" if isinstance(value, int) else "text"
        parts.append(f'f{n}: updateProjectV2ItemFieldValue(input:{{projectId:"{project_id}", itemId:"{item}", '
                     f'fieldId:"{field_ids[fname]}", value:{{{kind}:{json.dumps(value if kind == "number" else str(value))}}}}}) {{ clientMutationId }}')
    if parts:
        gh("api", "graphql", "-f", "query=mutation{ " + " ".join(parts) + " }")


def existing_issues():
    """import-id, and (title, Date, Job link) for older imports -> (card id, archived?) or None."""
    sec = lambda body, title: body.split(f"### {title}\n\n", 1)[-1].split("\n", 1)[0].strip()
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
            items = [(p["id"], p["isArchived"]) for p in i["projectItems"]["nodes"] if str(p["project"]["number"]) == proj]
            card = items[0] if items else None
            m = re.search(r"<!-- import-id: (.+?) -->", i["body"] or "")
            if m:
                out[m.group(1)] = card
            link = sec(i["body"] or "", "Job link")
            out[(i["title"], sec(i["body"] or "", "Date"), "" if link == "_No response_" else link)] = card
        if not page["pageInfo"]["hasNextPage"]:
            return out
        after = page["pageInfo"]["endCursor"]


existing = existing_issues()
periods = sorted({period_of(x) for x in apps} - {""})
if a.dry_run:
    print(f"(dry run: nothing changes) labels: {', '.join('period: ' + p for p in periods) or '-'}")
else:
    for period in periods:
        gh("label", "create", f"period: {period}", "-R", repo, "-c", CONFIG["periodLabelColor"],
           "-d", "Job search period", "--force")

# The sync workflow would run once per new issue; it is not needed for imported issues.
sync_off = not a.dry_run and subprocess.run(["gh", "workflow", "disable", "sync.yaml", "-R", repo],
                                            capture_output=True).returncode == 0
try:
    for n, x in enumerate(apps, 1):
        company, position = x["company"].strip(), (x.get("position") or "").strip()
        title = f"[{company}] {position}"
        link = (x.get("link") or "").strip()
        applied = date.fromisoformat(x["date"]) if x.get("date") else None
        values = {
            "Applied date": applied,
            "Last update": date.fromisoformat(x["lastUpdate"]) if x.get("lastUpdate") else applied,
            "Company": company, "Position": position,
            "City": x.get("city"), "Salary range": x.get("salary"), "Recruiter": x.get("recruiter"), "Job link": link,
        }
        key = x["id"] if x["id"] in existing else (title, x.get("date") or "", link)
        if key in existing:
            item, archived = existing[key] or (None, False)
            if a.update_fields and item:
                if a.dry_run:
                    print(f"~ {n}/{len(apps)} would update the fields: {title}")
                    continue
                # Archived cards cannot be edited: take the card out, edit it, put it back.
                if archived:
                    gh("project", "item-archive", proj, "--owner", owner, "--id", item, "--undo")
                set_fields(item, values)
                if archived:
                    gh("project", "item-archive", proj, "--owner", owner, "--id", item)
                print(f"✓ {n}/{len(apps)} fields updated: {title}")
            else:
                print(f"- skip (already imported): {title} {x.get('date') or ''}")
            continue

        status = x["status"]
        source = x.get("source") or guess_source(link)
        period = period_of(x)
        timeline = "\n".join(f"- {t.get('date') or '?'}: {t['event']}" for t in x.get("timeline") or [])
        body = "\n\n".join([
            section("Stage", "Wishlist (not applied yet)" if status == "Wishlist" else "Applied"),
            section("Source", source),
            section("Date", x.get("date")),
            section("Company", company),
            section("Position", position),
            section("Recruiter / contact", x.get("recruiter")),
            section("City", x.get("city")),
            section("Salary range", x.get("salary")),
            section("Job link", link),
            section("Timeline (imported)", timeline),
            section("Notes (imported)", x.get("notes")),
            f"<!-- import-id: {x['id']} -->",
        ])
        labels = ["imported", SOURCE_LABEL.get(source, "source: other")]
        if period:
            labels.append(f"period: {period}")
        if x.get("withdrawn"):
            labels.append("withdrawn interest")
        interviews = x.get("interviews")
        if interviews is None and status in NO_INTERVIEW:
            interviews = 0
        closes = status in CLOSED or a.archive
        if a.dry_run:
            print(f"+ {n}/{len(apps)} would create: {title} → {status}, {', '.join(labels)}"
                  + (", closed" if closes else "") + (", archived" if a.archive else ""))
            continue

        url = gh("issue", "create", "-R", repo, "--title", title, "--body", body, "--label", ",".join(labels))
        item = json.loads(gh("project", "item-add", proj, "--owner", owner, "--url", url, "--format", "json"))["id"]
        gh("project", "item-edit", "--id", item, "--project-id", project_id,
           "--field-id", status_field["id"], "--single-select-option-id", options[status])
        set_fields(item, {**values, "Interviews": interviews})
        if closes:
            gh("issue", "close", url, "--reason", "completed" if status == "Offer" else "not planned")
        if a.archive:
            gh("project", "item-archive", proj, "--owner", owner, "--id", item)
        print(f"✓ {n}/{len(apps)} {company} – {position} → {status}{' (archived)' if a.archive else ''}")
finally:
    if sync_off:
        subprocess.run(["gh", "workflow", "enable", "sync.yaml", "-R", repo], capture_output=True)
