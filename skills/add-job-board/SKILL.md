---
name: add-job-board
description: Make the "add application" bookmarklet read the position and company correctly on a new job board or ATS site (for example thehub.io), set Source to "Job board" for job board links, and add the site to docs/supported-sites.md. Use when the user gives a job board URL or name that the bookmarklet parses wrong, or asks to support a new job board.
---

# Add a job board

The bookmarklet (`scripts/bookmarklet.src.js`) guesses the company from the host of a
generic site. On a job board this is wrong: every post is on the same host. A supported job
board has its own small parser, and its host is in `config.yaml`.

## Inputs

- A job post URL on the site (ask for one if the user only gives the site name). If you
  cannot open web pages, ask the user to open the post and send you the output of these
  lines from the browser console:

  ```js
  document.title
  document.querySelector('h1')?.textContent
  [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent.slice(0, 1500))
  ```

## Steps

1. **Find the host.** Without `www.` (the bookmarklet removes it). `www.example.com` → `example.com`.
   If posts are on a subdomain per company (`acme.example.com`), note it: the parser key must
   match the exact host, so use the generic branch idea instead (see "Subdomains" below).

2. **Find where the position and company are**, in this order of preference:
   - `document.title`, when it has a fixed pattern (thehub.io: `The Hub | Position | Company`).
     Check 2–3 posts: the pattern must be the same, also when the position contains `|` or `-`.
   - A JSON-LD `JobPosting` (`title`, `hiringOrganization.name`).
   - Selectors (`h1`, a company link). Prefer stable attributes over generated class names.

3. **Add the parser** to `JOB_BOARDS` at the top of `scripts/bookmarklet.src.js`. One entry
   per host. A comment on its own line says where the data comes from. It returns
   `{ position, company }` (strings; `''` when not found, never `undefined`):

   ```js
   // Title: "Position at Company - Example Jobs"
   'example.com': () => {
     const m = document.title.match(/^(.*) at (.*) - Example Jobs$/) || [];
     return { position: m[1] || '', company: m[2] || '' };
   },
   ```

   Rules of the file (`scripts/make_bookmarklet.sh` makes one line of it):
   - Comments only on their own lines. Never a `//` comment after code on the same line:
     on one line it comments out everything after it.
   - End every statement with `;`.
   - No dependencies, no `fetch`: only what is in the page.

4. **Job board or ATS?** A job board (posts of many companies, like Platsbanken): add the host
   to `jobBoards` in `config.yaml`, so the sync workflow and the import script set **Source** to
   **Job board** for its links (a subdomain of the host counts too). An ATS (the career pages of
   companies, like Jobylon): do not add it; its links stay **Company website**.

5. **Update the list of supported sites**, `docs/supported-sites.md`: add a row (or change the
   row) with the site, the type, an example link, where the company, position, and description
   come from, and today's date in **Tested** after step 6 passes on a real post ("Not yet" and
   the reason when you could not test it). The tests check that every `JOB_BOARDS` key and every
   `jobBoards` host is in this list.

6. **Test.**
   - Build: `bash scripts/make_bookmarklet.sh OWNER/REPO` (the user's repository from
     `git remote get-url origin`). It writes `data/bookmarklet.txt`.
   - Syntax: `node -e "new Function(require('fs').readFileSync('data/bookmarklet.txt','utf8').slice(11))"`
   - On the job post page (in the browser console, or with a browser tool): first run
     `window.open = u => { window.__opened = u; }`, then the text of `data/bookmarklet.txt`
     without `javascript:`, then `Object.fromEntries(new URL(window.__opened).searchParams)`.
     Check `company`, `position`, `title`, and `link` on 2–3 posts.
   - Source: `node -e "console.log(require('./.github/scripts/project.js').guessSource('### Job link\n\nURL\n'))"`
     with a post URL prints `Job board`.

7. **Tell the user** to paste the new `data/bookmarklet.txt` into their bookmark (the old
   bookmark has the old code), and to run `bash scripts/setup.sh` again if the
   `source: job board` label does not exist yet.

## Subdomains

When each company has its own subdomain (`acme.example.com`), a `JOB_BOARDS` key cannot
match all of them. Add the host to the regular expressions in the generic branch of the
bookmarklet instead (`company = cap(host.split('.')[0])` takes the subdomain as the company),
and still add the host to `jobBoards` in `config.yaml`.
