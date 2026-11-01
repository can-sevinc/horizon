---
name: follow-up-email
description: Draft a short follow-up or thank-you email for one of the user's job applications, from its status and the last event in the issue. Use when the user asks for a follow-up, a thank-you after an interview, or what to write to a company that has not answered.
---

# Follow-up email

## Inputs

- The issue number of the application (or the company name: find it with
  `gh issue list --state all --search "COMPANY in:title" --json number,title,state`).
- Optional: what kind of email (follow-up after applying, thank-you after an interview, asking about the next step, answering an offer), and to whom.

## Steps

1. Read the issue and its comments: `gh issue view NUMBER --comments`. Find:
   - the status (the labels and the latest `Applied:`, `## Interview:`, `On hold:`, `## Offer:` comments),
   - the last event and its date, and the planned `**Next date:**` if there is one,
   - the recruiter or contact (**Recruiter / contact**), the position, and the company,
   - from the interview notes: one or two concrete things that were discussed.

2. Pick the kind of email, if the user did not say:
   | Situation | Email |
   | --- | --- |
   | Applied, no answer for 1–2 weeks | A short follow-up: still interested, one line on the fit, a question about the timeline |
   | An interview in the last 2 days | A thank-you: one concrete thing from the interview, interest, the next step |
   | A `**Next date:**` has passed with no news | Ask about the next step, politely |
   | Offer | Thanks, and the questions or the answer the user wants to give |

3. Write the draft, in the language of the issue (or the language the user asks for):
   - A subject line.
   - 4–8 sentences. Plain and friendly. No flattery, no pressure, no "just checking in" without a reason.
   - Use only facts from the issue. Leave a `[…]` placeholder for anything you do not know (a name, a date).

4. Show the draft. Do not send it: the user sends it.

5. After the user sent it, offer to record it: they can write `/followedup +7` in the issue
   (adds the `followed up` label, sets Last update to today, and plans a check for an answer in 7 days).
