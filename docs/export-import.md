---
title: Export, archive, import
nav_order: 6
---

# {% include icon.html name="transfer" %} Export, archive, and import
{: #export-archive-and-import }

Export your applications to keep a copy, archive an old search to clear the board, or bring in data from another tool.

## Export

Run **Actions** > **Export**. Choose a period if you only want that search. You can also leave out archived cards.

When the run finishes, download the **applications** artifact. It contains `applications.json` and `applications.csv`. Github keeps the download for 7 days. From your repository folder, you can download it with:

```bash
gh run download --name applications
```

## Archive a period

When a search is over, run **Actions** > **Archive a period**. Enter its name, for example `2026`. You can also choose to close the open issues in that period.

The cards leave the board, but the issues stay. Reminders and summaries do not use archived cards. To bring the cards back, open **Archived items** in the project's menu.

---

## Import old data

You need Python 3 and `gh` on your computer. Keep the import files in `data/`; git ignores that folder.

### From a JSON file

The file must follow `schema/applications.schema.json`, which is also the export format. The `import-applications` skill can help turn a spreadsheet, another tool's export, or your notes into this format.

Check the file, preview the import, then run it:

```bash
python3 scripts/import_applications.py --check data/import/applications.json
python3 scripts/import_applications.py data/import/applications.json USER/job-applications PROJECT_NUMBER --dry-run
python3 scripts/import_applications.py data/import/applications.json USER/job-applications PROJECT_NUMBER
```

Replace `USER/job-applications` and `PROJECT_NUMBER` with your own values. `--check` validates the file. `--dry-run` shows what would happen. Already imported applications are skipped.

### From a CSV file

Use these column names: `Date, Company, Position, Recruiter, City, Salary Range, Job Link, Response, Status`. `Source` and `Period` are optional.

- **Status** can be a status name or an old row color: `pink` is Wishlist, `white` Applied, `green` In progress, `purple` Offer, `red` Rejected after interview, `gray` Rejected without interview, and `yellow` withdrawn. An empty status means Applied.
- Without a **Period** column, a gap of more than 90 days starts a new period. Change `periodGapDays` in `config.yaml` to use another gap.
- **Response** becomes a timeline in the issue. The last date becomes **Last update**. For example, `Position filled. 9 oct rejected` uses October 9.

```bash
python3 scripts/import_csv.py data/applications.csv USER/job-applications PROJECT_NUMBER
```

Both scripts skip applications already imported. `--period 2023` limits the import to that period; you can repeat the option. `--archive` closes the imported issues and archives their cards. `--update-fields` fills the project fields again for existing imported applications.
