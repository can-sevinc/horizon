---
title: If there is a problem
nav_order: 10
---

# {% include icon.html name="help" %} If there is a problem
{: #if-there-is-a-problem }

Start with **Actions** > **Doctor**. It checks the setup and opens one issue with the `maintenance` label if something is wrong. That issue has the fixes. It closes when the checks pass again.

Doctor also runs each morning. It checks that:

- the repository is private
- the token works and has the `repo` and `project` scopes
- the token is not close to expiring; the default warning is 14 days before
- `PROJECT_NUMBER` points to the right board
- statuses, fields, and labels are present
- workflows have not been turned off

---

## Cards do not appear, or workflows fail

Open the failed run in **Actions** and read its error. If this started after a few months, check the token expiry date first.

Make a new token with the same required scopes and save it as `PROJECT_TOKEN`. You can do this under your repository's **Settings** > **Secrets and variables** > **Actions**, or from your computer:

```bash
gh secret set PROJECT_TOKEN -R USER/job-applications
```

Paste the token when asked. Then run **Setup** and **Doctor** again.

## A status is not found

The names on the board must match `config.yaml`. Run **Setup** again. If you renamed a status yourself, check the names in the file too.

---

## Icons or screenshots do not load

Check `assetsUrl` in `config.yaml`. It should point to Horizon's public `/assets/v1` folder, or a copy you host yourself. Open that address with `/brand/horizon-logo-light.svg` at the end to check it.

The private copy does not contain the shared images. Their absence from your repository is normal.

## I am not sure what failed

Keep the failed run's link and error text. If you use an AI coding agent, ask it to use the `setup-doctor` skill in your copy. It can read the setup and explain what to change.
