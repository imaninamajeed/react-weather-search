# Isobar

Weather dashboard on Next.js 16 (App Router, Cache Components), React 19, Tailwind v4 and
shadcn/ui. No database, no accounts, no secrets. Package manager is **pnpm**.

## Read before changing code

- [`AGENTS.md`](AGENTS.md): this Next.js version differs from older ones. Check the guide in
  `node_modules/next/dist/docs/` before writing Next.js code.
- [`DESIGN.md`](DESIGN.md): rules for any UI work. Use the components in `src/components/ui/`, add
  missing ones with the shadcn CLI, and style through tokens in `src/app/globals.css`.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): rendering model, data layer, caching, and the
  "Kept" table of local edits to `ui/` components.
- [`docs/INFORMATION_ARCHITECTURE.md`](docs/INFORMATION_ARCHITECTURE.md): routes and navigation.

## Commands

| Task            | Command                             |
| --------------- | ----------------------------------- |
| Dev server      | `pnpm dev`                          |
| Format          | `pnpm format`                       |
| Lint            | `pnpm lint`                         |
| Typecheck       | `pnpm typecheck`                    |
| Unit tests      | `pnpm test`                         |
| End-to-end      | `pnpm build && pnpm test:e2e`       |
| Add a component | `pnpm dlx shadcn@latest add <name>` |

CI runs `pnpm exec prettier --check .`, `pnpm lint`, `pnpm typecheck` and `pnpm test`, then builds
and runs the end-to-end suite. Run the first four before calling a change done; run end-to-end when
the change touches routes, layout, colours or anything a spec covers.

## Things that are easy to get wrong

- End-to-end tests run against a **production build** on port 3210 with every upstream API mocked
  by `e2e/mock-upstream.mjs`. Rebuild after changing source, or the tests exercise stale code.
- Upstream calls go through `src/lib/open-meteo/client.ts` from the server only. Fetchers import
  `server-only`; do not call a weather API from a client component.
- Domain data stays **metric**. Convert units only at render, with `src/lib/units.ts`.
- Anything that reads the cookie, `params` or `searchParams` must sit inside a `<Suspense>`
  boundary, or the static shell stops prerendering.
- Every colour must work in light and dark themes. `e2e/zz-contrast.spec.ts` and
  `e2e/a11y.spec.ts` enforce contrast and accessibility.
- `src/components/ui/` files are owned code. If you edit one, record it in the "Kept" table in
  `docs/ARCHITECTURE.md`, because `shadcn add --overwrite` replaces them.
