# gleamit.app

Public website for [Gleamit](https://github.com/Uaitt/gleamit), the on-device oral hygiene tracker. Static Astro site, plain CSS, no client JavaScript, no analytics, no cookies. Hosted on GitHub Pages at `https://gleamit.app`.

## Commands

| Command               | What it does                                                        |
| --------------------- | ------------------------------------------------------------------- |
| `npm run dev`         | Astro dev server                                                    |
| `npm run build`       | Build the static site into `dist/`                                  |
| `npm run preview`     | Serve `dist/` on `127.0.0.1:4321` the way GitHub Pages would        |
| `npm run check`       | Astro type check                                                    |
| `npm run check:links` | Fail on any broken internal page, asset or `#anchor` in `dist/`     |
| `npm run test`        | Link-checker tests, then the Playwright smoke suite against `dist/` |

Playwright needs a browser once: `npx playwright install chromium`.

## Design tokens

`src/styles/global.css` carries the app's `AppTheme` palette as CSS custom properties, light by default and dark under `prefers-color-scheme: dark`. No toggle, no web font: system font stack only.

## Screenshots and badges

`src/assets/shots/` holds the 10 raw unframed PNGs copied from the app repository's `mobile/store_listing/app_store/screenshots/raw/`. `src/components/Phone.astro` wraps one in a CSS device frame and emits AVIF and WebP sources with declared dimensions through Astro's `<Picture>`; every use must pass meaningful `alt` text. Refresh them by copying the files again, never by editing them here.

`public/badges/` carries the official App Store badge (black for light, white for dark) and the Google Play badge, unmodified. `public/og.png` is the Play feature graphic, used as the Open Graph image.

## CI gate

Every push to `main` (and every pull request) runs: type check, build, link check, link-checker tests, Playwright smoke suite. Only pushes to `main` deploy, via `actions/deploy-pages`.

The smoke suite is driven by `tests/routes.ts` (`tests/smoke.spec.ts`, `tests/output.spec.ts`), with `tests/landing.spec.ts` covering the landing page's store badges, nav, trust strip, footer, image formats, Open Graph tags, copy guardrails, tap targets and focus order. Add a route there and it is opened in light and dark at 375px and 1280px, asserting a 200, a visible `h1`, the palette background, no horizontal overflow, no external scripts, no cookies, plus a canonical link and a sitemap entry. Tests only ever look at the served build output, never at Astro internals.
