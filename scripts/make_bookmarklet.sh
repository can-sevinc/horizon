#!/usr/bin/env bash
# Makes the bookmark from scripts/bookmarklet.src.js, with your repository in it.
# Usage: bash scripts/make_bookmarklet.sh OWNER/REPO   (setup.sh runs it)
# Writes data/bookmarklet.txt. Paste its text into the URL field of a bookmark.
set -euo pipefail
REPO="$1"
DIR="$(dirname "$0")"
OUT="$DIR/../data/bookmarklet.txt"
mkdir -p "$(dirname "$OUT")"
# One line: no comment lines, no indentation
{
  printf 'javascript:'
  grep -v -e '^[[:space:]]*//' -e '^[[:space:]]*$' "$DIR/bookmarklet.src.js" | sed 's/^[[:space:]]*//' | tr '\n' ' ' | sed 's/ *$//'
  echo
} | sed "s#'USER/job-applications'#'$REPO'#" >"$OUT"
echo "✓ Bookmark: $OUT"
