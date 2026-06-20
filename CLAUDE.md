# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **bun** (bun.lock). No test suite exists.

```bash
bun run dev        # dev server at http://localhost:1000 (Turbopack)
bun run build      # production build
bun run typecheck  # tsc --noEmit
bun run lint       # eslint
bun run format     # prettier on **/*.{ts,tsx}
```

Add shadcn/ui components with `npx shadcn@latest add <component>` (style: radix-maia, icon library: Hugeicons). A shadcn skill is installed at `.agents/skills/shadcn`.

## Critical gotchas

- **Next.js 16 differs from training data.** Per AGENTS.md, read the bundled docs in `node_modules/next/dist/docs/` before writing Next.js code. Notably: `params` is a `Promise` (must be awaited in pages and `generateMetadata`), and Turbopack is the default for dev and build.
- **ESLint forbids `setState` directly inside effects** (react-hooks rules). For mounted/hydration flags and external state, use `useSyncExternalStore` — see `hooks/use-time-format.ts` and `ThemeToggle` in `components/site-header.tsx` for the established patterns.
- **Tailwind v4, CSS-based config.** There is no `tailwind.config.*`; tokens live in `app/globals.css` under `@theme inline`. Custom tokens (e.g. `--time-accent` → `text-time-accent`) are added there in both `:root` and `.dark`.
- Icons render as `<HugeiconsIcon icon={SomeIcon} />` with icons imported from `@hugeicons/core-free-icons`. Verify an icon name exists in that package before using it.

## What this site is

A clean "exact time" site ("Time"). The point is **server-synchronized accuracy**: the site silently corrects the displayed time against the server (NTP-style, via `lib/clock-sync.ts` → `correctedNowMs()`), so every clock is right even when the device's own clock is wrong. There is **no** on-screen "your clock is off" or accuracy readout — don't reintroduce one. Never frame the site as auditing the visitor's device clock, and never compare it to or mention "time.is".

## Architecture

- **All timezone math is client-side `Intl`** (`lib/time.ts`): wall-clock decomposition, UTC offsets (parsed from `shortOffset`), ISO week, zone listing via `Intl.supportedValuesOf("timeZone")`. There are no external time APIs and no timezone data files. The server's only time role is `app/api/time/route.ts`, which returns `Date.now()` for the sync check.
- **Clock sync** (`lib/clock-sync.ts`, a module-level external store): NTP-style — samples `/api/time` several times, keeps the lowest-RTT sample, offset is round-trip-compensated (accuracy = RTT/2 of the best sample). **Displayed time is corrected by this offset**: `hooks/use-now.ts`, `components/clock.tsx` and `components/kinetic-clock.tsx` build dates from `correctedNowMs()`, so every clock shows server-corrected time, not device time. Watchdogs re-measure when the wall-vs-monotonic clock baseline jumps (manual clock change, sleep/wake) or the tab becomes visible after the result goes stale. The correction runs silently — there is no visible sync-status component.
- **Routing:** `app/page.tsx` is local time; `app/[...zone]/page.tsx` is a catch-all that resolves full IANA paths (`/europe/zurich`) or bare city names (`/tokyo`) via `resolveZone()`, 404ing unknowns. Static pages (`/about`, `/faq`, `/privacy`, `/terms`) take precedence over the catch-all. Adding a new static route only requires it not to collide with an IANA city name.
- **Hydration strategy for live time:** `hooks/use-now.ts` returns `null` until mounted (components render placeholder digits), ticking on the second boundary. The 12/24-hour preference (`hooks/use-time-format.ts`) is a module-level `useSyncExternalStore` over localStorage — shared across all components with no context provider.
- **Persisted user state** (favorite cities, recently viewed zones) goes through `lib/local-store.ts` — a `createLocalStore` factory whose snapshots are cached by raw string so array values keep stable references (required by `useSyncExternalStore`). See `hooks/use-favorites.ts` / `hooks/use-recents.ts`.
- **Zone aliasing:** `resolveZone()` falls back to `Intl.DateTimeFormat(...).resolvedOptions().timeZone` for zones missing from `supportedValuesOf` (e.g. `Asia/Kolkata` on ICU builds that list `Asia/Calcutta`). Canonical names — and therefore displayed city names — can differ between server and browser ICU.
- **Global keyboard shortcuts**, each guarding against typing targets: `D` theme toggle (`components/theme-provider.tsx`), `F` fullscreen clock (`components/clock.tsx`), `T` 12/24-hour (`components/site-header.tsx`), `/` or `Ctrl/⌘+K` focus search (`components/timezone-search.tsx`).
- Content pages (about/faq/privacy/terms) share `components/page-shell.tsx` for layout; the featured city grid is curated in `lib/cities.ts`.
- **Site identity** lives in `lib/site.ts` (`SITE_URL` defaults to the production origin `https://time.punds.ch`, overridable via `NEXT_PUBLIC_SITE_URL`) and feeds `metadataBase`, `app/sitemap.ts`, `app/robots.ts`, and `app/manifest.ts`. Featured cities are prerendered via `generateStaticParams` in the catch-all route; `app/opengraph-image.tsx` renders the social card with `next/og`.
