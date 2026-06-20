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

- **Synchronized, accurate time (the point of the site).** An NTP-style measurement samples the server several times and keeps the lowest round-trip sample, so the displayed time is corrected to within hundredths of a second of the true time — automatically, with nothing to click.
- **Server-corrected time everywhere.** The displayed clock is drawn from the measured server offset, so it stays right even if the device it runs on is set wrong.
- **A kinetic home page.** Scroll to fall through the clock — from this second out to the day, the year, and the Unix epoch.
- **Light / dark theme**, remembered across visits (press `D` to toggle).
- **No external time APIs and no timezone data files** — the current time is computed client-side with the built-in `Intl` APIs. The server's only job is the `/api/time` endpoint, which returns NTP-disciplined true UTC for the sync check.

## Keyboard shortcuts

Press `D` anywhere to toggle light / dark mode.

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
| `app/api/time/`       | The one server endpoint — returns NTP-disciplined true UTC for the sync check |
| `components/`         | UI — the kinetic clock, live tab title, header/footer, page shell        |
| `hooks/`              | Live-time ticking (`use-now.ts`)                                         |
| `lib/`                | Wall-clock helpers (`time.ts`), client clock sync (`clock-sync.ts`), server NTP discipline (`server-time.ts`), site config (`site.ts`) |
| `public/`             | Static assets                                                           |

## How synchronization works

Two layers keep the time honest. On the server, `lib/server-time.ts` disciplines the `/api/time` endpoint against public NTP servers (Cloudflare, Google, `pool.ntp.org`) over UDP — with an HTTP fallback — so the endpoint returns true UTC even if the host's own clock has drifted.

On the client, `lib/clock-sync.ts` samples that endpoint several times. It keeps the sample with the lowest round-trip time, compensates the server timestamp for half that round trip, and treats RTT/2 of the best sample as the accuracy bound. The resulting offset corrects every clock on the site. Watchdogs re-measure when the wall-vs-monotonic baseline jumps (a manual clock change or sleep/wake) or when the tab becomes visible again after the result goes stale.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, code-style notes, and the PR checklist. Security reports go through [SECURITY.md](SECURITY.md).

## License

© 2026 Dominik Könitzer. **All rights reserved.** See [LICENSE](LICENSE).

This source is published for transparency and reference only. No license is granted to use, reuse, redistribute, or create derivative works from it. If you'd like to use part of it, please open an issue and ask.
