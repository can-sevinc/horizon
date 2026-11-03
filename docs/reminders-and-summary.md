---
title: Reminders and summary
nav_order: 5
---

# {% include icon.html name="reminders" %} Reminders and summary
{: #reminders-and-summary }

Horizon checks your applications each morning. The times and waiting periods come from `config.yaml`.

## Follow-up reminders

With the default settings, you get a comment that mentions you when:

- an **In progress** application's **Last update** is at least 10 days old
- a planned `/next` date was yesterday, and the application is still active
- an issue has `revisit later` and no date planned for today or later

Each issue keeps one reminder comment. A new reminder replaces the old one, so you get a fresh notification without a long list of reminders.

Add `on-pause` to stop reminders for that issue. Remove it when you want them again. On hold stops reminders about an old update, but not reminders for a planned step.

---

## {% include icon.html name="calendar" %} Weekly summary
{: #weekly-summary }

By default, a new summary opens every Monday morning. It has the `summary` label. Last week's summary closes, but you can still read it.

The summary shows:

- the number of applications in each status
- new applications, interviews, and rejections from the last 7 days, compared with the week before
- this week's events and upcoming steps
- applications that need a follow-up, ghosted ones, and old wishlist jobs
- typical time from applying to the first interview or rejection, using the median (the middle result)
- results by source and CV version, when those details are available

Archived cards are not counted. To get a summary now, run **Actions** > **Weekly summary**.

---

## Charts on the board

Open the project board, then **Insights**. Add a bar chart with **Status** on the X axis. A second chart with **Labels** on the X axis, grouped by **Status**, can show your sources.

Use the filter `-status:Wishlist` if you want to count only jobs you applied for.
