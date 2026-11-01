---
title: If there is a problem
nav_order: 10
---

# If there is a problem

Every morning the **Doctor** workflow checks your setup. If something is wrong, it opens one issue with the `maintenance` label and tells you how to fix each problem. It checks that:

- the repository is private
- the token works, has the `repo` and `project` scopes, and doesn't expire in the next 14 days
- the board has all statuses and fields, and `PROJECT_NUMBER` is right
- no labels are missing and no workflows are turned off

The issue closes itself once everything is fine. To check now, run **Actions** > **Doctor**.

Common problems:

- **Cards don't appear on the board, or workflows fail after a few months.** The token has probably expired. Make a new one and save it:

  ```bash
  gh secret set PROJECT_TOKEN -R USER/job-applications
  ```

- **A status is not found.** The status names on the board must match `config.yaml`. Run the setup again to fix it.
