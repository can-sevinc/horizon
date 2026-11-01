---
name: setup-doctor
description: Check the setup of the job application tracker and explain how to fix each problem - token, private repository, project board, labels, variables, workflows. Runs the Doctor workflow and reads its result, plus local checks. Use when something does not work (cards do not appear, workflows fail, a maintenance issue is open) or the user asks to check the setup.
---

# Setup doctor

## Local checks

```bash
gh auth status                                   # signed in? scopes: repo, project (gh auth refresh -s project)
R=$(gh repo view --json nameWithOwner -q .nameWithOwner)
gh repo view "$R" --json visibility -q .visibility   # must be PRIVATE
git status --short; git log origin/main..HEAD --oneline   # changes that are not pushed
gh variable list -R "$R"                         # PROJECT_NUMBER and CURRENT_PERIOD
gh secret list -R "$R"                           # PROJECT_TOKEN
```

## The Doctor workflow

```bash
gh workflow run doctor.yaml -R "$R"
sleep 5
ID=$(gh run list -R "$R" --workflow doctor.yaml --limit 1 --json databaseId -q '.[0].databaseId')
gh run watch "$ID" -R "$R"
gh run view "$ID" -R "$R" --log | grep -E "✓|Warning|##\[warning\]|Error"
gh issue list -R "$R" --label maintenance --state open    # the problems it found
```

## Explain

For each problem: what it means for the user, and the exact command to fix it.

| Problem | Fix |
| --- | --- |
| Repository public | Settings → Change visibility → Private. Urgent: the issues are applications |
| `PROJECT_TOKEN` empty, expired, or without `repo` / `project` | Make a token: https://github.com/settings/tokens/new?scopes=repo,project,workflow&description=job-applications, then `gh secret set PROJECT_TOKEN -R "$R"` |
| Status options, fields, or labels missing | `bash scripts/setup.sh` or `gh workflow run setup.yaml` (safe to run again; `DRY_RUN=1 bash scripts/setup.sh` or `-f dry_run=true` shows the changes) |
| `PROJECT_NUMBER` wrong | `gh project list --owner OWNER`, then `gh variable set PROJECT_NUMBER -R "$R" --body NUMBER` |
| `CURRENT_PERIOD` empty (not a problem: the next application starts a period) | To keep an old period: `gh variable set CURRENT_PERIOD -R "$R" --body NAME` |
| A workflow turned off | `gh workflow enable NAME -R "$R"` |
| A workflow run failed | `gh run list -R "$R" --status failure --limit 5`, then `gh run view ID --log-failed` |

Run a fix only when the user agrees. After the fixes, run the Doctor workflow again.
