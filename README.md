# Job Applications Tracker

Use this repository to record your job applications on Github.

Each application is one issue. Each issue is one card on a Github Project board. You move the card when the status of the application changes.

The system does these tasks automatically:

- It adds each new application to the board
- It tells you when an application needs a follow-up
- It makes a summary of your applications each Monday

## What you need

- A Github account. For the setup from your computer: the Github CLI (`gh`) and `git`. For the setup in the browser: nothing else.
- Python 3, only to import old data

## Setup

Do these steps one time. You can run the setup again later, for example after a change in `config.yaml`. See [Run the setup again](#run-the-setup-again).

### In the browser (nothing to install)

1. Make your copy of the template: **Use this template** > **Create a new repository**. Select **Private**: your applications will be issues in it.
2. A minute later, your copy has an issue **Finish the setup** with three steps and their links: make a token, save it as the secret `PROJECT_TOKEN`, and run **Actions** > **Setup** (fill in your time zone, the default City, and the other settings). If the issue does not come, run **Actions** > **Welcome** > **Run workflow**.
3. When the setup is done, it writes the bookmark and the last steps (the sort of the views) into the issue, and closes it.

### On your computer

1. Download this repository to your computer, or clone it. If it is not your own private repository, the setup script makes one for you, and keeps the original as the remote `upstream` (for updates later).
2. Log in to the Github CLI:

   ```bash
   gh auth login
   ```

3. Open a terminal in the repository folder.
4. Run the setup script:

   ```bash
   bash scripts/setup.sh
   ```

   - It stops if your repository is public: your applications would be public too.
   - It asks for the settings: the name of the board, the default City, your time zone, the times of the reminders and the weekly summary, the days before a follow-up and before `ghosted`, and the Salary range example. Press Enter to keep the value in brackets. It saves them in `config.yaml`.
   - It shows a link to make a token (`PROJECT_TOKEN`). Open the link, make the token, and copy it into the terminal.
   - It runs the **Setup** workflow on Github, which makes the labels and the project board, and sets up the board:

   - The project gets these views:

   | View | Layout | Shows |
   | --- | --- | --- |
   | Board | Board (kanban) | All applications. The cards show **Applied date** and **Last update**. |
   | Table | Table | All applications, like a spreadsheet. |
   | Interviews | Roadmap (timeline) | Only **In progress**, **On hold**, and **Rejected after interview**. |
   | Summaries | Table | Only the weekly summaries. |

   - The **Status** field gets these options in this sequence:

   | Status | Color | Meaning |
   | --- | --- | --- |
   | Wishlist | Pink | You did not apply yet. |
   | Applied | Blue | You applied. There is no answer yet. |
   | In progress | Green | The process continues. |
   | On hold | Yellow | The process is not finished. You will continue it later. |
   | Rejected after interview | Red | The company stopped the process after an interview. |
   | Rejected without interview | Gray | The company stopped the process before an interview. |
   | Offer | Purple | You got an offer. |

   - The project gets these fields: **Applied date**, **Last update**, **Company**, **Position**, **City**, **Salary range**, **Recruiter**, **Job link**, and **Interviews**. See [Project fields](#project-fields).
   - The default project workflows are removed.

   The statuses, fields, and labels are in `config.yaml`. Do not change the Status names. The workflows use them.
5. The API cannot sort a view, so sort the views yourself:
   - **Board** view: open the view menu (▾ next to the view name) > **Sort by** > **Last update** > **Descending**. Click **Save**.
   - **Table** view: **Sort by** > **Applied date** > **Ascending**. Click **Save**.
   - **Interviews** view: the API cannot set the dates of a timeline. Open **Date fields**. Set the start to **Applied date** and the target to **Last update**. Click **Save**.
6. The setup script makes the bookmark with your repository in it: `data/bookmarklet.txt`. Make a new bookmark in your browser. Paste the text of `data/bookmarklet.txt` into the URL field of the bookmark.

### Run the setup again

You can run `bash scripts/setup.sh` (or the **Setup** workflow) as many times as you want. It does not change your issues or cards. Each time, it:

- Uses the repository and the project that it made before (the project by `PROJECT_NUMBER`, also when you renamed it).
- Shows the settings of `config.yaml` as the defaults.
- Makes the labels, fields, and views that are missing. It sets the label colors and descriptions, and the Status colors and descriptions, from `config.yaml`. The cards keep their status.
- Finds the views by their names. It changes a view only when its layout or filter is not the same as in `config.yaml`, or when a field is missing. Your sort, the columns you added, and the order of the columns stay. Your own views stay too. If you rename one of the four views, the setup makes it again.
- Writes the settings into the form and the workflow times, if they changed.
- Asks before it replaces the token. The default is no.
- Makes `data/bookmarklet.txt` again.

The setup does not delete the Github default labels (`bug`, `question`, ...) again. It deletes them only when it makes the repository.

To see what the setup would change, without changes:

```bash
DRY_RUN=1 bash scripts/setup.sh
```

### The Setup workflow

The board, the labels, and the variables can also be set up on Github, with nothing on your computer: **Actions** > **Setup** > **Run workflow**. It does the same as the setup script, from `config.yaml`, with the same rules (it changes only what is not set yet). It needs the `PROJECT_TOKEN` secret.

- Fill in a field to change that setting, for example the default City. The workflow writes it into `config.yaml` and into the form, in one commit. An empty field keeps the value of `config.yaml`.
- Select **Dry run** to see what it would change, and change nothing.
- The summary of the run shows what it did, the steps for you (the sort of the views), and the text of the bookmark.

## Add an application

### From a job post

1. Open the job post: a LinkedIn post, a company career page, or a post on a job board. See [the supported sites](docs/supported-sites.md).
2. Click the bookmark.
3. A new issue form opens. The bookmark fills in the company, position, date, link, and the job description. A link cannot fill in a dropdown, so **Stage** and **Source** can be empty. You can leave them empty. See [Empty Stage or Source](#empty-stage-or-source).
4. Make sure that the data is correct. The values from the bookmark cannot be changed in the form (a Github limitation): edit the issue after you create it. The company name can be wrong on some sites. To save the job for later, change **Stage** to **Wishlist (not applied yet)**.
5. Check **Job description**. The bookmark takes the text that you selected on the page; with no selection, the description of the post (from the schema.org data of the page, or from a known element on LinkedIn, Greenhouse, Lever, and Workday). A very long description is cut in the form, and the full text is on the clipboard: paste it into the issue after you create it. If the description is empty, the system reminds you in a comment and in the weekly summary.
6. Click **Create**.

### From a recruiter message

On a computer:

1. Open the LinkedIn profile of the recruiter (a `linkedin.com/in/...` page).
2. Click the bookmark. The bookmark fills in **Recruiter / contact** with the name and the profile link. **Job link** stays empty, so the system sets **Source** to **Recruiter outreach**.
3. Fill in the company and the position.
4. Paste the message into **Job description / recruiter message**.

On a phone:

1. Open the new issue form. The setup script shows the link. Save this link on your phone.
2. Paste the message into **Job description / recruiter message**.
3. Leave **Job link** empty if there is no link. Leave **Source** empty, or set it to **Recruiter outreach**.

### Empty Stage or Source

**Stage** and **Source** are not required. When you create or edit an issue with an empty **Stage** or **Source**, the system fills it in on the issue:

| Field | Empty value becomes |
| --- | --- |
| **Stage** | **Applied** |
| **Source** | **LinkedIn job post** for a `linkedin.com/jobs` link, **Job board** for a link on a site in `jobBoards` in `config.yaml`, **Company website** for another link, and **Recruiter outreach** when there is no link |

For **Referral** or **Other**, select it yourself. A value that you select always stays.

### The same job twice

When you open an issue, the system looks for other issues with the same **Job link**. If it finds one, it writes a comment with a warning and the number of the other issue. If the new issue is a duplicate, you can delete it: click **Delete issue** at the bottom of the right sidebar. The system does not delete it for you. If you apply for the same job again, keep it.

### Save a job for later

In the form, set **Stage** to **Wishlist (not applied yet)**. The card goes to the **Wishlist** column. When you apply, write `/applied`. See [Comment commands](#comment-commands).

If you plan a step with `/next` while the card is in **Wishlist**, the card goes to **In progress**. See [Comment commands](#comment-commands).

## Update an application

- When the status changes, move the card on the board, or use a command: `/applied`, `/hold`, `/offer`. `/next` moves a **Wishlist** or **Applied** card to **In progress** for you.
- When the company rejects you, write `/rejected`, or close the issue. The status changes for you. See [Rejected](#rejected).
- Add your notes as comments.

### Project fields

The system fills in the project fields from the issue form:

- When you open an issue, **Applied date**, **Company**, **Position**, **City**, **Salary range**, **Recruiter**, and **Job link** get the values from the form. **Last update** gets the same date as **Applied date**.
- When you edit the issue, the fields get the new values from the form.
- When you close the issue, **Last update** gets the date of today, and the status can change. See [Rejected](#rejected).

Comments do not change **Last update**. When something happens in the process, change **Last update** on the card yourself. For a planned step, use `/next`. It sets **Last update** for you. If the status is **Wishlist** or **Applied**, it also changes the status to **In progress**.

**Interviews** is the number of interviews you had for the application. A new application gets 0. Each `/interview` comment adds 1. If the number is wrong, change it on the card yourself. The weekly summary uses it. The weekly summary lists the **In progress**, **On hold**, **Offer**, and **Rejected after interview** applications that still have 0, so you do not forget to fill it in.

A **Last update** of today or later means a planned step, for example an interview. The weekly summary shows it under **Coming up**.

### Comment commands

Write a comment that starts with one of these commands:

| Command | Result |
| --- | --- |
| `/interview` | Changes your comment into an interview notes template. Edit the comment to fill it in. **Interviews** on the card goes up by 1. |
| `/interview technical` | The same, with the interview type filled in. |
| `/next 2026-10-25 email recruiter` | Sets the next step and its date. **Last update** on the card gets the same date. If the status is **Wishlist** or **Applied**, it changes to **In progress**. |
| `/next +7 they will answer` | Sets the next step to 7 days from today. **Last update** gets that date. The status changes the same way. |
| `/applied` | You applied for a **Wishlist** job. The status changes to **Applied**. **Applied date** and **Last update** get the date of today. The form changes too: **Stage** is **Applied** and **Date** is today. |
| `/applied 2026-10-20 sent CV by email` | The same, with the date you applied and a note. |
| `/hold summer vacation` | The status changes to **On hold**. **Last update** gets the date of today. Works for **Applied**, **In progress**, and **Offer**. |
| `/period 2026-03` | Moves this application to the period `2026-03`. The current period does not change. See [Labels](#labels). |
| `/offer` | You got an offer. The status changes to **Offer**. **Last update** gets the date of today. Your comment changes into an offer template (salary, benefits, start date, answer date). Works for **Applied**, **In progress**, and **On hold**. |
| `/followup +7` | You sent a follow-up email. Adds the label `followed up`. **Last update** gets the date of today, so the reminders start again. With `+7` or a date, the comment plans a check for an answer (it shows under **Coming up**). |
| `/withdraw not a fit` | You stopped the process. Adds the label `withdrawn interest`, sets the status to **Rejected without interview** and **Last update** to today, and closes the issue as **not planned**. Works for **Applied**, **In progress**, and **On hold**. |
| `/moved #296` | The company moved you to the process in issue #296. Closes this issue as a duplicate of #296, adds the label `redirected`, and removes the card from the board. |
| `/rejected` | The process stopped. Closes the issue as not planned and changes the status. See [Rejected](#rejected). |
| `/rejected position filled` | The same, with the reason in the comment. |

Only the owner of the repository can use the commands. They work in the Github mobile app too. When you open an issue, the system adds a comment with this list of commands.

`/next` changes only **Wishlist** and **Applied** to **In progress**. It does not change the other statuses. For example, a `/next` on an **On hold** or **Rejected after interview** card keeps the status.

### Rejected

When the company rejects you, write `/rejected` (you can add the reason after it), or close the issue. The system changes the status by the **Interviews** field on the card:

| Status before | Interviews | Status after |
| --- | --- | --- |
| **Applied**, **In progress**, or **On hold** | 0 or empty | **Rejected without interview** |
| **Applied**, **In progress**, or **On hold** | 1 or more | **Rejected after interview** |
| **Wishlist**, **Offer**, or a **Rejected** status | any | No change |

So fill in **Interviews** before you close the issue. **Last update** gets the date of today.

When the status changes, the system also sets the close reason to **not planned**.

#### Completed or not planned

Github has two reasons to close an issue. On Github, they look different, and you can search for them:

| Reason | Icon | Use it for | Search |
| --- | --- | --- | --- |
| **Completed** (the default "Close issue") | Purple | An offer that you accepted. The weekly summaries also close as completed. | `is:closed reason:completed` |
| **Not planned** | Gray | A rejection, a withdrawn interest, or a job that you did not apply for. | `is:closed reason:"not planned"` |

The workflows and the weekly summary do not use the close reason. They use the **Status**. The reason only helps you when you look at the issue list.

### Redirected processes

Sometimes a company moves you from one application to another process. You applied, but they do not evaluate the first application. Write `/moved #N` in the first issue. `N` is the number of the issue of the new process. The first issue does not count in the weekly summary.

### Revisit later

Sometimes a company rejects you, but you can get in touch again later. Keep the status **Rejected after interview**. Keep the issue open, or open it again. Add the label `revisit later`.

Each day, the system reminds you to plan the next contact. Plan it with `/next 2026-12-01 write to them again`. The reminders stop until that date. The day after that date, they start again. The weekly summary shows the date under **Coming up**, also when the issue is closed.

### Withdrawn interest

When you stop a process yourself, write `/withdraw`. Or by hand: set the status to **Rejected without interview**, add the label `withdrawn interest`, and close the issue as **not planned**. The status stays **Rejected without interview**, also when you had interviews. The weekly summary counts these separately.

### On hold

When a process is not finished but you will continue it later, write `/hold`, or set the status to **On hold**. You get no "10 days" reminders for it. A `/next` date still shows under **Coming up**.

### Ghosted

Each morning, the system adds the dark gray label `ghosted` to an open issue when:

- The status is **Applied**, and
- **Last update** is 30 or more days ago (see [Settings you can change](#settings-you-can-change)), and
- The issue does not have the label `on-pause`.

The status does not change. The weekly summary shows the ghosted applications.

When the status changes to **In progress**, **On hold**, **Offer**, or **Rejected after interview**, the system removes the label. With **Rejected without interview**, the label stays. If the company sent a rejection, remove the label yourself.

### Followed up

When you send a follow-up email, write `/followup` (or add the label `followed up`).

### Labels

The setup script makes these labels:

| Label | Meaning | Who adds it |
| --- | --- | --- |
| `source: linkedin`, `source: company site`, `source: job board`, `source: recruiter`, `source: referral`, `source: other` | Where the application started | The system, from **Source** in the form |
| `on-pause` | No follow-up reminders | You |
| `revisit later` | Rejected, but get in touch again later | You |
| `withdrawn interest` | You stopped the process | You, `/withdraw`, or the import script |
| `followed up` | You sent a follow-up email | You, or `/followup` |
| `redirected` | Moved to another process | The system, with `/moved` |
| `summary` | Weekly summary | The system |
| `ghosted` | You applied, but there is no answer for 30 days. The status stays **Applied**. | The system. See [Ghosted](#ghosted). |
| `maintenance` | A problem with the setup, for example the token. The system does not put these issues on the board. | The system. See [If there is a problem](#if-there-is-a-problem). |
| `imported` | Imported from a spreadsheet | The import script |
| `period: 2026`, `period: 2027`, ... | The job search period | The system, from the current period (see below). `/period`. The import script uses the `Period` column. |

A period is one job search, not a year: an application on December 20 and one on January 2 are in the same period. When you open an issue, the system adds the label of the current period (the repository variable `CURRENT_PERIOD`). The period stays until you end it, also after a long break:

- To end it, go to **Actions** > **End a period** > **Run workflow**. Write the name of the new period, or leave it empty: then your next application starts the new period, named by the month of its **Date**, for example `period: 2027-04`, and the system writes a comment.
- To move one application to another period, write `/period NAME` in it, for example `/period 2026-03`.
- To take the cards of an old period off the board, see [Archive a period](#archive-a-period).

A later change of **Date** does not change the label. The setup script sets `CURRENT_PERIOD` to your newest `period: ...` label.

## Follow-up reminders

Each morning, the system checks the open applications. It does not check the archived cards.

The system writes a comment and mentions you when:

- The status is **In progress** and **Last update** is 10 or more days ago (see [Settings you can change](#settings-you-can-change)). The system writes this reminder each day until you change **Last update**. Comments do not count as an update.
- The status is **Applied**, **In progress**, **On hold**, or **Offer**, and the date of the next step (`/next`) was yesterday. The comment tells you to write your notes with `/interview`.
- The issue has the label `revisit later`, and there is no `/next` date of today or later. See [Revisit later](#revisit-later).

An issue has only one reminder comment. A new reminder replaces the old one: the system deletes the old comment and writes a new one, so you get a notification each time.

To stop the reminders for one application, add the label `on-pause`. To start them again, remove the label.

## Weekly summary

Each Monday morning, the system opens a new issue with the label `summary`. It closes the summary from the previous week. It adds the new summary to the project, so you can see all summaries in the **Summaries** view.

The summary shows:

- The number of applications for each status. Under **Applied**, it shows how many are ghosted. Under **Rejected without interview**, it shows how many have the label `withdrawn interest`.
- The last 7 days, compared with the 7 days before. The system counts the 7 days before again in the same way. It does not use the previous summary. It compares:
  - The new applications (by **Applied date**).
  - The interviews (by the date of the `/interview` comments).
  - The rejections (by **Last update**).
- The last 7 days in detail:
  - **New applications**: **Applied date** is in the last 7 days.
  - **Rejected**: **Last update** is in the last 7 days, and the status is **Rejected after interview** or **Rejected without interview**. The ones with the label `withdrawn interest` are marked.
  - **Other updates**: the other applications with a **Last update** in the last 7 days.
- **Coming up**: the open applications with a **Last update** of today or later, or a `/next` date of today or later.
- The applications that need a follow-up.
- **Ghosted**: the open **Applied** applications with no answer for 30 or more days, and the total of all time. See [Ghosted](#ghosted).
- The wishlist jobs that are older than 7 days.
- All time:
  - The total of **Interviews**, and the total for each status.
  - The applications that reached an interview, but have no **Interviews** value yet.
  - Durations in days, with the median, the average, and the number of applications:
    - From **Applied date** to a rejection without interview. Without `withdrawn interest` and `ghosted`.
    - From **Applied date** to the first interview (the first `/interview` comment).
    - From **Applied date** to a rejection after interview.
    - The open **In progress** and **On hold** processes: the days since **Applied date**.

    For a rejection, the system uses **Last update**. When **Last update** is the same as **Applied date**, there is no date for the answer (for example, an imported row), so the system leaves it out.
  - For each source: the number of applications, how many reached an interview, the total of **Interviews**, and how many are ghosted.
  - For each **CV / cover letter version** in the form: the number of applications, how many got an answer, how many reached an interview, and the total of **Interviews**. Only when you fill in the version.

The summary does not count the archived cards. See [Archive a period](#archive-a-period).

To make a summary now, go to **Actions** > **Weekly summary** > **Run workflow**.

## Charts

1. Open the project board.
2. Open **Insights**.
3. Make a bar chart. Set **X-axis** to **Status**.
4. Make a bar chart. Set **X-axis** to **Labels**. Set **Group by** to **Status**.
5. To count only real applications, add this filter: `-status:Wishlist`.

## Export

To get all your applications as files (a backup, or to use them somewhere else):

1. Go to **Actions** > **Export** > **Run workflow**.
2. Optional: write a period, for example `2026`, to export only that period. Clear **Also the archived cards** to leave them out.
3. When the run is finished, open it and download the **applications** artifact. Or, on your computer: `gh run download --name applications`.

The artifact has `applications.json` (the format of the import) and `applications.csv`. Github keeps it for 7 days.

## Archive a period

When a job search period ends, you can take its cards off the board. The issues stay.

1. Go to **Actions** > **Archive a period** > **Run workflow**.
2. Write the period, for example `2026`. The workflow archives the cards of all issues with the label `period: 2026`.
3. Optional: select **Also close the open issues of this period**. The workflow closes them as **not planned**. Their status does not change.
4. Click **Run workflow**.

The weekly summary and the follow-up reminders do not use the archived cards. To see the archived cards, open the project menu and select **Archived items**. You can restore a card from there.

## Import old data

### From a JSON file (any source)

`scripts/import_applications.py` imports a JSON file in the format of `schema/applications.schema.json` (the export workflow makes the same format). An AI agent can make this file from any spreadsheet, export, or notes, in any language: see the `import-applications` skill.

```bash
python3 scripts/import_applications.py --check data/import/applications.json
python3 scripts/import_applications.py data/import/applications.json USER/job-applications PROJECT_NUMBER --dry-run
python3 scripts/import_applications.py data/import/applications.json USER/job-applications PROJECT_NUMBER
```

`--check` checks the file only (no Github). It also shows the periods: an application without a `period` gets one from the dates, as for the CSV import below. `--dry-run` shows what the import would do. `--period`, `--archive`, and `--update-fields` work as for the CSV import below. An application is imported once (a hidden `import-id` in the issue), so you can run it again.

### From a CSV file

You can import applications from a spreadsheet.

1. Make sure that the spreadsheet has these columns:
   `Date, Company, Position, Recruiter, City, Salary Range, Job Link, Response, Status`
2. Optional: add a `Source` column. If there is no `Source`, the script uses the link to find it.
3. Optional: add a `Period` column, for example `2023`. The script adds the label `period: 2023`. If there is no `Period`, the dates make the periods: a gap of more than `periodGapDays` (default: 90) between two applications starts a new period, named by its first and last month. For example, applications from December 1 to April 5 and again from November get `period: 2025-12-to-2026-04` and `period: 2026-11-to-2027-02`.
4. In the `Status` column, write a Status name from the board, for example `Rejected without interview`. You can also write one of these colors:

   | Color | Status |
   | --- | --- |
   | `pink` | Wishlist |
   | `white` | Applied |
   | `green` | In progress |
   | `purple` | Offer |
   | `red` | Rejected after interview |
   | `gray` | Rejected without interview |
   | `yellow` (or `withdrawn`) | Rejected without interview, with the label `withdrawn interest` |

   An empty `Status` is **Applied**.
5. Export the spreadsheet as CSV. Put it in the `data` folder. Git does not track this folder.
6. Run this command:
   ```bash
   python3 scripts/import_csv.py data/applications.csv USER/job-applications PROJECT_NUMBER
   ```

The script puts the `Response` text into the **Timeline (imported)** section of each issue. It also fills in the project fields. **Last update** is the last date in the `Response` text. For example, if `Date` is `2026-10-05` and `Response` is `Position filled. 9 oct rejected`, **Last update** is `2026-10-09`. If there is no date in the text, **Last update** is the same as `Date`.

The script skips the rows that are already imported, so you can run it again. To fill in the project fields of imported rows again, add `--update-fields`.

To import only some periods, add `--period` one or more times. To close the issues and remove their cards from the board, add `--archive`:

```bash
python3 scripts/import_csv.py data/applications.csv USER/job-applications PROJECT_NUMBER \
  --period 2023 --period 2025 --archive
```

To see the archived cards, open the project menu and select **Archived items**. To find the issues, search for the label, for example `label:"period: 2023"`.

## Files

| File | Purpose |
| --- | --- |
| `.github/ISSUE_TEMPLATE/application.yaml` | The new application form |
| `.github/workflows/sync.yaml` | Adds new issues to the board, fills in the project fields, warns about the same Job link, and sets the status when you close an issue. The code is in `.github/scripts/sync.js`. |
| `.github/workflows/commands.yaml` | The comment commands (`/interview`, `/next`, `/applied`, `/hold`, `/offer`, `/followup`, `/withdraw`, `/moved`, `/rejected`). The code is in `.github/scripts/commands.js`. |
| `.github/workflows/followup.yaml` | The daily follow-up reminders. The code is in `.github/scripts/followup.js`. |
| `.github/workflows/weekly-summary.yaml` | The weekly summary. The code is in `.github/scripts/weekly-summary.js`. |
| `.github/workflows/doctor.yaml` | Checks the setup each day (private repository, token, board, labels, variables, workflows). The code is in `.github/scripts/doctor.js`. |
| `.github/workflows/tests.yaml` | Runs the unit tests in `tests/` on each push. Run them on your computer: `node --test "tests/*.test.js"` |
| `.github/workflows/end-period.yaml` | Ends the current job search period. The code is in `.github/scripts/end-period.js`. |
| `.github/workflows/export.yaml` | Exports all applications as JSON and CSV. The code is in `.github/scripts/export.js`. |
| `.github/workflows/archive-period.yaml` | Archives the cards of one period. The code is in `.github/scripts/archive-period.js`. |
| `.github/scripts/project.js` | Shared code of the workflows |
| `config.yaml` | The settings: the Status options, the project fields, the sources, the labels, and the number of days. The workflows, the setup scripts, and the import script read it. |
| `.github/workflows/welcome.yaml` | In a new copy that is not set up yet: opens the **Finish the setup** issue. The code is in `.github/scripts/welcome.js`. |
| `.github/workflows/setup.yaml` | Sets up the board, the labels, and the variables, and makes the bookmark. The code is in `.github/scripts/setup.js` and `.github/scripts/render.js`. |
| `scripts/setup.sh` | The setup from your computer: checks the repository, asks for the settings, saves the token, and runs the Setup workflow |
| `scripts/import_applications.py` | Imports a JSON file (`schema/applications.schema.json`) |
| `scripts/import_csv.py` | Imports old data |
| `docs/supported-sites.md` | The sites where the bookmark reads the job post |
| `scripts/bookmarklet.src.js` | The code of the bookmark |
| `scripts/make_bookmarklet.sh` | Makes `data/bookmarklet.txt` from `bookmarklet.src.js`, with your repository in it, on your computer (the Setup workflow makes the same). If you change `bookmarklet.src.js`, run `bash scripts/make_bookmarklet.sh USER/job-applications` and paste the new text into the bookmark. |
| `templates/interview-note.md` | The interview notes template. `/interview` makes the same text. |
| `skills/` | Instructions for AI coding agents (Agent Skills format): import old data, add an application, interview prep, CV tailoring, follow-up emails, recruiter replies, referrals, offers and negotiation, a weekly plan, a retro, data cleanup, setup checks, and new job boards. `.claude/skills` and `.agents/skills` point to this folder. `AGENTS.md` lists them for other agents. |

## Settings you can change

All the settings are in `config.yaml`, with a comment on each one. After a change, run the setup again (**Actions** > **Setup**, or `bash scripts/setup.sh`): it changes the board, the labels, the form, and the workflow times to match.

| Setting | `config.yaml` |
| --- | --- |
| Your time zone (the times below are in it) | `timezone` |
| Daily follow-up reminders | `reminderTime` |
| Weekly summary | `summaryDay`, `summaryTime` |
| Daily setup check (Doctor) | `doctorTime` |
| Default City and the Salary range example in the form | `city`, `salaryPlaceholder` |
| Days before a follow-up reminder (default: 10). The weekly summary uses the same number. | `followUpDays` |
| Days with no answer before the `ghosted` label (default: 30) | `ghostedDays` |
| Days without an application that make a new period in an import (default: 90) | `periodGapDays` |
| Days before the token expires when the Doctor warns you (default: 14) | `tokenWarnDays` |
| Status colors and descriptions | `statuses`. See [If there is a problem](#if-there-is-a-problem). |
| Label colors and descriptions | `labels` and `sources` |
| Supported job boards | `jobBoards`. See [`docs/supported-sites.md`](docs/supported-sites.md); to add a site, follow `skills/add-job-board/SKILL.md`. |

Other fields of the form: `.github/ISSUE_TEMPLATE/application.yaml`. If you change the **Source** options, change `sources` in `config.yaml` and `scripts/bookmarklet.src.js` too.

**Times and summer time:** Github runs schedules in UTC. So the setup gives each scheduled workflow one `cron` line for summer time and one for winter time, and the workflow runs only for the line of the day's UTC offset: the reminders come at the same local time all year. To change a time in a workflow file, the token needs the `workflow` scope; without it, the setup tells you which files to change.

## If there is a problem

Each morning, the **Doctor** workflow checks the setup. It opens one issue with the label `maintenance`, mentions you, and lists the problems:

- The repository is public (everyone can read your applications).
- The token (`PROJECT_TOKEN`) does not work, expires in 14 days or less, or does not have the `repo` and `project` scopes. (The `workflow` scope is needed only to change the workflow times.)
- The board does not have a Status option or a field of `config.yaml`, or `PROJECT_NUMBER` is wrong.
- A label is missing, or a workflow is turned off.

Each problem says how to fix it. When the problems change, the list changes. When everything is OK, the system closes the issue the next morning. To check now, go to **Actions** > **Doctor** > **Run workflow**.

- **The card does not go to the board.** Make sure that the token is not expired.
- **The workflows fail after some months.** The token is expired. Make a new token. Run this command:

  ```bash
  gh secret set PROJECT_TOKEN -R USER/job-applications
  ```

- **A status is not found.** Make sure that the Status names on the board are the same as in `config.yaml`. To set the board again, run the setup again (**Actions** > **Setup**, or `bash scripts/setup.sh`).
