---
name: add-application
description: Add a job application to the tracker from a job post URL, pasted posting text, or a recruiter message, by creating the issue with gh. Use when the user wants to add an application without the bookmark (on a phone, a site the bookmark reads wrong, a recruiter email or LinkedIn message).
---

# Add an application

The issue must look like one made with the form (`.github/ISSUE_TEMPLATE/application.yaml`):
the workflows read its `### Section` headings. Then the sync workflow puts it on the board,
adds the labels, and fills in an empty Stage or Source.

## Steps

1. **Get the posting.** From a URL: open the page and read the title, the company, the city,
   the salary, and the description (a schema.org `JobPosting` in the page has most of it).
   If you cannot open it, ask the user to paste the text. From a message: the recruiter's
   name, the company, the role, and the message itself.

2. **Fill in the fields.** Ask only for what is missing and needed (Company, Position):
   | Section | Value |
   | --- | --- |
   | Stage | `Applied`, or `Wishlist (not applied yet)` when the user did not apply yet |
   | Source | An option of `sources` in `config.yaml`, or `_No response_` (the system guesses it from the Job link) |
   | Date | `YYYY-MM-DD`: the day the user applied (default: today) |
   | Company, Position | From the posting |
   | Recruiter / contact | Name and profile link, or `_No response_` |
   | City | From the posting, or the default `value` of `city` in the form |
   | Salary range | Only when the posting says it |
   | Job link | The URL, without tracking parameters; `_No response_` for a message without a posting |
   | Job description / recruiter message | The full text of the posting or the message |
   | CV / cover letter version | Ask; `_No response_` if the user does not know |
   | First impressions | The user's words, or `_No response_` |

3. **Check for the same job:** `gh issue list --state all --search "COMPANY in:title" --json number,title,state`.
   If one looks the same, ask before you create another.

4. **Show the title and the fields** to the user. Change them if they ask.

5. **Create the issue.** Write the body to a file, every section in the order of the table,
   each as `### Section`, an empty line, the value, an empty line. An empty value is `_No response_`:
   ```bash
   gh issue create --title "[COMPANY] POSITION" --body-file FILE
   ```

6. Tell the user the issue link. The board card appears in a minute (the sync workflow).
