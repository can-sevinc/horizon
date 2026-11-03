---
title: Get updates
nav_order: 8
---

# {% include icon.html name="updates" %} Get updates
{: #get-updates }

A copy made with **Use this template** has its own git history. Use the **Update** workflow to get changes from Horizon, rather than trying to pull them into your copy.

## What happens

On the 1st of each month, the workflow checks the template. You can also run **Actions** > **Update** yourself. If there are changes, it opens a pull request called **Update from the template**.

Nothing is applied to your main branch until you merge it.

| What changed | What you get |
| --- | --- |
| You did not change the file | The new template version |
| Only you changed it | Your version stays |
| Both sides changed different lines | The changes are merged |
| Both sides changed the same lines | The template's version, with the file listed under **Check these files** |

For a file under **Check these files**, add your changes again before you merge. Read the pull request first; do not merge it only because the workflow passed.

---
{: .divider-left }

## Your settings stay yours

`config.yaml` and `README.md` stay yours. New settings are added with their default values. The form and workflow times are made again from your settings, so your city and local times stay the same.

The docs site and shared image files are not added back to private copies.

After merging, run **Actions** > **Setup** once. This adds any new labels or fields to your board. If the bookmark changed, the pull request tells you. Copy the new one from the Setup run.

---

## Useful details

- `PROJECT_TOKEN` needs the `workflow` scope. Updates can change workflow files.
- `.github/template-version` records the last version you received. Do not edit it.
- Change `templateRepo` in `config.yaml` to get updates from another template repository.
- To stop update checks, open **Actions** > **Update** > **...** > **Disable workflow**.
