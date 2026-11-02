<!-- horizon: the README of the template -->
# Horizon

Track your job search in a private Github repository. Each application is an issue and a card on a project board, and a few workflows keep it up to date. No server and no subscription.

Documentation: https://can-sevinc.github.io/horizon/

[![Installs](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fabacus.jasoncameron.dev%2Fget%2Fcan-sevinc-horizon%2Finstall&query=%24.value&label=installs&color=blue)](https://abacus.jasoncameron.dev/get/can-sevinc-horizon/install)

## Features

<!-- GIF: the bookmark on a job post -->
- **One click to save a job.** A bookmark fills in the company, position, link, and job description. It works on LinkedIn, Greenhouse, Lever, Ashby, Workday, Teamtailor, and [more](docs/supported-sites.md).

<!-- GIF: a card moving on the board -->
- **The board updates itself.** New issues become cards, and closing an issue sets the right rejected status.

<!-- GIF: /interview and /next in an issue -->
- **Comment commands.** `/interview`, `/next 2026-12-01 call`, `/offer`, `/rejected` and a few more. They also work in the Github mobile app.

<!-- GIF: a weekly summary -->
- **Reminders and a weekly summary.** You hear about follow-ups and silent companies, and every Monday you get your numbers.

- **Import and export.** Bring your old spreadsheet, and export to JSON or CSV any time.

- **AI agent skills.** Interview prep, CV tailoring, follow-up emails, offer comparison, and [more](docs/skills.md).

## Setup

In the browser: click **Use this template**, choose **Private**, and follow the **Finish the setup** issue that opens in your copy.

On your computer, with `gh` and `git`:

```bash
gh repo clone can-sevinc/horizon job-applications
cd job-applications
bash scripts/setup.sh
```

More in [Setup](docs/setup.md). When the template changes, the **Update** workflow opens a pull request in your copy. See [Get updates](docs/updates.md).

## Keep it private

Your applications, notes, and salaries live in the issues of your copy. The setup stops if the repository is public, and a daily check warns you if it ever becomes public.

The only thing your copy sends out is a +1 to the public [install counter](https://abacus.jasoncameron.dev/get/can-sevinc-horizon/install): once, when the setup creates your board. No repository name, user, or data is sent, and `telemetry: false` in `config.yaml` turns it off.

## Settings

Everything is in [`config.yaml`](config.yaml): time zone, reminder times, statuses, fields, and labels. Run the setup again after a change.

## Development

```bash
node --test "tests/*.test.js"
```

See [`AGENTS.md`](AGENTS.md) if you work with an AI coding agent.

## License

[MIT](LICENSE)
