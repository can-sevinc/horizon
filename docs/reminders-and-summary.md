---
title: Reminders and summary
nav_order: 5
---

# Reminders and summary

## Follow-up reminders

Every morning the workflow checks the open applications and mentions you in a comment when:

- the status is **In progress** and **Last update** is 10 or more days old
- a planned `/next` date was yesterday, so you can write your notes
- the issue has `revisit later` and no planned date

Each issue keeps only one reminder comment. A new one replaces the old one, so you still get a notification. Add the `on-pause` label to stop reminders for an issue.

## Weekly summary

Every Monday morning a new issue with the `summary` label opens, and last week's one is closed. It shows:

- how many applications you have in each status
- the last 7 days compared with the 7 days before: new applications, interviews, rejections
- what happened this week, and what is coming up
- applications that need a follow-up, ghosted ones, and old wishlist jobs
- totals and durations (applied to first interview, applied to rejection), with the median
- results per source and per CV version, if you fill in the CV version

Archived cards are not counted. To get a summary now, run **Actions** > **Weekly summary**.

## Charts

Open the project board > **Insights** and add a bar chart with **Status** on the X axis. A second chart with **Labels** on the X axis, grouped by **Status**, shows your sources. Add the filter `-status:Wishlist` to count only real applications.
