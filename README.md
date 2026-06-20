# Time

**The exact time, anywhere — synchronized with the server and accurate to within hundredths of a second.**

Time shows the precise, server-corrected current time — synchronized the same way NTP works, so it stays right even when the device you're viewing it on is set wrong — and lets you read the current time in any city in the world.

[![CI](https://github.com/dominikkoenitzer/Time/actions/workflows/ci.yml/badge.svg)](https://github.com/dominikkoenitzer/Time/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)

**Live:** [time.punds.ch](https://time.punds.ch)

---

## Features

- **Synchronized, accurate time (the point of the site).** An NTP-style measurement samples the server several times, keeps the lowest round-trip sample, corrects the displayed time, and states its precision — _"Accuracy of synchronization was ±0.023 seconds."_
- **Server-corrected time everywhere.** Every clock on the site is drawn from the measured server offset, so the displayed time stays correct even if the device it runs on is set wrong.
- **Any timezone, clean URLs.** Full IANA paths like `/europe/zurich` or bare city names like `/tokyo` resolve to a live local clock with date, UTC offset and ISO week.
- **World clock comparison** and a curated grid of featured cities.
- **Favorites and recently viewed** zones, persisted locally in your browser.
- **12/24-hour, light/dark, and a fullscreen clock**, all keyboard-driven.
- **No external time APIs and no timezone data files** — all timezone math is done client-side with the built-in `Intl` APIs. The server's only job is returning its own time for the sync check.

## Keyboard shortcuts

| Key             | Action                  |
| --------------- | ----------------------- |
| `D`             | Toggle light / dark     |
| `T`             | Toggle 12 / 24-hour     |
| `F`             | Fullscreen clock        |
| `/` or `Ctrl/⌘ + K` | Focus timezone search |

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) and [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com) (CSS-based config, no `tailwind.config`)
- [shadcn/ui](https://ui.shadcn.com) (`radix-maia` style) with [Hugeicons](https://hugeicons.com)
- [next-themes](https://github.com/pacocoursey/next-themes) for theming
- [bun](https://bun.sh) as the package manager and runtime

## Getting started

Requires [bun](https://bun.sh).

```bash
bun install        # install dependencies
bun run dev        # dev server at http://localhost:1000
```

### Scripts

| Script                 | What it does                          |
| ---------------------- | ------------------------------------- |
| `bun run dev`          | Start the dev server (port 1000)      |
| `bun run build`        | Production build                      |
| `bun run start`        | Serve the production build            |
| `bun run typecheck`    | `tsc --noEmit`                        |
| `bun run lint`         | ESLint                                |
| `bun run format`       | Format `**/*.{ts,tsx}` with Prettier  |
| `bun run format:check` | Verify formatting without writing     |

### Configuration

The site needs no environment variables to run. One optional variable is supported:

| Variable               | Default                  | Purpose                                         |
| ---------------------- | ------------------------ | ----------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | `https://time.punds.ch`  | Absolute origin for metadata, sitemap and robots |

## Project structure

| Path                  | What lives there                                                        |
| --------------------- | ----------------------------------------------------------------------- |
| `app/`                | App Router routes, layout, metadata, sitemap, robots, OG image          |
| `app/api/time/`       | The one server endpoint — returns `Date.now()` for the sync check       |
| `app/[...zone]/`      | Catch-all that resolves IANA paths and bare city names to a clock       |
| `components/`         | UI — clock, timezone search, sync status, world clocks, header/footer   |
| `hooks/`              | Live-time ticking and 12/24-hour preference                             |
| `lib/`                | Timezone math (`time.ts`), clock sync (`clock-sync.ts`), local stores, site config |
| `public/`             | Static assets                                                           |

## How synchronization works

`lib/clock-sync.ts` samples `app/api/time/route.ts` several times. It keeps the sample with the lowest round-trip time, compensates the server timestamp for half that round trip, and treats RTT/2 of the best sample as the stated accuracy. The resulting offset corrects every clock on the site. Watchdogs re-measure when the wall-vs-monotonic baseline jumps (a manual clock change or sleep/wake) or when the tab becomes visible again after the result goes stale.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, code-style notes, and the PR checklist. Security reports go through [SECURITY.md](SECURITY.md).

## License

© 2026 Dominik Könitzer. **All rights reserved.** See [LICENSE](LICENSE).

This source is published for transparency and reference only. No license is granted to use, reuse, redistribute, or create derivative works from it. If you'd like to use part of it, please open an issue and ask.
