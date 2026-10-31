# Roadmap

## Now: MVP

Build everything in [`docs/MVP-SPEC.md`](./docs/MVP-SPEC.md). Data is local-only, the daily page and weekly review print on one page each, and every rule is covered by tests.

## Later (needs owner approval before starting)

| Idea | Notes |
|---|---|
| Install on phone (PWA) | Home-screen icon, works offline. Low risk, still local-only. |
| Gentle reminders | Morning, evening and Sunday nudges. Must stay optional and guilt-free. |
| Sync between devices | Probably Cloudflare (Workers + D1) with sign-in. This is the first time data would leave the device, so it needs a privacy plan first. |
| GitHub integration | Auto-fill "Working on" and "Waiting on" from open pull requests, reviews and issues. |
| Monthly view | Wins, kept one things, and how the time split across the month. |
| Coaching prompts | Optional AI help to shrink a one thing that's too big, or to suggest a next step for a blocker. Only with an explicit privacy decision. |
| Better PDF | A downloadable PDF file instead of the browser's print dialog, if the browser version isn't good enough. |
