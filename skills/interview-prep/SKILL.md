---
name: interview-prep
description: Prepare the user for an interview for one of their job applications. Reads the application issue (job description, first impressions, earlier /interview notes) and writes prep notes, likely questions, and questions to ask, as a comment on the issue. Use when the user has an interview coming up, or asks to prepare for one.
---

# Interview prep

## Inputs

- The issue number of the application. If the user gives a company name instead, find it:
  `gh issue list --state all --search "COMPANY in:title" --json number,title,state`
- Optional: the interview type (screen, technical, onsite, final), the interviewer, and the date.
- Optional: the user's CV, if they have one in `data/` (not committed). Ask before you read other files.

## Steps

1. Read the issue and its comments: `gh issue view NUMBER --comments`.
   - **Job description / recruiter message**: the role, the requirements, the stack, the company.
   - **First impressions**: what the user thinks of the role.
   - Earlier `## Interview:` comments: what they asked, what the user learned, the impression, the next step.
   - `### Next step` comments: what is planned.
   If there is no job description, say so and ask the user to paste it (postings get removed).

2. Write the prep notes, in the language of the issue:
   - **The role in 3 lines**: what they need, in plain words.
   - **Match**: the requirements the user meets (from the CV or the notes) and the gaps, with a short way to talk about each gap.
   - **Likely questions** (8–12): from the requirements and the interview type. For a later round, build on what earlier rounds asked; do not repeat them.
   - **Stories to prepare** (3–5): situations the user should tell (STAR: situation, task, action, result), each mapped to a requirement.
   - **Questions to ask** (5–8): about the team, the work, the process, and what is unclear in the posting or the earlier notes. No questions that the posting already answers.
   - **Practical**: the date, who, the format, what to have ready. Only what you know; no guesses.

3. Show the notes to the user. Change them if they ask.

4. When the user agrees, write them as a comment. Write the text to a file first, so the formatting stays:
   `gh issue comment NUMBER --body-file FILE`
   Start the comment with `## Interview prep: YYYY-MM-DD`. Do not start it with a `/` command:
   a comment that starts with `/interview` or `/next` runs a workflow.

## Rules

- Do not invent facts about the company. Mark what you assume.
- After the interview, remind the user to write `/interview TYPE` in the issue: it adds the notes template and counts the interview on the board.
