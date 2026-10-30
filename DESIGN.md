# Design

How to build UI in Isobar: use the shadcn/ui components in `src/components/ui/`, themed through
tokens, and only add what is missing. For why the design system is shaped this way see
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#design-system).

## Setup

|            |                                                                                         |
| ---------- | --------------------------------------------------------------------------------------- |
| Style      | `radix-luma`, base colour `mist`, CSS variables, RSC on (`components.json`)             |
| Primitives | `radix-ui` (single package), `class-variance-authority`, `cmdk`, `sonner`, `recharts`   |
| Icons      | Tabler (`@tabler/icons-react`); Lucide only for weather-condition glyphs                |
| Fonts      | Outfit (`font-sans`, body) and Oxanium (`font-heading`), loaded in `src/app/layout.tsx` |
| Tailwind   | v4, tokens in `src/app/globals.css` (no `tailwind.config`)                              |
| Dark mode  | `.dark` class via `next-themes`; every colour must work in both themes                  |

Components in `src/components/ui/` are owned code, not a dependency. Edit them when the app needs
it, but keep the change small and record it in the "Kept" table in `docs/ARCHITECTURE.md`, because
`shadcn apply` and `shadcn add --overwrite` replace them.

Installed: accordion, alert, badge, breadcrumb, button, card, chart, command, dialog,
dropdown-menu, input, input-group, popover, separator, sheet, sidebar, skeleton, slider, sonner,
table, tabs, textarea, toggle, toggle-group, tooltip.

## Rules

1. **Look in `ui/` first.** If a shadcn component does the job, use it. Don't hand-roll a button,
   card, badge, dialog, menu, tooltip, toggle, table or input from `div`s and Tailwind.
2. **Missing component? Add it with the CLI**, don't write it by hand:
   ```bash
   pnpm dlx shadcn@latest add <name>      # e.g. select, switch, checkbox, scroll-area
   pnpm dlx shadcn@latest add <name> --dry-run   # preview what it would write
   ```
   Then review the generated file against the conventions below (icon library, `cn` import) and
   run `pnpm typecheck && pnpm lint`.
3. **Compose, don't fork.** Wrap a primitive in a feature component (`SectionCard`, `HazardBadge`)
   and pass `className` for layout. Don't copy a `ui/` file to make a variant. Add a `cva` variant
   to the original only if several places need it.
4. **Use variants and sizes before classes.** `Button` has `default | outline | secondary | ghost |
destructive | link` and `default | xs | sm | lg | icon | icon-xs | icon-sm | icon-lg`. `Card`
   has `size="sm"`. Reach for `className` only for layout (width, margin, grid placement) and the
   rare one-off colour.
5. **Links that look like buttons**: `<Button asChild><Link href="…">…</Link></Button>`. Never wrap
   a `Button` in a `Link` or the reverse. The same `asChild` pattern applies to `DropdownMenuItem`
   and `SidebarMenuButton`.
6. **Icon-only controls need a name**: `aria-label` on the button, plus a `Tooltip` where the
   meaning isn't obvious. Icons next to text are decorative: `aria-hidden="true"`.
7. **Server by default.** Eight `ui/` primitives (alert, badge, breadcrumb, button, card, input,
   skeleton, textarea) work in Server Components; the other 17 carry `"use client"`. Keep client boundaries small and in feature components, not
   around whole pages. Providers (`TooltipProvider`, `SidebarProvider`, `Toaster`) are already in
   `layout.tsx`; don't add them again.

## Copy

**Labels are Title Case; sentences are not.** Headings, section and card titles, buttons, links, tabs,
menu and palette items, badges, chart and table headings, tile labels, and the short values the UI shows
(weather conditions, UV and air-quality levels, alert titles) are Title Case: "Manage and Compare",
"Add a Place", "Next 7 Days", "Light Drizzle". Short words stay lowercase unless they open or close the
label: a, an, the, and, or, but, for, of, to, in, on, at, by, as, vs, with, from. Descriptions,
paragraphs, status text ("The sun has set"), toasts, placeholders and anything that reads inside a
sentence ("Checked: Forecast signals, MET Malaysia.") stay in sentence case. Accessible names follow
the visible label, so an icon button's `aria-label` is Title Case too.

## Tokens

Colour, radius and font come from CSS variables in `globals.css`, exposed to Tailwind through
`@theme inline`. Use the semantic utility, never a raw colour.

| Need                       | Use                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| Page / card / popover      | `bg-background`, `bg-card`, `bg-popover` with the matching `text-*-foreground`              |
| Secondary text             | `text-muted-foreground`; fills `bg-muted`, hover `bg-accent`                                |
| Brand action               | `bg-primary text-primary-foreground`                                                        |
| Borders, inputs, focus     | `border-border`, `border-input`, `ring-ring`                                                |
| Destructive                | `text-destructive` / `bg-destructive`                                                       |
| Weather advisory / warning | `bg-advisory text-advisory-foreground`, `bg-warning text-warning-foreground` (app-specific) |
| Chart series               | `var(--chart-1…5)`, assigned per entity in a fixed order (see the note in `globals.css`)    |
| Sidebar                    | `bg-sidebar`, `text-sidebar-foreground`, `sidebar-accent`, `sidebar-border`                 |
| Brand art / accents        | `--brand-*` only for hero art and the mark, never for body UI                               |

- **Don't** use hex, `rgb()`, `oklch()` literals or Tailwind palette colours (`text-red-500`) in
  components. If a new colour is needed, define a token in both `:root` and `.dark`, map it in
  `@theme inline`, and check contrast (see Accessibility).
- **Radius** follows `--radius` (`rounded-lg … rounded-4xl`). `Button`, `Badge` and `Card` are
  pill/large-radius by design; don't override with `rounded-md`.
- **Type**: body is `font-sans`; headings, big numbers and the `label-caps` caption use
  `font-heading`. Use `.tnum` for temperatures, times and table columns so digits align.
- **Spacing in cards** goes through `--card-spacing`, set by `Card size`. Pages marked `data-fit`
  shrink it at the `fit:` breakpoint. Don't hard-code padding that fights it.

## Choosing a component

| UI                               | Component                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| Page section with title          | `SectionCard` (`shared/`), built on `Card`                                             |
| Stat, tag, severity chip         | `Badge` (set colour with the advisory/warning tokens)                                  |
| Inline message                   | `Alert`                                                                                |
| Transient feedback, with Undo    | `toast` from `sonner` (already styled by `ui/sonner.tsx`)                              |
| Empty / error / offline page     | `StateScreen` (`shared/`)                                                              |
| Loading                          | `Skeleton` inside a `<Suspense>` fallback, sized like the content                      |
| Search                           | `Command` in `CommandDialog` (`search/`)                                               |
| Overlay needing a decision       | `Dialog`; a panel sliding in from an edge (mobile sidebar) `Sheet`                     |
| Menu of actions or links         | `DropdownMenu`                                                                         |
| Small anchored content           | `Popover`; plain-text hints `Tooltip`                                                  |
| Pick one of a few (units, theme) | `ToggleGroup` (`type="single"`); on/off `Toggle`                                       |
| Text entry                       | `Input`, `Textarea`, `InputGroup` for icon/addon fields                                |
| Range / scrubber                 | `Slider` (pass `thumbLabel` and `valueText`)                                           |
| Tabular data                     | `Table`                                                                                |
| Charts                           | `ChartContainer` from `ui/chart` wrapping Recharts; always give the chart a table twin |
| App navigation                   | `Sidebar*` primitives (`layout/app-sidebar.tsx`); breadcrumb in the header             |

## Conventions for files in `ui/`

- Primitives use `data-slot`, `data-variant` and `data-size` attributes. Target those in
  `className` or CSS instead of adding new props.
- Generated files import `cn` from `"cn"`; app code imports it from `"@/lib/utils"` (a re-export).
  Keep each as is, and use `@/lib/utils` in anything you write.
- Icons inside `ui/` are Tabler. If `shadcn add` emits `lucide-react` imports, swap them for the
  Tabler equivalent (`components.json` has `iconLibrary: "tabler"`).
- Double quotes without semicolons in generated files are the CLI's output; Prettier normalises
  them on `pnpm format`. Don't reformat a `ui/` file by hand to "match".

## Accessibility

The Playwright suite runs axe-core on every page in light and dark, so these fail the build:

- Text contrast of 4.5:1 or more. `--muted-foreground` is already darkened for tinted surfaces;
  don't lower its opacity further.
- Every interactive element has an accessible name; every form control has a label.
- One `h1` per page. Section headings are `h2`, set with `role="heading" aria-level={2}` inside
  `CardTitle` (which renders a `div`).
- Focus is visible (`:focus-visible` outline in `globals.css`; shadcn components add a ring). Don't
  use `outline-none` without a replacement.
- Motion respects `prefers-reduced-motion` (handled globally).
- Information is never colour-only: severity also gets an icon and text.

## Checklist for a UI change

- [ ] Used an existing `ui/` component, or added one with `shadcn add`
- [ ] Only semantic tokens, correct in both themes
- [ ] Tabler icons, decorative ones `aria-hidden`
- [ ] Icon-only buttons labelled
- [ ] Checked at phone width (bottom tab bar below `md`, sidebar from `lg`)
- [ ] `pnpm typecheck && pnpm lint && pnpm test`; `pnpm test:e2e` for anything visible
