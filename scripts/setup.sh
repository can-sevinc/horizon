#!/usr/bin/env bash
# The setup, from your computer. It needs only gh (the Github CLI) and git.
# Run it in the repository folder:   bash scripts/setup.sh
# Show the changes only:              DRY_RUN=1 bash scripts/setup.sh
#
# It makes sure that your repository is yours and private, asks for the settings (Enter keeps
# the value in brackets) and saves them in config.yaml, saves the token, and runs the Setup
# workflow (.github/workflows/setup.yaml): the workflow sets up the labels, the project board,
# and the variables, and makes the bookmark. Safe to run more than once.
set -euo pipefail
cd "$(dirname "$0")/.."
CONFIG=config.yaml
TOKEN_LINK="https://github.com/settings/tokens/new?scopes=repo,project,workflow&description=job-applications"

# --- Github CLI login with the "project" scope ---
gh auth status >/dev/null 2>&1 || gh auth login
gh auth status 2>&1 | grep -q "'project'" || gh auth refresh -s project
ME=$(gh api user -q .login)

# --- Repository: yours, and private (the issues are your applications) ---
R=""
if ORIGIN=$(git remote get-url origin 2>/dev/null); then
  R=$(gh repo view "$ORIGIN" --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)
fi
if [ -n "$R" ] && [ "${R%%/*}" != "$ME" ]; then
  # A copy of someone else's repository (for example the public template): keep it as "upstream"
  # for updates, and make your own private repository
  echo "! $R is not your repository. Your applications go into a new private repository of yours."
  git remote rename origin upstream
  echo "✓ $R is now the remote \"upstream\" (to get updates later: git pull upstream main)"
  R=""
fi
if [ -n "$R" ]; then
  if [ "$(gh repo view "$R" --json visibility -q .visibility)" != "PRIVATE" ]; then
    echo
    echo "!!! $R is PUBLIC. Everyone could read your job applications in its issues."
    echo "!!! Make it private first, then run the setup again:"
    echo "      gh repo edit $R --visibility private --accept-visibility-change-consequences"
    exit 1
  fi
  echo "✓ Using your private repository $R"
  NEW_REPO=""
else
  read -r -p "Name of your new private repository [job-applications]: " NAME || true
  NAME="${NAME:-job-applications}"
  [ -d .git ] || git init -q
  git add -A
  git diff --cached --quiet || git commit -qm "chore: start my job applications"
  gh repo create "$NAME" --private --source=. --remote=origin --push
  R="$ME/$NAME"
  NEW_REPO=1
  echo "✓ Created the private repository $R"
fi

# --- Settings: config.yaml ---
# The value of a "key: value" line, without quotes
get() { sed -n "s/^$1: *//p" "$CONFIG" | head -n1 | sed -e 's/ *#.*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/"; }
# Changes the line of a key (a number stays a number; text gets quotes)
put() {
  local value="$2"
  # (a number or true/false stays as it is; text: in double quotes, with \ and " escaped)
  [[ "$value" =~ ^([0-9]+|true|false)$ ]] || value="\"$(printf '%s' "$value" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')\""
  K="$1" V="$value" awk '!done && index($0, ENVIRON["K"] ":") == 1 { print ENVIRON["K"] ": " ENVIRON["V"]; done = 1; next } { print }' \
    "$CONFIG" >"$CONFIG.tmp" && mv "$CONFIG.tmp" "$CONFIG"
}
# ask <key> <question> <check: time|days|zone|day|yesno|text>
ask() {
  local key="$1" question="$2" check="$3" old value
  old=$(get "$key")
  # (no time zone yet: the one of this computer)
  if [ "$check" = zone ] && [ -z "$old" ]; then old=$(readlink /etc/localtime 2>/dev/null | sed 's#.*zoneinfo/##' || true); fi
  while true; do
    read -r -p "$question [$old]: " value || value=""
    value="${value:-$old}"
    case "$check" in
      time) [[ "$value" =~ ^([01][0-9]|2[0-3]):[0-5][0-9]$ ]] && break; echo "  Use HH:MM, for example 09:30." ;;
      days) [[ "$value" =~ ^[1-9][0-9]*$ ]] && break; echo "  Use a number of days." ;;
      zone) [ -f "/usr/share/zoneinfo/$value" ] && break; echo "  Use a time zone name, for example Europe/Berlin." ;;
      day) [[ "$value" =~ ^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$ ]] && break; echo "  Use a day name, for example Monday." ;;
      yesno) [[ "$value" =~ ^(true|false)$ ]] && break; echo "  Use true or false." ;;
      *) break ;;
    esac
  done
  [ "$value" = "$(get "$key")" ] || put "$key" "$value"
}
if [ -t 0 ]; then
  echo
  echo "Settings (Enter keeps the value in brackets). The statuses, colors, and labels: edit config.yaml."
  ask projectTitle "Name of the project board" text
  ask city "Default City in the form" text
  ask timezone "Your time zone" zone
  ask reminderTime "Daily follow-up reminders, local time" time
  ask summaryDay "Weekly summary day" day
  ask summaryTime "Weekly summary, local time" time
  ask doctorTime "Daily setup check, local time" time
  ask followUpDays "Days without news before a follow-up reminder" days
  ask ghostedDays "Days without an answer before the ghosted label" days
  ask salaryPlaceholder "Example in the Salary range field" text
  ask telemetry "Count this copy? It adds 1 to Horizon's public install counter, nothing else (true/false)" yesno
fi
if ! git diff --quiet -- "$CONFIG"; then
  git add "$CONFIG"
  git commit -qm "chore: save the settings"
  echo "✓ Saved the settings in $CONFIG"
fi
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "! You have changes that are not committed. The workflows use what is on Github."
fi
git push -q -u origin HEAD
echo "✓ Pushed to $R"

# --- Token for the workflows (PROJECT_TOKEN) ---
SET_TOKEN=y
if gh secret list -R "$R" | grep -q '^PROJECT_TOKEN'; then
  read -r -p "PROJECT_TOKEN already exists. Replace it? [y/N] " SET_TOKEN || SET_TOKEN=n
fi
if [[ "$SET_TOKEN" =~ ^[Yy]$ ]]; then
  echo
  echo "Make a token so the workflows can change the board. Open this link, set an expiration,"
  echo "click Generate token, and copy the token:"
  echo "  $TOKEN_LINK"
  { command -v open || command -v xdg-open; } >/dev/null 2>&1 && { open "$TOKEN_LINK" 2>/dev/null || xdg-open "$TOKEN_LINK"; } >/dev/null 2>&1 || true
  echo
  gh secret set PROJECT_TOKEN -R "$R"
  echo "✓ Saved PROJECT_TOKEN"
fi

# --- The Setup workflow: the labels, the board, the variables, the bookmark ---
SINCE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
gh workflow run setup.yaml -R "$R" ${DRY_RUN:+-f dry_run=true} >/dev/null
echo "… The Setup workflow is running"
ID=""
for _ in $(seq 30); do
  sleep 3
  ID=$(gh run list -R "$R" --workflow setup.yaml --event workflow_dispatch -L 5 --json databaseId,createdAt \
    -q "[.[] | select(.createdAt >= \"$SINCE\")][0].databaseId // empty")
  [ -n "$ID" ] && break
done
[ -n "$ID" ] || { echo "! The run did not start. Open Actions > Setup on Github."; exit 1; }
gh run watch "$ID" -R "$R" --exit-status >/dev/null || { echo "! The Setup workflow failed:"; gh run view "$ID" -R "$R" --log-failed | tail -n 20; exit 1; }
LOG=$(gh run view "$ID" -R "$R" --log)
# What it did, and the steps for you
sed -n -e 's/.*Z \(✓ .*\)$/\1/p' -e 's/.*Z \((dry run) .*\)$/  \1/p' -e 's/.*Z TODO \(.*\)$/! \1/p' <<<"$LOG"
mkdir -p data
sed -n 's/.*Z BOOKMARKLET //p' <<<"$LOG" | head -n1 >data/bookmarklet.txt
# The workflow may have committed files (the form, the workflow times)
git pull -q --ff-only || echo "! Run git pull: the Setup workflow changed files on Github."

echo
echo "Repo:     https://github.com/$R"
echo "Project:  https://github.com/users/$ME/projects/$(gh variable get PROJECT_NUMBER -R "$R" 2>/dev/null || echo '?')"
echo "Run:      https://github.com/$R/actions/runs/$ID"
echo "New application form: https://github.com/$R/issues/new?template=application.yaml"
echo "Bookmark: make a new bookmark and paste the text of data/bookmarklet.txt into its URL field."
[ -z "$NEW_REPO" ] || echo "Keep the repository private: your applications are in its issues."
