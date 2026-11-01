<!-- The comment on each new application, with the comment commands.
{{nextWeek}} the date in 7 days. -->
Added to the board. Write a comment that starts with a command:

| Command | Result |
| --- | --- |
| `/interview` | Interview notes template. Interviews + 1 on the card |
| `/interview technical` | The same, with the interview type filled in |
| `/next {{nextWeek}} email recruiter` | Plans the next step on that date. Wishlist or Applied → In progress |
| `/next +7 they will answer` | Plans the next step 7 days from today |
| `/applied` | You applied for a Wishlist job: Status → Applied, Applied date → today |
| `/hold summer vacation` | Status → On hold |
| `/offer` | Status → Offer, with an offer template |
| `/followedup +7` | You sent a follow-up email: `followed up` label, Last update → today, check for an answer in 7 days |
| `/period 2026` | Moves this application to another job search period |
| `/withdraw not a fit` | You stopped the process: closes the issue, Status → Rejected without interview |
| `/moved #123` | The company moved you to the process in #123: closes this issue as a duplicate |
| `/rejected position filled` | The process stopped: closes the issue, Status → Rejected after / without interview |

_When something happens in the process, change **Last update** on the card. Comments do not change it. Add the `on-pause` label to stop follow-up reminders._
