---
name: import-applications
description: Turn the user's old job application data - a spreadsheet (CSV, TSV, XLSX), a Notion, Trello, or Airtable export, Markdown or plain-text notes, a pasted list, in any language - into the standard JSON file, check it, and show the import command. Use when the user wants to import or migrate their old applications into the tracker.
---

# Import applications

The goal is `data/import/applications.json` in the format of `schema/applications.schema.json`,
plus `data/import/mapping.md` with your decisions. `data/` is not committed: the data stays local.
You never import yourself: at the end, you give the user the command.

## 1. Read the input

- Find the format: CSV/TSV (the delimiter and the encoding), XLSX (every sheet), JSON exports,
  Markdown tables, plain text, a pasted email list, a screenshot.
- Is there a header row? Several tables or sheets (for example one per year)?
- The language: understand the words in any language from their meaning (month names,
  "rejected", "abgelehnt", "avslag", "red", "no answer"), not from a fixed list.
- Colors or emojis can mean a status: look for a legend, or ask.

## 2. Map the columns

Map each column to a field of the schema: `company, position, date, status, withdrawn, source,
period, city, salary, recruiter, link, interviews, lastUpdate, timeline, notes`. What does not
fit goes to `notes`, and the whole raw row goes to `original`. Show the mapping table to the user.

## 3. Values

- **status**: exactly a `statuses[].name` of `config.yaml`. Rejected after an interview or
  before: decide from the evidence of an interview (an interview date, "2nd round", …).
  You stopped the process: `Rejected without interview` and `withdrawn: true`.
  "No answer for months": `Applied` (the system marks it ghosted).
- **source**: exactly a `sources[].option` of `config.yaml`, or empty (the script guesses it from the link).
- **date**: `YYYY-MM-DD`. When the year is missing, guess it from the order and the context, and add a `warnings` entry.
- **timeline**: the events with dates (`{"date": "YYYY-MM-DD", "event": "First interview"}`). Dates go
  forward from the application date (December, then January of the next year).
  A date in the future, or with "apply" or "call on", is a plan, not an event.
- **lastUpdate**: the date of the last real event (not a plan); empty: the application date.
- **interviews**: the number of interviews when the data shows it; else `null`.
- **period**: leave it empty. The script makes the periods from the dates: a gap of more than
  `periodGapDays` (`config.yaml`) starts a new period, named by its first and last month
  (`2025-12-to-2026-04`). Set it only when the user has their own names (for example a sheet
  per job search), and then for all applications of that search.
- **id**: stable and unique: the sheet name and row number (`2023!14`), so a second run skips it.

## 4. Ask, do not guess silently

Ask at most a few grouped questions, only for what changes many rows (for example "Does yellow
mean on hold or withdrawn?"). For a single unclear row, decide and add a `warnings` entry.

## 5. Write and check

1. Write `data/import/applications.json`:
   `{"version": 1, "generatedBy": "import-applications skill", "applications": [...]}`
2. Write `data/import/mapping.md`: the column mapping, the status and color decisions, the
   period groups, and the list of warnings.
3. Check: `python3 scripts/import_applications.py --check data/import/applications.json`.
   Fix the problems and check again until it passes.

## 6. Hand over

Show the user a summary (the periods that `--check` printed, the number of applications per status, the warnings) and the commands:

```bash
python3 scripts/import_applications.py data/import/applications.json OWNER/REPO PROJECT_NUMBER --dry-run
python3 scripts/import_applications.py data/import/applications.json OWNER/REPO PROJECT_NUMBER
```

(`OWNER/REPO`: `gh repo view --json nameWithOwner -q .nameWithOwner`; `PROJECT_NUMBER`:
`gh variable get PROJECT_NUMBER`.) Add `--period P` to import some periods only, and `--archive`
for old periods that should not be on the board.
