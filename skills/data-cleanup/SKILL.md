---
name: data-cleanup
description: Find problems in the user's job application data - duplicates, missing job descriptions, empty Interviews, a status that does not match the comments, missing labels - and fix them one by one with the user's OK. Use when the user asks to clean up, check, or fix their applications or board.
---

# Data cleanup

## Read

```bash
R=$(gh repo view --json nameWithOwner -q .nameWithOwner)
N=$(gh variable get PROJECT_NUMBER -R "$R")
gh project item-list "$N" --owner "${R%%/*}" --format json --limit 500
gh issue list -R "$R" --state all --limit 1000 --json number,title,state,stateReason,labels,body
```

The form sections in the body are `### Section` headings (`.github/ISSUE_TEMPLATE/application.yaml`).
The statuses, fields, sources, and labels are in `config.yaml`. Skip issues with the labels
`summary`, `setup`, and `maintenance`.

## Look for

| Problem | How to find it | Fix |
| --- | --- | --- |
| Duplicates | The same **Job link** (without `www.`, `?…`, `/` at the end), or the same company + position | Close one as a duplicate of the other (or `/moved #N` in it) |
| No job description | **Job description / recruiter message** is `_No response_` | Ask the user to paste it; it cannot be recovered later |
| Interviews empty | Status In progress, On hold, Offer, or Rejected after interview, and **Interviews** empty or 0 | Count the `## Interview:` comments; set the field |
| Wrong status | Closed but the status is Applied or In progress; open but rejected; `## Interview:` comments but Rejected without interview (and not `withdrawn interest`) | Set the status (Rejected after / without interview by the interviews) |
| Not on the board | An application issue that is not in the item list | `gh project item-add "$N" --owner OWNER --url ISSUE_URL` |
| Labels | No `source: …` or `period: …` label | Edit the issue (the sync workflow adds them), or add the label |
| Dates | **Date** not `YYYY-MM-DD`, or in the future for an Applied card | Fix the Date in the issue |

## Fix

1. Show a list grouped by problem, with the issue links and the fix for each.
2. Change nothing before the user agrees. They can agree to a group at once.
3. Make the fixes with `gh` (`gh issue edit`, `gh issue close`, `gh project item-edit`). After an
   edit of an issue body, the sync workflow updates the card.
4. At the end: what you changed, and what is left for the user.
