---
title: Supported sites
nav_order: 9
---

# Supported sites

The bookmark reads the job posts on these sites. On other sites, it tries the page's JobPosting data first, then the host name. You can also select the description text before clicking the bookmark.

A **job board** lists jobs from many companies. Its links get **Source: Job board** when the host is in `jobBoards` in `config.yaml`. An **ATS** is software a company uses for its hiring pages. Those links get **Source: Company website**.

---

| Site | Type | Example link | Company and position from | Description from | Tested |
| --- | --- | --- | --- | --- | --- |
| LinkedIn | LinkedIn | `linkedin.com/jobs/view/ID`, `linkedin.com/jobs/...?currentJobId=ID` | Page title | Description element, or the text from **About the job** to **… more** | - |
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


The **Tested** column records a check on a real job post. A dash means there is no recorded live check. Automated tests use saved example pages in `tests/sites`; that is different from checking a live site.

---

## Add or fix a site

Ask your coding agent to use `skills/add-job-board/SKILL.md`. Give it the job link and say which values are wrong. The skill updates the bookmark and this list.
