# Get It Done

A one-page daily clarity sheet. Each morning you pick **the one thing** that matters most today. On the same page you see what you're working on, what's important, who or what is blocking you, and what you're waiting on. You can print it or save it as a PDF.

It's built for one person who has too many open loops and wants to stop feeling stuck.

> **Status:** first version (MVP). See [`docs/MVP-SPEC.md`](./docs/MVP-SPEC.md) for what it does.

## Docs

| File | What it covers |
|---|---|
| [`docs/PRODUCT_BRIEF.md`](./docs/PRODUCT_BRIEF.md) | The problem, principles, the daily routine, page layouts, and the ideas behind each feature |
| [`docs/MVP-SPEC.md`](./docs/MVP-SPEC.md) | What the first version must do: data model, rules, screens, print and acceptance criteria |
| [`ROADMAP.md`](./ROADMAP.md) | What comes after the first version |
| [`AGENTS.md`](./AGENTS.md) | Rules for coding agents working in this repo |
| [`docs/BUILD-PROMPT.md`](./docs/BUILD-PROMPT.md) | Copy-and-paste prompt for building the first version |

## Run it

You need [Bun](https://bun.sh) 1.3 or newer and Node.js 22.17 or newer.

```sh
bun install
bun run dev          # http://localhost:5173
```

To use the built app instead of the dev server:

```sh
bun run build        # writes a static site to build/
bun run preview      # http://localhost:4173
```

The `build/` folder is plain static files, so any static host can serve it later.

New here? Open **Settings → Load demo data** to look around with a made-up example (a teapot shop on the Moon). Erase it from Settings when you're ready to start for real.

### Checks

```sh
bun run check                    # TypeScript and Svelte
bun run lint                     # Prettier and ESLint
bun run test:unit -- --run       # Vitest
bun run test:e2e:install         # once: downloads the Chromium used by the tests
bun run test:e2e                 # Playwright (builds the app first)
```

## Print or save as PDF

- **Today's page:** on the Today screen, choose **Print or save as PDF**.
- **A blank page to fill in by hand:** on the Today screen, choose **Print blank page**.
- **Weekly review:** on the Weekly review screen, choose **Print or save as PDF**.

Each prints on exactly one US Letter page. To get a PDF, pick **Save as PDF** as the printer in the browser's print dialog. Keep the paper size on Letter and the margins on Default. Turning off "Headers and footers" gives a cleaner page.

## Where your data lives

Everything you enter is stored in this browser's IndexedDB, on this device only. There are no accounts and no server, and the app makes no network requests beyond loading its own files. Its content security policy also blocks requests to anywhere else.

That also means:

- A different browser, device or private window starts empty.
- Clearing this site's data in your browser settings erases your entries.
- Settings has a button that asks the browser to keep your data instead of clearing it when space runs low.

This repository is public and holds code only, never personal entries.

## Back it up

1. Open **Settings** and choose **Download backup**. You get one JSON file named like `backup-2026-10-31.getitdone.json`.
2. Keep that file somewhere outside the browser, such as a synced folder or a USB drive. It contains your personal entries, so don't commit it to this repo. The `.gitignore` blocks `*.getitdone.json` just in case.
3. To restore, open **Settings → Restore from a backup** and pick the file. You'll see what it contains before anything changes. Restoring replaces everything currently in the app.

Backups carry a schema version, so a backup from an older version of the app can be upgraded when it's restored.

**Erase everything** in Settings deletes all data after you type `ERASE`. Download a backup first.

## Privacy

Your entries stay in your own browser. There are no accounts, no tracking, and nothing is sent anywhere. This repository is public and holds code only, never personal entries.

## Inspiration

The ideas draw on *High Performance Habits* by Brendon Burchard (2017) and *The ONE Thing* by Gary Keller and Jay Papasan (2013). All wording in this app is original. This project is not affiliated with or endorsed by either author.

## License

MIT. See [`LICENSE`](./LICENSE).
