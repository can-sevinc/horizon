---
name: weekly-plan
description: Make a short "what to do this week" plan for the user's job search from the project board - follow-ups due, upcoming interviews and next steps, wishlist jobs to apply for, and issues with missing data. Use when the user asks what to do this week, what is due, or how to plan their job search.
---

# Weekly plan

## Read the board

```bash
R=$(gh repo view --json nameWithOwner -q .nameWithOwner)
N=$(gh variable get PROJECT_NUMBER -R "$R")
gh project item-list "$N" --owner "${R%%/*}" --format json --limit 500
```

(`gh` needs the `project` scope: `gh auth refresh -s project`.) Each item has its Status,
**Applied date**, **Last update**, **Interviews**, and the issue. For the next steps, read the
comments of the open issues: `gh issue view NUMBER --comments` (the latest `**Next date:**`
and `**Next step:**`). Settings such as `followUpDays` and `ghostedDays` are in `config.yaml`.

## Make the plan

Today's date is the start. Group the open applications:

1. **This week**: a `**Next date:**` or a future **Last update** in the next 7 days (interviews, calls, deadlines), by date.
2. **Overdue**: a `**Next date:**` in the past with no newer comment.
3. **Follow up**: In progress with no **Last update** for `followUpDays`, and Applied for 1–2 weeks with no answer (not `on-pause`). Older than `ghostedDays`: suggest the `ghosted` label or closing it.
4. **Apply**: Wishlist items, oldest first. Saved more than 2 weeks ago: apply or drop.
5. **Fix the data**: no job description, Interviews empty for a status after an interview, no `period: …` label.

Keep it short: a checklist with the issue links, at most ~15 lines, the most urgent first.
End with 1–3 sentences on the week (for example: many applications but no interviews → look at the CV or the roles).

## Rules

- Read only. Do not change the board or the issues unless the user asks.
- For follow-ups, the user can use the `follow-up-email` skill and then `/followup +7` in the issue.
