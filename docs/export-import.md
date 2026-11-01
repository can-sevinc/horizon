---
title: Export, archive, import
nav_order: 6
---

# Export, archive, and import

## Export

Run **Actions** > **Export**. You can limit it to one period and leave out archived cards. When it finishes, download the **applications** artifact from the run, or use `gh run download --name applications`. It has `applications.json` and `applications.csv`, and Github keeps it for 7 days.

## Archive a period

When a job search is over, you can take its cards off the board. The issues stay.

Run **Actions** > **Archive a period** and type the period, for example `2026`. You can also close the open issues of that period. Archived cards are not used by the reminders or the summary, and you can restore them from **Archived items** in the project menu.

## Import old data

### From a JSON file

`scripts/import_applications.py` imports a file in the format of `schema/applications.schema.json`, the same format as the export. An AI agent can make this file from almost anything (a spreadsheet, a Notion or Trello export, notes in any language) with the `import-applications` skill.

```bash
python3 scripts/import_applications.py --check data/import/applications.json
python3 scripts/import_applications.py data/import/applications.json USER/job-applications PROJECT_NUMBER --dry-run
python3 scripts/import_applications.py data/import/applications.json USER/job-applications PROJECT_NUMBER
```

`--check` only validates the file. `--dry-run` shows what would happen. Each application is imported only once, so you can run it again safely.

### From a CSV file

Your spreadsheet needs these columns: `Date, Company, Position, Recruiter, City, Salary Range, Job Link, Response, Status`. `Source` and `Period` are optional.

- **Status** can be a status name or a row color: `pink` Wishlist, `white` Applied, `green` In progress, `purple` Offer, `red` Rejected after interview, `gray` Rejected without interview, `yellow` withdrawn. Empty means Applied.
- Without a `Period` column, a gap of more than 90 days between applications starts a new period (`periodGapDays` in `config.yaml`).
- **Response** goes into the issue as a timeline. Its last date becomes **Last update**, so `Position filled. 9 oct rejected` gives October 9.

Save the CSV in `data/` (git ignores it) and run:

```bash
python3 scripts/import_csv.py data/applications.csv USER/job-applications PROJECT_NUMBER
```

Both scripts skip rows that are already imported. Useful options: `--period 2023` imports only one period (you can repeat it), `--archive` closes the issues and archives the cards, and `--update-fields` fills in the project fields again.
