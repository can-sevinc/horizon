---
name: ask-for-referral
description: Draft a short message asking a contact at a company for a referral to a job, from the application issue or a job post. Use when the user knows someone at a company they want to apply to, or asks how to ask for a referral.
---

# Ask for a referral

## Inputs

- The job: an issue (`gh issue view NUMBER`), a URL, or pasted text.
- The contact: name, how the user knows them (a former colleague, a friend, a weak tie, no tie), and the channel (LinkedIn, email, chat).
- Optional: the user's CV, for one or two lines on the fit.

## Steps

1. Write the message, in the language the user uses with the contact. Shorter for a weak tie:
   - a personal first line (how they know each other; for no tie, why this person),
   - the role, with the link,
   - one or two lines on why the user fits,
   - the ask: a referral, or first a short chat about the team,
   - an easy way out ("no worries if it is not a good time"),
   - offer to send the CV and a short blurb they can forward.
2. Write the blurb too (3 sentences in the third person) for the contact to forward.
3. Show both. The user sends them.
4. If the user does not have an issue for this job yet, offer the `add-application` skill:
   Stage **Wishlist**, Source **Referral**, the contact in **Recruiter / contact**.
