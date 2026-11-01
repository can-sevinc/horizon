---
name: job-search-retro
description: Analyze the user's job search from the export (applications.json) - which sources, CV versions, and role types lead to interviews, how long the steps take, where applications stop - and give concrete advice. Use when the user asks how their job search is going, what works, or for a retrospective of a period.
---

# Job search retro

## Get the data

1. Run the export and download it (it is not committed: keep it in `data/`):
   ```bash
   gh workflow run export.yaml -f period=PERIOD    # or without -f for all periods
   gh run watch "$(gh run list --workflow export.yaml --limit 1 --json databaseId -q '.[0].databaseId')"
   gh run download --name applications --dir data/export
   ```
2. Read `data/export/applications.json` (`applications[]`: company, position, date, status,
   withdrawn, source, period, interviews, lastUpdate, timeline, labels, …). The statuses are
   the `statuses` of `config.yaml`.

## Analyze

Compute, and show as small tables:

- **Funnel**: applied → answered (status not Applied) → interview (`interviews > 0`) → offer. With rates.
- **By source** and **by CV version** (the `CV / cover letter version` is not in the export: read it from the issues with `gh issue view` only if the user wants it): applications, interview rate.
- **By role type**: group the positions (for example backend / data / lead) and compare the interview rates.
- **Durations** in days: applied → first answer, applied → first interview, applied → rejection. Median, not average, with the number of applications.
- **Where it stops**: rejected without interview vs. after interview; `ghosted` labels; `withdrawn`.
- **Over time**: applications per week, and whether the interview rate changes.

Small numbers: say when a group has fewer than ~5 applications, and do not draw strong conclusions from it.

## Advise

3–6 concrete points, each tied to a number above. For example: "LinkedIn Easy Apply: 40 applications, 1 interview; referrals: 5, 3 interviews → ask for more referrals." No generic advice.

## Rules

- The data is private: do not send it anywhere, and do not commit `data/`.
