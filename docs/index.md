---
title: Home
nav_order: 1
---

<div class="home-banner">
  <img class="brand-light" src="{{ '/assets/v1/brand/horizon-banner-light.svg' | relative_url }}" width="1080" height="256" alt="Horizon">
  <img class="brand-dark" src="{{ '/assets/v1/brand/horizon-banner-dark.svg' | relative_url }}" width="1080" height="256" alt="Horizon">
</div>

# Keep track of your job search.

Horizon puts your applications, interview notes, and next steps in a private Github repository. Each application is an issue and a card on your project board.
{: .home-lead }

There is no server to run and no subscription. Github workflows do the routine work, so you have less to update by hand.

<div class="home-actions">
  <a class="btn btn-primary" href="{{ '/setup.html' | relative_url }}">Set up your copy</a>
  <a class="btn btn-secondary" href="{{ '/add-application.html' | relative_url }}">Save your first job</a>
</div>

<ul class="home-features">
  <li>{% include icon.html name="save" %}<span><strong>Save a job in one click.</strong><br>The bookmark reads the company, role, and job description.</span></li>
  <li>{% include icon.html name="board" %}<span><strong>Keep the board up to date.</strong><br>New issues become cards. Closing an issue sets its rejected status.</span></li>
  <li>{% include icon.html name="interview" %}<span><strong>Keep your interview notes.</strong><br>Use a comment command to open the notes template.</span></li>
  <li>{% include icon.html name="reminders" %}<span><strong>Remember the next step.</strong><br>Get follow-up reminders and a weekly summary.</span></li>
  <li>{% include icon.html name="transfer" %}<span><strong>Bring your old applications.</strong><br>Import a spreadsheet, and export to JSON or CSV later.</span></li>
  <li>{% include icon.html name="skills" %}<span><strong>Get help from an AI agent.</strong><br>Prepare for interviews, tailor a CV, or draft a follow-up.</span></li>
</ul>

<p class="privacy-note">{% include icon.html name="privacy" %} Keep your copy private. Your applications, notes, and salaries are in its issues.</p>

[![Boards created](https://img.shields.io/endpoint?url=https%3A%2F%2Fhorizon.mcansevinc.workers.dev%2Fbadge)](https://github.com/can-sevinc/horizon)

---

## Find what you need

<div class="guide-grid">
{% for guide in site.data.guides %}
  <a class="guide-card" href="{{ guide.path | relative_url }}">
    {% include icon.html name=guide.icon %}
    <span><strong>{{ guide.title }}</strong><small>{{ guide.description }}</small></span>
  </a>
{% endfor %}
</div>

---

## {% include icon.html name="next" %} Where to start
{: #where-to-start }

Start with [Setup](setup.md). It makes your private copy and the board. Then add the bookmark to your browser and save a job post.

Already have a copy? [Comment commands](update-application.md#comment-commands) are the quickest way to record an interview or plan the next step. It works also from the Github mobile app.
