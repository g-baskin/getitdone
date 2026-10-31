# MVP spec

This is the approved scope for the first version. If another document disagrees with this one, this one wins. Anything not listed here is out of scope (see `ROADMAP.md`).

## Stack

- SvelteKit + strict TypeScript, `adapter-static`, so it can be hosted on Cloudflare Pages later.
- Data lives only in the browser: IndexedDB via Dexie. No server, accounts, analytics or outbound network calls.
- Vitest for unit tests, Playwright for end-to-end and print tests.
- Use `bun` if installed, otherwise `pnpm`. Commit the lockfile.
- Bundle fonts and assets locally (no CDNs).

## Data model

All dates are the user's local calendar dates (`YYYY-MM-DD`). A new day starts at local midnight.

| Entity | Fields |
|---|---|
| **Goal** | `id`, `title`, `deadline`, `why` (one line), `active`. Only one goal is active at a time. |
| **Step** | `id`, `goalId`, `title`, `status` (`todo` / `doing` / `done`), `targetDate?`, `order`. A goal can have at most 5 steps. |
| **Project** | `id`, `name`, `status` (`active` / `parked` / `done`), `nextStep`, `parkedReason?`, `updatedAt`. At most 3 active. |
| **DailyPage** | `date` (key), `oneThing { text, projectId?, stepId?, done }`, `whyItMatters`, `whoIsCountingOnMe`, `todaysWord`, `important[3]`, `energy { sleepHours?, moved, focusBlocks }`, `evening { didOneThing?, win?, lesson?, tomorrowOneThing? }`, `minimumDay` |
| **Blocker** | `id`, `what`, `who?`, `type` (`person` / `decision` / `info` / `money` / `skill` / `fear`), `ifThenPlan`, `nextStep?`, `createdOn`, `resolvedOn?` |
| **WaitingItem** | `id`, `what`, `fromWhom`, `since`, `followUpOn`, `status` (`waiting` / `received` / `dropped`), `notes?` |
| **Win** | `id`, `date`, `text`, `source` (`evening` / `manual` / `step-completed`) |
| **WeeklyReview** | `weekOf` (Monday's date, key), `intentions { self, people, skills, service }`, `ratings { clarity, energy, drive, output, impact, courage }` (1-10, each with optional note), `mainOutputPercent`, `parkedDecisions[]`, `topWins[3]`, `nextWeekFocus`, `nextWeekStepId?` |

Include a schema version and a migration path from version 1.

## Rules

1. **One thing.** Today's one thing is required to finish the morning flow, and there is only one. Offer to link it to a step or project. If it links to neither, show a gentle note ("This isn't tied to your goal. Still the right call?") but don't block.
2. **Three active projects.** Making a 4th project active requires parking one of the others and giving a reason.
3. **Carry-over.** Unresolved blockers and open waiting items appear on every new day automatically until they're resolved, received or dropped.
4. **Waiting items age.** Each item shows "waiting N days". Once today is past `followUpOn`, it's highlighted and gets a "Copy follow-up message" button. The message is short and polite and fills in what, who and since.
5. **Blockers need a plan.** The if-then plan is soft-required: it has a placeholder example and a gentle prompt if left empty. If the type is `fear`, ask: "What's the smallest brave step?"
6. **Yesterday's unfinished one thing.** If yesterday's one thing wasn't marked done, the morning flow asks first: carry it over, shrink it, or drop it.
7. **Minimum day.** A toggle that reduces the page to the one thing plus one win. No streaks or guilt copy anywhere in the app.
8. **Proof Log.** Recording an evening win or completing a step adds an entry automatically. Wins can also be added manually.
9. **Tomorrow's one thing.** If set in the evening, it pre-fills the next morning's one thing, which can still be edited.

## Screens

| Screen | Purpose |
|---|---|
| **Today** (default) | The full daily page, editable inline. The one thing is visually dominant. |
| **Morning flow** | Five quick steps: today's word → one thing → who's counting on me and why → top 3 → review blockers and waiting items. Ends on Today. Target: under 5 minutes. |
| **Evening check-in** | Did the one thing happen, win, lesson, tomorrow's one thing. |
| **Focus timer** | 50-minute block, then a 2-minute reset screen (breathe, stand, type what the next block is for). Each finished block adds to today's focus blocks. |
| **Projects** | Active (max 3) and Parked lists. |
| **Goal and big steps** | The active goal with up to 5 steps and their status. |
| **Blockers and waiting** | Every open item across all days, sortable by age. |
| **Proof Log** | Scrollable list of wins, newest first. |
| **Weekly review** | Suggested on Sundays and available any time. |
| **Settings** | Export and import a JSON backup; reset all data behind a typed confirmation. |

## Print and PDF

- The Today page and the Weekly review each print on **exactly one US Letter page** using a print stylesheet: black-and-white friendly, no navigation, about 10-11 pt text.
- PDF export is the browser's "Save as PDF". No PDF library in the app.
- Empty fields print as blank lines so an empty page can be filled in by hand.
- A "Print blank page" action prints an empty daily page template.

## Design

- Calm and clean. Phone-first, works well on desktop, large tap targets.
- Accessible: every input is labeled, everything works by keyboard, and contrast meets WCAG AA.
- All copy is short and encouraging. It never scolds.

## Privacy and content

- No personal data in the repo. Seed and demo data must be obviously fictional.
- All UI copy is original wording (see `AGENTS.md`).

## Acceptance criteria

The MVP is done when all of these pass:

- [ ] Unit tests for every rule above: one-thing requirement, 3-project limit, carry-over, waiting-item aging and follow-up message, fear prompt, yesterday's unfinished one thing, minimum day, Proof Log entries, tomorrow pre-fill.
- [ ] Playwright: the morning flow end-to-end on a fresh install.
- [ ] Playwright: the Today page with demo data, the blank daily template, and the Weekly review each render to a PDF of exactly 1 Letter page.
- [ ] Export, then reset, then import restores identical data.
- [ ] No network requests at runtime beyond the app's own files (checked in Playwright).
- [ ] Typecheck, lint, unit and end-to-end tests all pass.
- [ ] The README explains how to run the app, how to print or save as PDF, where data lives (browser only), and how to back it up.
