# Build prompt: MVP

Paste this into GGCoder (or another coding agent) from the repo root.

```
You are working in /Users/dellcbyerllc/projects/getitdone (GitHub: g-baskin/getitdone, PUBLIC, MIT license). Build the MVP of "Get It Done": a personal one-page daily-clarity app for one user (the owner). It is not a product for sale.

READ FIRST, IN THIS ORDER
1. AGENTS.md: non-negotiable rules (public repo, local-only data, original wording, no guilt mechanics, one-page print).
2. docs/PRODUCT_BRIEF.md: purpose, principles, routine, page layouts, and the idea behind each feature.
3. docs/MVP-SPEC.md: the approved scope. This is the SOURCE OF TRUTH for stack, data model, rules, screens, print and acceptance criteria. If anything in this prompt conflicts with it, follow the spec and tell me about the conflict.
4. ROADMAP.md: everything under "Later" is OUT OF SCOPE.

STARTING STATE
- main has one commit (LICENSE). The planning docs above (README.md, AGENTS.md, ROADMAP.md, .gitignore, docs/) are UNCOMMITTED in the working tree.
- .gg/ is a local agent folder and is gitignored. Leave it alone.

SUMMARY OF WHAT TO BUILD (details are in docs/MVP-SPEC.md)
- SvelteKit + strict TypeScript + adapter-static. Data in the browser only (IndexedDB via Dexie). No server, accounts, analytics, CDNs or outbound network calls. Vitest + Playwright. Use bun if installed, otherwise pnpm; commit the lockfile.
- Entities: Goal (one active), Step (max 5 per goal), Project (max 3 active), DailyPage, Blocker, WaitingItem, Win, WeeklyReview, with a schema version.
- Rules: one required one-thing per day; 3-active-project limit (park one, with a reason); blockers and waiting items carry over; waiting items age, get highlighted after the follow-up date and offer a copyable polite follow-up message; blockers need an if-then plan (soft-required), and the "fear" type asks for the smallest brave step; yesterday's unfinished one thing → carry over / shrink / drop; minimum-day mode; wins and completed steps feed the Proof Log; the evening's "tomorrow's one thing" pre-fills the next morning.
- Screens: Today (default), Morning flow (under 5 minutes), Evening check-in, Focus timer (50 minutes + 2-minute reset), Projects, Goal and big steps, Blockers and waiting, Proof Log, Weekly review, Settings (JSON export/import, reset behind a typed confirmation).
- Print: the Today page, a blank daily template and the Weekly review each print on EXACTLY one US Letter page via a print stylesheet. PDF = the browser's "Save as PDF"; no PDF library.

CONSTRAINTS
- All UI copy must be original wording. Never copy text from "High Performance Habits" or "The ONE Thing", and never use their branded tool names (e.g. "Clarity Chart", "High Performance Indicator", "HPI", "High Performance Planner").
- No streaks, shaming or guilt copy.
- Never commit personal data, real names, backups, .env files, secrets or book files. Demo/seed data must be obviously fictional.
- Do not change the repo's visibility or license. Do not merge to main.

WORKFLOW
1. Create branch `mvp` from main. Make the first commit on it "docs: add product brief, MVP spec, roadmap and agent rules", containing the existing uncommitted planning files unchanged.
2. Scaffold and implement in logical commits.
3. Meet every acceptance criterion in docs/MVP-SPEC.md, including unit tests for each rule, a Playwright morning-flow test, Playwright print tests that assert exactly 1 Letter page (Today with demo data, blank template, Weekly review), an export → reset → import round-trip test, and a Playwright check that no external network requests are made.
4. Run typecheck, lint, unit and e2e tests. All must pass.
5. Expand README.md with: how to run it, how to print/save as PDF, where data lives (browser only), and how to back it up. Keep the existing inspiration credit and docs table.
6. Push `mvp` and open a pull request to main. Do not merge.
7. Report back: what was built, test results (with counts), any spec items skipped or changed and why, and the exact commands to run it locally.
```
