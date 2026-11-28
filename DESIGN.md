# Design

How to build UI in Isobar: use the shadcn/ui components in `src/components/ui/`, themed through
tokens, and only add what is missing. For why the design system is shaped this way see
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#design-system).

## Setup

|            |                                                                                         |
| ---------- | --------------------------------------------------------------------------------------- |
| Style      | `radix-luma`, base colour `mist`, CSS variables, RSC on (`components.json`)             |
| Primitives | `radix-ui` (single package), `class-variance-authority`, `cmdk`, `sonner`, `recharts`   |
| Icons      | Tabler (`@tabler/icons-react`) for UI; weather conditions are the app's own SVG set     |
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

## Content order

Every page answers its question in the first screen of a phone (390 × 844), in this order. A new
section goes where its kind belongs, not at the end.

1. **What is it doing now**: temperature, condition, the one-sentence summary and the day's four
   numbers (feels like, high / low, rain, wind). On a place page this is the hero.
2. **Anything dangerous**: alerts, directly under the hero. Never below a chart or a grid of readings.
3. **What happens next**: the next hours, then the next days.
4. **Instrument readings**: sun, wind, humidity, UV, air quality, pressure, visibility, cloud.
5. **How it was made**: sources, methods, links to `/about`.

- The weather comes before navigation. Buttons that lead elsewhere ("Full Forecast", "Radar") sit
  under the number they belong to, not above it.
- A page banner (`PageBanner`) is short on a phone: the list, map or table it introduces must start
  within the first screen.
- Say a thing once per page. If the hero shows feels-like and wind, don't repeat them in a second
  row of cards under it.
- An e2e test (`features.spec.ts`, "the forecast page reads now, alerts, what's next…") pins the
  place page's order. Change it only with the order above in mind.

## Plain language

Isobar is read by people deciding whether to take an umbrella, not by forecasters.

- **Every number gets its meaning beside it.** A reading is a value, a unit and a short verdict:
  "96 % · Oppressive · dew point 25°", "1015 hPa · Normal range", "6.5 km · Slightly Hazy". The
  verdict comes from a pure, tested function in `src/lib/weather/` (`comfort.ts`, `uv.ts`, `aqi.ts`),
  never from a threshold written inline in a component.
- **Every alert says what to do.** Forecast signals carry one sentence of advice
  (`weather.hazard.advice`); official warnings show the issuer's own instructions.
- **Label every percentage.** A bare "60%" could be humidity, cloud or rain. Chance of rain always
  has the droplet icon and a screen-reader label.
- **Be honest about certainty.** Use "often", "likely", "up to"; never promise weather. Where a
  number is weak evidence on its own (a single pressure reading, days 8–14), say so.
- **No jargon without a gloss.** Model names (ECMWF, GFS, ICON), "dew point", "AQI" and "hPa" may
  appear, but only next to words that carry the meaning for someone who doesn't know them.
- **A symbol needs a key.** Dots, bars and colour ramps get a legend on the screen sizes where their
  words are hidden (see the confidence legend in `DailyList`).
- New copy goes in `src/lib/i18n/messages/` in **both** English and Malay; a missing key fails
  `pnpm typecheck`.

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

| Need                       | Use                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| Page / card / popover      | `bg-background`, `bg-card`, `bg-popover` with the matching `text-*-foreground`                         |
| Secondary text             | `text-muted-foreground`; fills `bg-muted`, hover `bg-accent`                                           |
| Brand action               | `bg-primary text-primary-foreground`                                                                   |
| Borders, inputs, focus     | `border-border`, `border-input`, `ring-ring`                                                           |
| Destructive                | `text-destructive` / `bg-destructive`                                                                  |
| Weather advisory / warning | `bg-advisory text-advisory-foreground`, `bg-warning text-warning-foreground` (app-specific)            |
| Chart series               | `var(--chart-1…5)`, assigned per entity in a fixed order (see the note in `globals.css`)               |
| Sidebar                    | `bg-sidebar`, `text-sidebar-foreground`, `sidebar-accent`, `sidebar-border`                            |
| Weather glyph colours      | `--icon-sun`, `-moon`, `-cloud`, `-rain`, `-snow`, `-bolt`, `-fog` (+ `-shade`), e.g. `text-icon-rain` |
| Text on a sky              | `text-sky-ink`, `text-sky-ink-muted`, `text-sky-accent`; usually automatic (see below)                 |
| Brand art / accents        | `--brand-*` only for the mark, the welcome page and the "Now" dot, never for body UI                   |

- **Don't** use hex, `rgb()`, `oklch()` literals or Tailwind palette colours (`text-red-500`) in
  components. If a new colour is needed, define a token in both `:root` and `.dark`, map it in
  `@theme inline`, and check contrast (see Accessibility).
- **Radius** follows `--radius` (`rounded-lg … rounded-4xl`). `Button`, `Badge` and `Card` are
  pill/large-radius by design; don't override with `rounded-md`.
- **Type**: body is `font-sans`; headings, big numbers and the `label-caps` caption use
  `font-heading`. Use `.tnum` for temperatures, times and table columns so digits align.
- **Spacing in cards** goes through `--card-spacing`, set by `Card size`. Pages marked `data-fit`
  shrink it at the `fit:` breakpoint. Don't hard-code padding that fights it.

## Phone layout

Design at 390 px first; `md` adds the sidebar and `fit` (xl wide and 740 px tall) the dense
multi-column pages.

- **Source order is reading order.** Stack sections in the DOM in the content order above and let
  the grid rearrange them into columns on wide screens. Don't use `order-*` to move a section
  visually: keyboard and screen-reader order would no longer match.
- **Small readings sit two to a row** (`grid-cols-2`) from the narrowest phone. One full-width card
  per reading turns eight numbers into five screens of scrolling.
- **Text is never smaller than 12 px** (`text-xs`). `.label-caps` is 12 px; don't write
  `text-[11px]` or smaller. The only exceptions are letters inside an SVG (compass points, chart
  ticks).
- **Touch targets are 44 px.** `Button`, `Toggle` and `ToggleGroupItem` get an invisible 44 px hit
  area on touch screens from `globals.css` (`@media (pointer: coarse)`); add `data-touch-target` to
  a hand-made link or control to give it the same. Keep 8 px between neighbouring targets.
- **Sideways scrolling is only for strips and tables**, never the page. A strip that swipes is
  focusable (`tabIndex={0}`) and fades at the edge; a `Table` container is focusable for the same
  reason.
- Leave room for the bottom tab bar: nothing important in the last 5 rem of the viewport.

## Sky and illustration

Isobar draws the weather, not just its numbers. Three pieces, all in `src/components/shared/`:

| Piece                        | Use it for                                                                        |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `SkyPanel` (`sky-panel.tsx`) | A hero or banner painted with a sky: `sceneFor(forecast)` or `skyPreset(palette)` |
| `SkyChip` (`sky-chip.tsx`)   | A place's weather as a small square of its sky with the icon, in tiles and cards  |
| `WeatherIcon`                | The illustrated condition glyph; `animated` only for the one large hero icon      |
| `illustrations.tsx`          | Spot art for empty, offline, not-found and error states (`StateScreen art=`)      |

- **The sky comes from the forecast**, never the viewer's clock: `skyScene(current, today)` in
  `src/lib/weather/sky.ts` picks one of ten palettes (clear day, golden hour, clear night, overcast
  day/night, rain day/night, storm, snow, fog) and the layers on it. It is pure and tested, so the
  server and the browser always draw the same sky.
- **Text goes straight on a sky** in its ink. A sky's brightness doesn't follow the theme (a light
  page can show a night sky), so `[data-sky]` re-scopes `--foreground`, `--muted-foreground`,
  `--background`, `--card`, `--border` and friends to the sky's own ink and translucent surfaces.
  Buttons, badges and the hour strip inside need no overrides: don't add `dark:text-white`.
- **Sky layers stay tonal.** On a pale sky everything drawn (clouds, rain, fog, glow) stays light;
  on a deep sky it stays dark. That keeps text contrast wherever a cloud drifts behind it. A new
  palette or layer colour must keep that rule; `e2e/sky.spec.ts` measures every palette from pixels
  in both themes at three widths (axe can't judge text on a gradient).
- **Vivid art stays clear of words.** The sun, moon and bolt are the hero's `WeatherIcon`, placed by
  the layout beside the temperature, never behind text.
- **Motion is ambient and optional**: clouds drift, rain falls, stars twinkle, a storm flashes softly
  twice every nine seconds. Every animation is `motion-safe:`, so reduced motion gets a still sky.
- **Art is decoration.** Skies, chips, icons and illustrations are `aria-hidden`; the condition, the
  alert and the count are always written beside them. A banner's sky sets the mood (a storm for
  warnings), it never replaces the words.
- **Weather glyphs are drawn in-repo** (`weather-glyphs.tsx`) on a 64-unit grid: two tones per shape
  (body and shade), bold enough to read at 16 px, colours from `--icon-*`. Add a condition by
  composing the existing parts (`Sun`, `Moon`, `Cloud`, drops, flakes, bolt, fog).

## Choosing a component

| UI                               | Component                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| Page section with title          | `SectionCard` (`shared/`), built on `Card`                                             |
| Stat, tag, severity chip         | `Badge` (set colour with the advisory/warning tokens)                                  |
| Inline message                   | `Alert`                                                                                |
| Transient feedback, with Undo    | `toast` from `sonner` (already styled by `ui/sonner.tsx`)                              |
| Empty / error / offline page     | `StateScreen` (`shared/`) with an `art` from `shared/illustrations.tsx`                |
| Hero or banner                   | `SkyPanel` (`shared/`); `PageBanner` for a top-level page                              |
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
  Tabler equivalent (`components.json` has `iconLibrary: "tabler"`); the app has no Lucide.
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
- Lists of term and value use a real `<dl>`: `dt` and `dd` are direct children of the `dl` or of
  **one** wrapper `div`. An icon beside them is a sibling inside that wrapper, not a second level
  of nesting (axe: `definition-list`, `dlitem`).
- Anything that scrolls on its own (hour strip, wide table, a card body on a one-screen page) is
  reachable by keyboard.
- Text is at least 12 px and touch targets at least 44 px (see Phone layout).

## Checklist for a UI change

- [ ] Used an existing `ui/` component, or added one with `shadcn add`
- [ ] Only semantic tokens, correct in both themes
- [ ] Tabler icons (weather conditions: `WeatherIcon`), decorative ones `aria-hidden`
- [ ] Text on a sky uses the sky's ink (no `dark:` overrides inside `SkyPanel`); `e2e/sky.spec.ts` passes
- [ ] Icon-only buttons labelled
- [ ] Checked at phone width (bottom tab bar below `md`, sidebar from `lg`): the page's answer is
      on the first screen, in the content order above
- [ ] Every number has a unit and a plain-language meaning; every percentage says what it measures
- [ ] New copy added in English and Malay
- [ ] `pnpm typecheck && pnpm lint && pnpm test`; `pnpm test:e2e` for anything visible
