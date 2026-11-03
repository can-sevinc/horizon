---
title: Update an application
nav_order: 4
---

# {% include icon.html name="commands" %} Update an application
{: #update-an-application }

Move a card on the board, or write a command in a comment. Use normal comments for anything else you want to remember.

## Comment commands

Put the command at the start of your comment. Only the repository owner can use these commands. They work in the Github mobile app too.

| Command | What it does |
| --- | --- |
| `/interview` | Opens the interview notes template. Adds 1 to **Interviews**. |
| `/interview technical` | The same, with the interview type filled in |
| `/next 2026-12-01 call the recruiter` | Plans a step. **Last update** gets that date. Wishlist or Applied becomes In progress. |
| `/next +7 they will answer` | Plans a step 7 days from today |
| `/applied` | Changes a wishlist job to Applied and sets the dates to today |
| `/applied 2026-10-20 sent by email` | The same, with your date and note |
| `/hold summer vacation` | Changes the status to On hold |
| `/offer` | Changes the status to Offer and opens the offer template |
| `/followedup +7` | Records a sent follow-up, adds `followed up`, and plans a check in 7 days |
| `/withdraw not a fit` | Closes the issue as Rejected without interview and adds `withdrawn interest` |
| `/moved #296` | Closes this issue as a duplicate of the process in #296 |
| `/period 2026` | Moves this application to another period |
| `/rejected position filled` | Closes the issue and sets the rejected status. The reason is optional. |

To change the comments these commands write, edit `templates/comments`. Keep the field labels that the workflows read. The README in that folder explains them and the `{% raw %}{{icon:NAME}}{% endraw %}` placeholders.

---

## {% include icon.html name="board" %} Project fields
{: #project-fields }

The fields are copied from the issue form when you open an issue. Editing the issue updates those fields too.

**Last update** is the date of the last real event. Normal comments do not change it. Change it on the card when something happens. `/next` uses it for the planned date, so a future value means something is coming up.

**Interviews** counts your interviews. Each `/interview` adds 1. If the count is wrong, fix it on the card.

## Rejected

Comment `/rejected`, or close the issue. The result depends on the card's **Interviews** count:

| Status before | Interviews | Status after |
| --- | --- | --- |
| Applied, In progress, On hold | 0 | Rejected without interview |
| Applied, In progress, On hold | 1 or more | Rejected after interview |
| Wishlist, Offer, Rejected | Any | No change |

Check **Interviews** before closing. Rejected issues close as **not planned**. Use **completed** for an offer you accepted.

## Other cases

- **Revisit later:** add `revisit later` if you want to contact them again. A reminder comes each day until you plan a date with `/next`. This also works on closed issues.
- **On hold:** there is no reminder just because **Last update** is old. A planned `/next` date can still bring a reminder and appear in the summary.
- **Ghosted:** with the default settings, an Applied card gets `ghosted` after 30 days without an update. It goes away when the status moves on. Remove it yourself if they finally reject you.

---

## Labels

| Label | Meaning | Added by |
| --- | --- | --- |
| `source: ...` | Where the application came from | The workflow, from **Source** |
| `on-pause` | Stop follow-up reminders for this issue | You |
| `revisit later` | Contact them again later | You |
| `withdrawn interest` | You stopped the process | `/withdraw` |
| `followed up` | You sent a follow-up | `/followedup` |
| `redirected` | Moved to another process | `/moved` |
| `ghosted` | No answer for 30 days by default | The workflow |
| `summary` | Weekly summary | The workflow |
| `setup` | A setup step for you | Setup |
| `maintenance` | A setup problem | Doctor |
| `imported` | Imported from old data | The import script |
| `period: ...` | The job search period | The workflow |

## {% include icon.html name="period" %} Periods
{: #periods }

A period is one job search. It does not have to match a calendar year. New applications get the current period from the `CURRENT_PERIOD` repository variable.

- To end it, run **Actions** > **End a period**. Give the next period a name, or leave it empty. Then your next application starts a period named after its year, such as `2027`. If that name is used, it gets a number, such as `2027-2`.
- To move one application, comment `/period NAME`.
- To remove an old period's cards from the board, [archive the period](export-import.md#archive-a-period).
