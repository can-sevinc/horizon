---
title: AI agent skills
nav_order: 11
---

# {% include icon.html name="skills" %} AI agent skills
{: #ai-agent-skills }

The `skills/` folder has task instructions for AI coding agents, such as Claude Code or Codex. Open the agent in your own copy of Horizon and ask for what you need.

For example: "Help me prepare for the interview in issue #42." You do not need to remember the skill name.

## Available skills

| Skill | What it helps with |
| --- | --- |
| `add-application` | Save a job from a link, pasted post, or recruiter message |
| `import-applications` | Bring in a spreadsheet, export, or old notes |
| `interview-prep` | Prepare for an interview |
| `tailor-cv` | Adjust your CV for a job or draft a cover letter |
| `follow-up-email` | Write a follow-up or thank-you email |
| `recruiter-reply` | Reply to a recruiter |
| `ask-for-referral` | Ask a contact for a referral |
| `compare-offers` | Compare the details of your offers |
| `negotiate-offer` | Draft a counter-offer |
| `weekly-plan` | Decide what to do this week |
| `job-search-retro` | Look at what worked in your search |
| `data-cleanup` | Find duplicates, missing data, and wrong statuses |
| `setup-doctor` | Check the setup and explain the fixes |
| `add-job-board` | Add support for a job site |

---
{: .divider-large }

## How the agent finds them

`.claude/skills` and `.agents/skills` link to the `skills/` folder. `AGENTS.md` lists the tasks for other agents. If your agent does not find a skill, ask it to read `skills/NAME/SKILL.md`.

The skills use `gh`, `git`, and the repository's scripts. They read the application details needed for the task. Check a draft before sending it, and check proposed data changes before applying them.
