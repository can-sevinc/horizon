# Instructions for AI coding agents

This repository tracks job applications: each application is a Github issue, on a Github Projects board. The workflows in `.github/workflows` (code in `.github/scripts`) keep the board up to date. Settings are in `config.yaml`. The documentation is at https://can-sevinc.github.io/horizon/ (a copy of Horizon keeps only `docs/images` and `docs/supported-sites.md`).

Rules:

- The issues are private data. Do not copy them outside the repository. Files in `data/` are not committed.
- Use only `gh`, `git`, and the scripts in this repository.
- Run the tests after a change to `.github/scripts` or `scripts/bookmarklet.src.js`: `node --test "tests/*.test.js"`

## Skills

The skills are in `skills/<name>/SKILL.md` (the Agent Skills format). `.claude/skills` and `.agents/skills` point to that folder. If your agent does not find skills by itself, read the `SKILL.md` of the task:

| Skill | Use it when |
| --- | --- |
| `skills/add-job-board` | The bookmark reads a job board wrong, or a new job board needs support |
| `skills/interview-prep` | The user has an interview coming up: prep notes, likely questions, questions to ask, as a comment |
| `skills/follow-up-email` | A follow-up or thank-you email draft for an application |
| `skills/add-application` | Add an application from a URL, a pasted posting, or a recruiter message (no bookmark) |
| `skills/weekly-plan` | What to do this week: next steps, follow-ups, wishlist, missing data |
| `skills/job-search-retro` | How the job search is going: funnel, sources, durations, advice (from the export) |
| `skills/recruiter-reply` | A reply draft to a recruiter message |
| `skills/data-cleanup` | Find and fix duplicates, missing descriptions, empty Interviews, wrong statuses |
| `skills/setup-doctor` | Something does not work, or check the setup: runs the Doctor workflow and explains the fixes |
| `skills/tailor-cv` | What to emphasize in the CV for a job; a cover letter draft |
| `skills/compare-offers` | Two or more offers side by side, with negotiation points |
| `skills/negotiate-offer` | A counter-offer email or call notes |
| `skills/ask-for-referral` | A referral request to a contact at the company |
| `skills/import-applications` | Import old applications from any spreadsheet, export, or notes (any language) |
