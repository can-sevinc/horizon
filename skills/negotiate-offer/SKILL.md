---
name: negotiate-offer
description: Draft a counter-offer email or call notes for a job offer, from the /offer comment in the application issue and what the user wants. Use when the user wants to negotiate an offer's salary, start date, title, remote days, or other terms.
---

# Negotiate an offer

## Inputs

- The offer: the `## Offer: DATE` comment of the issue (`gh issue view NUMBER --comments`).
- What the user wants: the number or the terms, and their walk-away point (keep it private:
  it does not go into the email).
- What supports it: another offer, market data the user has, the interview feedback, skills
  the role needs. Ask; do not invent numbers or offers.

## Steps

1. Agree on the ask with the user: one main ask (usually the base salary), and at most two
   others (sign-on bonus, start date, title, remote days, vacation, equity).
2. Write the email, in the language of the process, 6–10 sentences:
   thanks and real interest; the ask with one specific number (not a range); one or two
   reasons; flexibility on the other terms if the user has it; a clear next step.
   Polite and firm; no apology, no ultimatum unless the user wants one.
3. Optionally, call notes: the opening line, the ask, answers to "what is your number",
   "this is our best offer", and "we need an answer by Friday".
4. Show the draft. The user sends it.
5. After the answer, offer to add a comment to the issue with the new terms (a plain comment,
   not `/offer`, so the status stays).
