---
title: Supported sites
nav_order: 8
---

# Supported sites

The sites where the bookmark (`scripts/bookmarklet.src.js`) reads the job post. On any other site,
the bookmark still works: it takes the company from the JobPosting data of the page (most job
sites have it), or else from the host name.

To add a site, or to fix one that the bookmark reads wrong, use the `add-job-board` skill
(`skills/add-job-board/SKILL.md`). The skill updates this list too.

**Type:** a *job board* has posts of many companies; its links get **Source: Job board** (its host is
in `jobBoards` in `config.yaml`). An *ATS* hosts the career pages of companies; its links get
**Source: Company website**.

| Site | Type | Example link | Company and position from | Description from | Tested |
| --- | --- | --- | --- | --- | --- |
| LinkedIn | LinkedIn | `linkedin.com/jobs/view/ID`, `linkedin.com/jobs/...?currentJobId=ID` | Page title | Description element | - |
| LinkedIn profile | Recruiter outreach | `linkedin.com/in/NAME` | Name and profile link go to **Recruiter / contact** | - | - |
| The Hub | Job board | `thehub.io/jobs/ID` | Page title (`The Hub \| Position \| Company`) | JobPosting | 2026-11-03 |
| Platsbanken (Arbetsförmedlingen) | Job board | `arbetsformedlingen.se/platsbanken/annonser/ID` | Headings (h1, h2), or the page title | Description element | 2026-11-03 |
| Indeed | Job board | `se.indeed.com/viewjob?jk=ID`, a search with `vjk=ID` | Header elements, or JobPosting | Description element | Not yet (bot check) |
| Ashby | ATS | `jobs.ashbyhq.com/COMPANY/ID` | JobPosting | JobPosting | 2026-11-03 |
| Jobylon | ATS | `emp.jobylon.com/jobs/ID-...` | Page title (`Position - Company \| Jobylon`) | Longest text block | 2026-11-03 (title only) |
| Greenhouse | ATS | `boards.greenhouse.io/COMPANY/jobs/ID` | Link path, then JobPosting | JobPosting or description element | - |
| Lever | ATS | `jobs.lever.co/COMPANY/ID` | Link path, then JobPosting | JobPosting or description element | - |
| Workable, SmartRecruiters | ATS | `apply.workable.com/COMPANY/...` | Link path, then JobPosting | JobPosting | - |
| Workday | ATS | `COMPANY.wd3.myworkdayjobs.com/...` | Subdomain, then JobPosting | Description element | - |
| Teamtailor, BambooHR, Recruitee, Personio, Breezy, Homerun, Workbuster | ATS | `COMPANY.teamtailor.com/jobs/ID` | Subdomain, then JobPosting | JobPosting | - |
| Other company sites | Company website | any | JobPosting, or the host name | JobPosting, or the longest text block | - |

"Tested": the date someone checked the site with the bookmark on a real post.
