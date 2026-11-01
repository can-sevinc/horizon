---
title: Settings and files
nav_order: 7
---

# Settings and files

## Settings

All settings are in `config.yaml`, each with a short comment. After a change, run the setup again (**Actions** > **Setup** or `bash scripts/setup.sh`) so the board, labels, form, and workflow times match.

| Setting | Key |
| --- | --- |
| Time zone | `timezone` |
| Daily reminder time | `reminderTime` |
| Weekly summary day and time | `summaryDay`, `summaryTime` |
| Daily setup check time | `doctorTime` |
| Default city and salary example in the form | `city`, `salaryPlaceholder` |
| Days before a follow-up reminder (10) | `followUpDays` |
| Days before the `ghosted` label (30) | `ghostedDays` |
| Days without applications that start a new period in an import (90) | `periodGapDays` |
| Warn this many days before the token expires (14) | `tokenWarnDays` |
| Statuses, fields, sources, labels | `statuses`, `fields`, `sources`, `labels` |
| Job boards | `jobBoards` |
| Where updates come from | `templateRepo` |
| The anonymous install counter | `telemetry` |

The other form fields are in `.github/ISSUE_TEMPLATE/application.yaml`. If you change the **Source** options, update `sources` and `scripts/bookmarklet.src.js` too.

Github runs schedules in UTC. Each scheduled workflow has one line for summer time and one for winter time, and only the right one does the work, so reminders arrive at the same local time all year. To change these times, the token needs the `workflow` scope. Without it, the setup tells you which files to edit.

## Files

| Path | What it is |
| --- | --- |
| `config.yaml` | The settings |
| `.github/workflows/`, `.github/scripts/` | The workflows and their code |
| `.github/ISSUE_TEMPLATE/application.yaml` | The new application form (Github needs it here) |
| `templates/` | The form (a link to the file above), the interview notes template, and the README of a new copy |
| `docs/images/` | Screenshots for the docs and the setup issues |
| `scripts/setup.sh` | The setup on your computer |
| `scripts/bookmarklet.src.js` | The bookmark code. After a change, run `bash scripts/make_bookmarklet.sh USER/job-applications` |
| `scripts/import_applications.py`, `scripts/import_csv.py` | The importers |
| `schema/applications.schema.json` | The import and export format |
| `skills/`, `AGENTS.md` | Instructions for AI coding agents |
| `.github/template-version` | The template version you have, written by the Update workflow |
| `docs/` | This documentation. A copy keeps only `docs/images` and `docs/supported-sites.md`. |
| `tests/` | Tests: `node --test "tests/*.test.js"` |
