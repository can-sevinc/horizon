---
title: Settings and files
nav_order: 7
---

# {% include icon.html name="settings" %} Settings and files
{: #settings-and-files }

Change `config.yaml` in your copy, then run **Actions** > **Setup** or `bash scripts/setup.sh`. This keeps the board, labels, form, and workflow times in line with your settings.

## Settings

Each setting has a short comment in the file. These are the ones you will probably use first:

| Setting | Key |
| --- | --- |
| Board name | `projectTitle` |
| Time zone | `timezone` |
| Daily reminder time | `reminderTime` |
| Weekly summary day and time | `summaryDay`, `summaryTime` |
| Daily setup check time | `doctorTime` |
| Default city and salary example | `city`, `salaryPlaceholder` |
| Days before a follow-up reminder; default 10 | `followUpDays` |
| Days before the ghosted label; default 30 | `ghostedDays` |
| Gap between imported searches; default 90 days | `periodGapDays` |
| Token expiry warning; default 14 days before | `tokenWarnDays` |
| Statuses, fields, sources, and labels | `statuses`, `fields`, `sources`, `labels` |
| Job board hosts | `jobBoards` |
| Repository to get updates from | `templateRepo` |
| Anonymous board counter | `telemetry` |
| Address of shared logos, icons, and screenshots | `assetsUrl` |

The other form fields are in `.github/ISSUE_TEMPLATE/application.yaml`. If you change **Source** options, check `sources` and `scripts/bookmarklet.src.js` too.

## Local times

Github runs schedules in UTC. Setup writes the UTC times for your time zone. If your zone has summer time, the workflow gets two schedule lines and only the right one does the work.

Changing files in `.github/workflows` needs a token with the `workflow` scope. If the token does not have it, Setup tells you which files to change yourself.

---
{: .divider-double }

## {% include icon.html name="sites" %} Shared images
{: #shared-images }

Your private copy does not keep the docs site or its images. The README and workflow comments load images from `assetsUrl`. The default is Horizon's public `/assets/v1` address.

In a comment template, `{% raw %}{{icon:interview}}{% endraw %}` adds the interview icon. The renderer chooses the light and dark versions for Github. The file in `templates/comments/README.md` explains the other placeholders.

If you host your own assets, keep the `brand`, `icons`, and `screenshots` folders under your new address. Then change `assetsUrl`. Do not point it at your private application data.

---

## Files in your copy

| Path | What it is |
| --- | --- |
| `config.yaml` | Your settings |
| `.github/workflows/`, `.github/scripts/` | Workflows and their code |
| `.github/ISSUE_TEMPLATE/application.yaml` | The new application form |
| `templates/application.yaml` | A link to the form above |
| `templates/comments/` | Comment templates you can edit |
| `scripts/setup.sh` | Setup on your computer |
| `scripts/bookmarklet.src.js` | Bookmark code |
| `scripts/import_applications.py`, `scripts/import_csv.py` | Import scripts |
| `schema/applications.schema.json` | The import and export format |
| `skills/`, `AGENTS.md` | Instructions for AI coding agents |
| `.github/template-version` | The version saved by the Update workflow |
| `docs/supported-sites.md` | The site list; this stays in your copy |
| `tests/` | Tests: `node --test "tests/*.test.js"` |

Horizon's original repository also has this docs site, `templates/README.md`, and the shared images in `docs/assets/v1/`. Setup removes those files from a private copy. Updates do not add them back.

If you change the bookmark code, run `bash scripts/make_bookmarklet.sh USER/job-applications` and replace the bookmark in your browser.
