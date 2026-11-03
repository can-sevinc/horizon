<p align="right"><sub>Powered by <a href="https://github.com/can-sevinc/horizon"><picture><source media="(prefers-color-scheme: dark)" srcset="{{ASSETS}}/brand/horizon-logo-dark.svg"><img src="{{ASSETS}}/brand/horizon-logo-light.svg" alt="Horizon" height="16" align="top"></picture></a></sub></p>

# Job applications

My job search, tracked with [Horizon](https://github.com/can-sevinc/horizon). Each application is an issue and a card on the [project board](https://github.com/{{REPO}}/projects).

Keep this repository private. The issues have your applications, notes, and salaries.

## {{icon:save}} Add an application

- Click the bookmark on a job post. The form opens with the details filled in.
- On your phone, or for a recruiter message: [new application form](https://github.com/{{REPO}}/issues/new?template=application.yaml).
- To save a job for later, set **Stage** to **Wishlist**.

## {{icon:commands}} Update an application

Move the card on the [board](https://github.com/{{REPO}}/projects), or start a comment with a command:

| Command | What it does |
| --- | --- |
| `/interview` | Interview notes. Adds 1 to **Interviews**. |
| `/next 2026-12-01 call them` | Plans the next step |
| `/applied` | You applied for a wishlist job |
| `/hold` | Puts the application on hold |
| `/offer` | You got an offer |
| `/followedup` | You sent a follow-up |
| `/withdraw` | You stopped the process |
| `/rejected` | They said no. Closing the issue does the same. |

Every new issue gets a comment with the full list. To change the comments that the commands write, edit the files in [`templates/comments`](templates/comments).

## {{icon:board}} What happens by itself

- A reminder comment when an application needs a follow-up
- The `ghosted` label when an application gets no answer
- A [weekly summary](https://github.com/{{REPO}}/issues?q=label%3Asummary) every Monday
- A daily check of the setup. Problems show up as an issue with the `maintenance` label.
- A pull request when a new version of Horizon is out

## {{icon:settings}} Settings and more

Your settings are in [`config.yaml`](config.yaml). `telemetry: false` turns off the anonymous install counter, which only adds 1 once, at setup. After a change, run [Actions > Setup](https://github.com/{{REPO}}/actions/workflows/setup.yaml).

Export, import, periods, and everything else: https://can-sevinc.github.io/horizon/
