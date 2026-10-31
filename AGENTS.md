# Agent entry point

Read these before planning, generating or changing code:

1. [`docs/PRODUCT_BRIEF.md`](./docs/PRODUCT_BRIEF.md): what this app is for and how it should feel.
2. [`docs/MVP-SPEC.md`](./docs/MVP-SPEC.md): the approved first-version scope. **This is the source of truth.**
3. [`ROADMAP.md`](./ROADMAP.md): what is deliberately postponed.

## Non-negotiable rules

- **This repository is public.** Never commit personal entries, real names, real goals, exported backups, `.env` files, tokens or secrets. Seed and demo data must be obviously fictional.
- **Data stays local.** The MVP stores everything in the browser (IndexedDB). Do not add servers, accounts, sync, analytics, telemetry, third-party fonts or CDNs, or any outbound network call without the owner's explicit approval.
- **Write original wording.** The concepts are inspired by *High Performance Habits* (Brendon Burchard) and *The ONE Thing* (Gary Keller and Jay Papasan). Never copy text from either book. Never use their trademarked or branded tool names (for example "Clarity Chart", "High Performance Indicator", "HPI", "High Performance Planner"). A short credit in the README is fine.
- **Never commit book files** (PDFs, EPUBs, excerpts) or long quotations.
- **No guilt mechanics.** No streaks, shaming copy, or punishing reminders. The app should lower friction, not add pressure.
- **One page means one page.** The printed daily page and weekly review must each fit exactly one US Letter page.
- Do not change the repository's visibility or license.
- Do not merge to `main`. Work on a branch and open a pull request.

## Current instruction

Build the MVP described in `docs/MVP-SPEC.md` on a branch named `mvp`. Anything listed under "Later" in `ROADMAP.md` is out of scope until the owner approves it.
