---
name: recruiter-reply
description: Draft a reply to a recruiter message (LinkedIn or email) - interested, not interested, or asking for more information - and offer to add it as an application. Use when the user pastes a recruiter message or asks how to answer one.
---

# Recruiter reply

## Inputs

- The recruiter's message (pasted by the user, or in the **Job description / recruiter message** of an issue: `gh issue view NUMBER`).
- What the user wants: interested, not interested, or more information. Ask if it is not clear.
- Optional: what matters to the user (salary, remote, location, stack, timing).

## Steps

1. Read the message. Note: the company (or "a client"), the role, the location and remote,
   the salary, the stack, what is missing, and what the recruiter asks for.

2. Write the reply, in the language of the message, short (3–7 sentences), friendly, and direct:
   - **Interested**: thanks, one line on why it fits, the questions on what is missing
     (salary range, remote, the company name if hidden, the process), and a next step (a call, the CV).
   - **More information**: thanks, the 2–4 questions that decide it, no promise.
   - **Not interested**: thanks, a short reason if the user wants (role, salary, timing),
     and, if the user wants, what would interest them in the future.
   Leave a `[…]` for anything you do not know. Do not invent the user's experience.

3. Show the draft. The user sends it.

4. If the user is interested, offer to add it with the `add-application` skill:
   Source **Recruiter outreach**, the recruiter in **Recruiter / contact**, the message in
   **Job description / recruiter message**, and Stage **Wishlist** until the user applies.
