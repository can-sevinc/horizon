<!-- The comment on each new application, with the comment commands.
{{nextWeek}} the date in 7 days. -->
Added to the board. Write a comment that starts with a command: {{icon:board}}

| Command | Result |
| --- | --- |
| `/interview` | {{icon:interview}} Interview notes template. Interviews + 1 on the card |
| `/interview technical` | {{icon:interview}} The same, with the interview type filled in |
| `/next {{nextWeek}} email recruiter` | {{icon:next}} Plans the next step on that date. Wishlist or Applied → In progress |
| `/next +7 they will answer` | {{icon:next}} Plans the next step 7 days from today |
| `/applied` | {{icon:applied}} You applied for a Wishlist job: Status → Applied, Applied date → today |
| `/hold summer vacation` | {{icon:hold}} Status → On hold |
| `/offer` | {{icon:offer}} Status → Offer, with an offer template |
| `/followedup +7` | {{icon:followup}} You sent a follow-up email: `followed up` label, Last update → today, check for an answer in 7 days |
| `/period 2026` | {{icon:period}} Moves this application to another job search period |
| `/withdraw not a fit` | {{icon:withdraw}} You stopped the process: closes the issue, Status → Rejected without interview |
| `/moved #123` | {{icon:redirect}} The company moved you to the process in #123: closes this issue as a duplicate |
| `/rejected position filled` | {{icon:rejected}} The process stopped: closes the issue, Status → Rejected after / without interview |

_When something happens in the process, change **Last update** on the card. Comments do not change it. Add the `on-pause` label to stop follow-up reminders._
