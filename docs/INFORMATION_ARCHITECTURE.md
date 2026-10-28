# Information architecture

How the app is divided into pages, and why. The rule applied to every module: **give it its own page
only if people come to it for its own sake, it has enough content to fill a page, and it can be linked
to. Otherwise it belongs inside the page where the decision it informs is made.**

## Site map

| Route                  | Purpose                                                              | Sidebar              | Breadcrumb                              |
| ---------------------- | -------------------------------------------------------------------- | -------------------- | --------------------------------------- |
| `/`                    | Dashboard: home forecast, alerts summary, saved places, week ahead   | Dashboard            | Dashboard                               |
| `/places`              | Manage places: add, reorder, remove, set home; week-ahead comparison | Places               | Dashboard › Places                      |
| `/alerts`              | Every alert across every place, filterable to official warnings      | Alerts               | Dashboard › Alerts                      |
| `/map`                 | Radar and a map of your places                                       | Radar map            | Dashboard › Radar map                   |
| `/place/[key]`         | Forecast: now, next 48 hours, a three-day teaser, conditions         | Your places          | Dashboard › Places › _Place_ › Forecast |
| `/place/[key]/outlook` | 14-day outlook with per-day model confidence                         | Your places          | … › Outlook                             |
| `/place/[key]/history` | Climate: the last year against 1991–2020 normals                     | Your places          | … › Climate                             |
| `/about`               | Sources, how alerts, confidence and climate are computed, privacy    | About & data sources | Dashboard › About                       |
| `/offline`             | Fallback when a page isn't cached                                    | —                    | —                                       |

Search and settings are not pages: they are available from the header everywhere.

## Verdicts

| Module                        | Verdict                    | Why                                                                                                                                                                                                         |
| ----------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alerts                        | **Own page** + summary     | Safety information that people want in one place across every location. The dashboard and place page keep a short summary (top three, then "View all N alerts").                                            |
| Place management              | **Own page**               | Reordering and removing places is a task, not a glance. It used to be a `?manage` mode on the dashboard, which made the dashboard two screens in one; it now redirects to `/places`.                        |
| 14-day outlook and confidence | **Own page** (a place tab) | It was the heaviest section of the forecast page and answers a different question ("can I plan around day 9?") than "what is it doing today?". The forecast page keeps a three-day teaser that links to it. |
| Climate history               | **Own page** (a place tab) | Already separate; a different question (is this normal?) and a different time horizon.                                                                                                                      |
| Radar map                     | **Own page**               | Full-bleed interaction that does not fit in a column.                                                                                                                                                       |
| Data sources and methods      | **Own page**               | Trust content: thresholds, sources and limitations. Linked from the places that rely on it (alerts, confidence) so people can check how a number was made.                                                  |
| Week-ahead comparison         | **Inside** `/places`       | Only meaningful when comparing the places you follow, which is what that page is about.                                                                                                                     |
| Air quality, conditions grid  | **Inside** the forecast    | Context for today's forecast; no one visits it alone.                                                                                                                                                       |
| Search                        | **Global** (header, ⌘K)    | Needed from every page.                                                                                                                                                                                     |
| Units and theme               | **Global** (settings menu) | Preferences, not content.                                                                                                                                                                                   |

## Navigation model

- **Sidebar** is for destinations: Dashboard, Alerts, Places, Radar map, then the places you follow.
  About sits in its footer. It collapses to icons on desktop and is a drawer on mobile.
- **Breadcrumbs** live in the header beside the sidebar toggle, rendered by a parallel route slot
  (`app/@crumbs`) so each page defines its own trail without the layout knowing about it. Inside a
  place, the place's crumb is a dropdown to switch to another saved place while staying on the same
  view (Forecast, Outlook or Climate).
- **Place tabs** (Forecast · Outlook · Climate) switch views of one place. They are links, not client
  state, so each view has its own URL.
- On mobile, breadcrumb trails longer than three levels collapse their earlier levels into an
  ellipsis menu.

## Principles that shaped this

1. **One question per page.** If the heading can't be a single question, split it.
2. **Summaries link to the full thing** instead of duplicating it (dashboard alerts → `/alerts`,
   forecast teaser → outlook).
3. **State lives in the URL** where it changes what you see (`?show=official`, the place key, the tab),
   so views are linkable and the back button works.
4. **Say how a number was made** where it appears, and link to `/about` for the detail.
