---
name: tailor-cv
description: Compare a job description with the user's CV and say what to emphasize, what to reword, and what is missing; optionally draft a cover letter. Use when the user is about to apply and asks to tailor their CV or write a cover letter for a job.
---

# Tailor the CV

## Inputs

- The job: an issue (`gh issue view NUMBER`: **Job description / recruiter message**), a URL, or pasted text.
- The CV: a file the user names (for example in `data/`, which is not committed) or pasted text.
  Ask; do not search the computer for it.

## Steps

1. From the job description, list the requirements: must-have, nice-to-have, and the words
   the posting repeats (the stack, the domain, the seniority).
2. Map each requirement to the CV: **shown** (where), **there but hidden** (say how to bring it
   forward), or **missing**.
3. Suggest changes, at most ~10, most important first:
   - the summary line for this role,
   - which bullets to move up, cut, or reword with the posting's words (only true claims),
   - numbers to add where the CV has none (ask the user for them; do not invent them).
4. If the user wants a cover letter: 150–250 words, in the language of the posting. Why this
   company (from the posting, not generic), two matches with proof, one line on a gap if it
   matters, a plain close.
5. Suggest a version name for the form field **CV / cover letter version**, for example
   `cv-backend-2026-11`, so the weekly summary can compare CV versions.

## Rules

- Never add experience, skills, or numbers that the user does not have.
- Do not change the user's CV file unless they ask; give the changes as a list or a new file in `data/`.
