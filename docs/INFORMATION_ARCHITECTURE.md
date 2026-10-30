# Information architecture

How the app is divided into pages, and why. The rule applied to every module: **give it its own page
only if people come to it for its own sake, it has enough content to fill a page, and it can be linked
to. Otherwise it belongs inside the page where the decision it informs is made.**

## Site map

| Route                  | Purpose                                                                                                  | Main nav                    | Breadcrumb (below lg)                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------- |
| `/dashboard`           | Dashboard: home forecast, alerts summary, saved places, week ahead                                       | Dashboard                   | Dashboard                               |
| `/places`              | Manage places: add, reorder, remove, set home; week-ahead comparison                                     | Places                      | Dashboard › Places                      |
| `/alerts`              | Every alert across every place, filterable to official warnings                                          | Alerts                      | Dashboard › Alerts                      |
| `/map`                 | Radar and a map of your places                                                                           | Map                         | Dashboard › Radar map                   |
| `/place/[key]`         | Forecast: now, next 48 hours, a three-day teaser, conditions                                             | Sidebar places              | Dashboard › Places › _Place_ › Forecast |
| `/place/[key]/outlook` | 14-day outlook with per-day model confidence                                                             | Place toggles               | … › Outlook                             |
| `/place/[key]/history` | Climate: the last year against 1991–2020 normals                                                         | Place toggles               | … › Climate                             |
| `/about`               | Sources, how alerts, confidence and climate are computed, privacy                                        | Sidebar footer              | Dashboard › About                       |
| `/`                    | Welcome, the landing page: what Isobar does and where to start. Standalone: no sidebar, header or footer | Brand link, empty dashboard | —                                       |
| `/offline`             | Fallback when a page isn't cached                                                                        | —                           | —                                       |

Search and settings are not pages: they are available from the sidebar (or the phone header) everywhere.

## Verdicts

| Module                        | Verdict                     | Why                                                                                                                                                                                                         |
| ----------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alerts                        | **Own page** + summary      | Safety information that people want in one place across every location. The dashboard and place page keep a short summary (top three, then "View all N alerts").                                            |
| Place management              | **Own page**                | Reordering and removing places is a task, not a glance. It used to be a `?manage` mode on the dashboard, which made the dashboard two screens in one; it now redirects to `/places`.                        |
| 14-day outlook and confidence | **Own page** (a place tab)  | It was the heaviest section of the forecast page and answers a different question ("can I plan around day 9?") than "what is it doing today?". The forecast page keeps a three-day teaser that links to it. |
| Climate history               | **Own page** (a place tab)  | Already separate; a different question (is this normal?) and a different time horizon.                                                                                                                      |
| Radar map                     | **Own page**                | Full-bleed interaction that does not fit in a column.                                                                                                                                                       |
| Data sources and methods      | **Own page**                | Trust content: thresholds, sources and limitations. Linked from the places that rely on it (alerts, confidence) so people can check how a number was made.                                                  |
| Week-ahead comparison         | **Inside** `/places`        | Only meaningful when comparing the places you follow, which is what that page is about.                                                                                                                     |
| Air quality, conditions grid  | **Inside** the forecast     | Context for today's forecast; no one visits it alone.                                                                                                                                                       |
| Search                        | **Global** (sidebar, ⌘K)    | Needed from every page.                                                                                                                                                                                     |
| Units and theme               | **Global** (header toolbar) | Preferences, not content.                                                                                                                                                                                   |

## Navigation model

- **The sidebar** (shadcn's `Sidebar`) is the app's navigation from md up. Top to bottom: the brand,
  the four destinations (Dashboard, Alerts, Places, Map), **your places** (home first, each with its
  current weather and an alert marker, and a "+" that opens search). It is the app's one place switcher: choosing a place keeps the view you are on
  (Forecast, Outlook or Climate). It collapses to an icon rail (⌘B, the header's toggle, or the
  rail's edge) and remembers that. On a phone it is a drawer behind the header's menu button, next to
  a bottom tab bar with the four destinations.
- **The header** is the same at every size: the sidebar toggle, the breadcrumb (where you are; its
  place crumb is a dropdown to switch place), and the app toolbar: search, units (a toggle group),
  theme (a menu of light, dark and system) and install. On a phone the brand joins it and the
  breadcrumb wraps to a row of its own. Trails longer than three levels collapse their earlier
  levels into an ellipsis menu on a phone.
- **Breadcrumbs** are rendered by a parallel route slot (`app/@crumbs`) so each page defines its own
  trail without the layout knowing about it.
- **Place tabs** (Forecast · Outlook · Climate) switch views of one place. They are links, not client
  state, so each view has its own URL. Radar opened from a place links back to that place's forecast.
- **Search is a command palette** (⌘K, "/" or any search button), mounted once in the layout. Before you
  type it offers the places you follow, recent searches, "use my location", the app's pages and the
  theme; once you type it searches cities (and still matches page names).
- **Every empty or failed state** (not found, offline, error) uses one layout and always offers a next
  step: search, retry, or back to the dashboard.
- **Pages scroll.** Nothing locks the page to the viewport. From xl wide and 740px tall some pages use a
  denser multi-column layout (the `fit` variant in `globals.css`), but they still scroll. The dashboard is
  a scrolling overview that reads top to bottom: home, alerts, the day in detail, then your places.

## Journey audit

Problems found when walking the app, and what changed.

| Problem                                                                                               | Why it hurt                                                                           | Change                                                                               |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Three navigation rows above every place page (top bar, breadcrumb, place tabs: about 135px)           | Same information three times; it cost the height a one-screen page needs              | Desktop navigation is one sidebar; the breadcrumb row is for phones and tablets only |
| Three ways to switch place (chips, breadcrumb dropdown, Places page)                                  | Chips showed only names, and their red looked like the active units and theme buttons | One list in the sidebar, with live weather and alert markers                         |
| Units and theme beside the main navigation                                                            | Rarely used, but in the most prominent spot                                           | A compact toolbar in the header, beside search                                       |
| Search could not reach what you already follow or any page                                            | Palette was only for adding cities                                                    | Palette lists your places and the app's pages                                        |
| Dead ends: not found and offline offered only "Back to dashboard"; radar had no way back to the place | The user had to guess the next step                                                   | Shared state screen with search and retry; "‹ Place forecast" on the map             |
| Dashboard hero's name was not a link                                                                  | The primary path ("open this forecast") was a small button                            | The place name links to its forecast too                                             |

## Principles that shaped this

1. **One question per page.** If the heading can't be a single question, split it.
2. **Summaries link to the full thing** instead of duplicating it (dashboard alerts → `/alerts`,
   forecast teaser → outlook).
3. **State lives in the URL** where it changes what you see (`?show=official`, the place key, the tab),
   so views are linkable and the back button works.
4. **Say how a number was made** where it appears, and link to `/about` for the detail.
