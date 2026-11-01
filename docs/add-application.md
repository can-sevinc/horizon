---
title: Add an application
nav_order: 3
---

# Add an application

## From a job post

1. Open the job post. The bookmark knows the [supported sites](supported-sites.md), but it works on most other sites too.
2. Click the bookmark. A new issue form opens with the company, position, date, link, and job description.
3. Check the values. Github resets values that came from the link when you edit them in the form, so fix them in the issue after you create it.
4. Check **Job description**. If you selected text on the page, the bookmark uses that. Very long descriptions are cut, and the full text is copied to your clipboard so you can paste it into the issue later.
5. Click **Create**.

**Stage** and **Source** can stay empty. Stage becomes **Applied**. Source is guessed from the link: **LinkedIn job post**, **Job board** (sites in `jobBoards` in `config.yaml`), **Company website**, or **Recruiter outreach** when there is no link. Pick **Referral** or **Other** yourself. A value you choose is never changed.

If the job description is empty, you get a reminder in a comment and in the weekly summary. Job posts often disappear, so it's worth saving.

## From a recruiter message

On a computer, open the recruiter's LinkedIn profile and click the bookmark. It fills in **Recruiter / contact**. Add the company and position, and paste the message into **Job description / recruiter message**.

On a phone, open the new issue form (save the link from the setup) and paste the message. Leave **Job link** empty if there is none.

## Save a job for later

Set **Stage** to **Wishlist (not applied yet)**. When you apply, comment `/applied`.

## The same job twice

If another issue has the same job link, you get a comment with its number. Delete the new issue if it's a mistake, or keep it if you are applying again.
