---
title: Update an application
nav_order: 4
---

# Update an application

Move the card on the board, or write a command in a comment. Everything else you want to remember can go in normal comments.

## Comment commands

Start a comment with one of these. Only the repository owner can use them, and they work in the Github mobile app too.

| Command | What it does |
| --- | --- |
| `/interview` | Turns the comment into interview notes. **Interviews** goes up by 1. |
| `/interview technical` | Same, with the interview type filled in |
| `/next 2026-12-01 call the recruiter` | Plans the next step. **Last update** gets that date. Wishlist or Applied becomes In progress. |
| `/next +7 they will answer` | Same, 7 days from today |
| `/applied` | You applied for a wishlist job. Status becomes Applied, and the dates become today. |
| `/applied 2026-10-20 sent by email` | Same, with a date and a note |
| `/hold summer vacation` | Status becomes On hold |
| `/offer` | Status becomes Offer. The comment turns into an offer template (salary, benefits, start date, answer date). |
| `/followup +7` | You sent a follow-up. Adds the `followed up` label and plans a check in 7 days. |
| `/withdraw not a fit` | You stopped the process. Closes the issue as Rejected without interview with the `withdrawn interest` label. |
| `/moved #296` | The company moved you to another process. Closes this issue as a duplicate of #296. |
| `/period 2026-03` | Moves the application to another period |
| `/rejected position filled` | Closes the issue and sets the right rejected status. The reason is optional. |

## Project fields

The fields come from the issue form. They are filled in when you open the issue and updated when you edit it.

**Last update** is the date of the last real event. Comments don't change it. Use `/next` for planned steps, or change it on the card. A date in the future means something is coming up, and the weekly summary lists it.

**Interviews** is the number of interviews. Each `/interview` adds 1. If it's wrong, fix it on the card.

## Rejected

Write `/rejected` or just close the issue. The status depends on **Interviews**:

| Status before | Interviews | Status after |
| --- | --- | --- |
| Applied, In progress, On hold | 0 | Rejected without interview |
| Applied, In progress, On hold | 1 or more | Rejected after interview |
| Wishlist, Offer, Rejected | any | No change |

So update **Interviews** before you close. The issue is closed as **not planned**. Use **completed** for an offer you accepted.

## Other cases

- **Revisit later**: rejected, but you want to contact them again. Keep the issue open and add the `revisit later` label. You get a daily reminder until you plan a date with `/next`.
- **On hold**: no follow-up reminders, but `/next` dates still show in the summary.
- **Ghosted**: an Applied card with no update for 30 days gets the `ghosted` label. It goes away when the status moves on. Remove it yourself if they finally reject you.

## Labels

| Label | Meaning | Added by |
| --- | --- | --- |
| `source: ...` | Where the application came from | The workflow, from **Source** |
| `on-pause` | No follow-up reminders | You |
| `revisit later` | Contact them again later | You |
| `withdrawn interest` | You stopped the process | `/withdraw` |
| `followed up` | You sent a follow-up | `/followup` |
| `redirected` | Moved to another process | `/moved` |
| `ghosted` | No answer for 30 days | The workflow |
| `summary` | Weekly summary | The workflow |
| `setup` | A setup step for you | The setup |
| `maintenance` | A setup problem | The Doctor workflow |
| `imported` | Imported from old data | The import script |
| `period: ...` | The job search period | The workflow |

## Periods

A period is one job search, not a calendar year. New issues get the label of the current period (the `CURRENT_PERIOD` variable), and it stays until you end it.

- To end a period, run **Actions** > **End a period**. Give the new period a name, or leave it empty and your next application starts one named after its month, for example `period: 2027-04`.
- To move one application, comment `/period NAME`.
- To take an old period off the board, see [Archive a period](export-import.md#archive-a-period).
