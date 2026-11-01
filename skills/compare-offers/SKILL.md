---
name: compare-offers
description: Compare the user's job offers side by side from the /offer comments in their application issues (salary, benefits, start date, answer date, notes), with the points worth negotiating. Use when the user has two or more offers, or one offer to compare with their current job.
---

# Compare offers

## Read the offers

```bash
gh issue list --state all --search 'in:comments "Offer:"' --json number,title,state
gh issue view NUMBER --comments
```

An `/offer` comment becomes a template: `## Offer: DATE`, **Salary**, **Benefits**,
**Start date**, **Answer by**, and notes. Read the interview notes and **First impressions**
too: the team, the work, the user's interest (**Interest:** n/5).
Ask the user for what is missing, and for their current job if they want to compare with it.

## Compare

1. A table, one column per offer: base salary (same unit: per year, same currency; say the
   rate you used), bonus / equity, pension, vacation, remote, location and commute, start
   date, **answer by**, the role and the level, the team, the user's interest.
2. Total yearly value where it can be counted. Mark what is an estimate.
3. Beyond money, from the notes: growth, the manager and the team, the stack, stability.
4. **Negotiation points**: for each offer, what is weak compared with the others, and what to
   ask for (with the other offer as a reason, if the user is fine sharing it).
5. **Deadlines**: the answer dates in order, and what to do first.

## Rules

- Do not decide for the user. Ask what matters most to them, and order the table by that.
- For a counter-offer email, use the `negotiate-offer` skill.
