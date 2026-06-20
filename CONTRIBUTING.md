# Contributing

Thanks for taking an interest in **Time**. This guide covers local setup, the conventions the codebase follows, and how to get a change merged.

> **Note on licensing.** This project is published under "all rights reserved" (see [README](README.md#license)). Contributions are welcome via pull request, but by opening a PR you agree your changes can be incorporated into the project under the same terms.

## Local setup

Requires [bun](https://bun.sh).

```bash
bun install
bun run dev        # http://localhost:1000
```

## Before you open a pull request

Run the same gate that CI runs — all four must pass:

```bash
bun run typecheck
bun run lint
bun run format:check    # or `bun run format` to auto-fix
bun run build
```

There is no automated test suite. Verify your change by actually running the app and exercising the affected behavior.

## Code style

Formatting is enforced by Prettier (no semicolons, double quotes, 2-space indent, `lf` line endings) and ESLint via `eslint-config-next`. A few project-specific conventions are worth knowing:

- **This is Next.js 16, which differs from older versions.** `params` is a `Promise` and must be awaited in pages and `generateMetadata`. Turbopack is the default for dev and build. When in doubt, read the bundled docs in `node_modules/next/dist/docs/`.
- **No `setState` directly inside effects.** The React hooks lint rules forbid it. For hydration/mounted flags and external state, use `useSyncExternalStore` — see `hooks/use-time-format.ts` and the `ThemeToggle` in `components/site-header.tsx` for the established pattern.
- **Tailwind v4 with CSS-based config.** There is no `tailwind.config.*`; design tokens live in `app/globals.css` under `@theme inline`, declared in both `:root` and `.dark`.
- **Icons** render as `<HugeiconsIcon icon={SomeIcon} />`, imported from `@hugeicons/core-free-icons`. Confirm an icon name exists in that package before using it.
- **Timezone math is client-side `Intl`.** There are no external time APIs and no timezone data files; the server only returns its own time for the sync check. Keep it that way.
## Commits and pull requests

- Keep commits focused and write clear, descriptive messages (the history uses short `type: summary` subjects, e.g. `fix: …`, `feat: …`, `style: …`).
- Fill in the pull-request template, including the checklist.
- Describe what you changed and how you verified it.

## Reporting bugs and requesting features

Use the issue forms under **New issue**. For anything security-sensitive, do **not** open a public issue — follow [SECURITY.md](SECURITY.md) instead.
