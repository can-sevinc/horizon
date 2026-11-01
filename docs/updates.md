---
title: Get updates
nav_order: 8
---

# Get updates

Your copy doesn't share any history with the template, so `git pull` doesn't work. The **Update** workflow does the job instead.

## How it works

On the 1st of every month, or when you run **Actions** > **Update**, the workflow gets the latest version of the template and opens a pull request called **Update from the template**. Nothing changes until you merge it.

For each file:

- If you never changed it, you get the new version.
- If only you changed it, your version stays.
- If you both changed it, the changes are merged. If you both changed the same lines, the pull request has the template's version and lists the file under **Check these files**, so you can add your change again.

`config.yaml` and `README.md` always stay yours, and the files of this documentation site are not added back. If the template added a new setting, it is added with its default value. The form, the workflow times, and the Setup fields are made again from your settings, so your city and times stay as they are.

After you merge, run **Actions** > **Setup** once, so your board gets any new labels or fields. If the bookmark changed, the pull request tells you, and the Setup run shows the new one.

## Good to know

- The workflow pushes with your `PROJECT_TOKEN`. It needs the `workflow` scope, because updates often change files in `.github/workflows`.
- The last template version you got is saved in `.github/template-version`. Don't edit it.
- To get updates from somewhere else, for example your own fork of the template, change `templateRepo` in `config.yaml`.
- If you don't want updates, turn the workflow off: **Actions** > **Update** > **...** > **Disable workflow**.
