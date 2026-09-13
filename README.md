# gleamit.app

Public website for [Gleamit](https://github.com/Uaitt/gleamit), the on-device oral hygiene tracker. Static Astro site, plain CSS, no analytics, no cookies. The only client JavaScript is inline: the theme toggle and the scroll-reveal enhancement on the landing page. No external scripts are ever loaded. Hosted on GitHub Pages at `https://gleamit.app`.

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

`src/styles/global.css` carries the app's `AppTheme` palette as CSS custom properties. The site is the app's palette with two deliberate shifts for the web: the light page background is `#D8E1DD` rather than the app's `#F3F6F8`, and light teal text is `#126E61` rather than `#157C6D`. No web font: system font stack only.

Every visitor opens the site light, whatever `prefers-color-scheme` says. The 48px toggle at the right end of the nav flips `data-theme` on `<html>`, where the dark palette lives, and stores the choice in `localStorage.theme`; an inline script in `<head>` reapplies it before first paint. A second inline script at the end of `<body>` reveals the toggle, which ships `hidden`, and keeps the label, the `theme-color` meta and the App Store badge artwork in step with the theme; a visitor without JavaScript therefore gets a light site and no dead control. No cookies.

## Screenshots and badges

`src/assets/shots/` holds the 10 raw unframed PNGs copied from the app repository's `mobile/store_listing/app_store/screenshots/raw/`. `src/components/Phone.astro` wraps one in a CSS device frame and emits AVIF and WebP sources with declared dimensions through Astro's `<Picture>`; every use must pass meaningful `alt` text. Refresh them by copying the files again, never by editing them here.

`public/badges/` carries the official App Store badge (black for light, white for dark) and the Google Play badge, unmodified. `public/og.png` is the Play feature graphic, used as the Open Graph image.

## CI gate

Every push to `main` (and every pull request) runs: type check, build, link check, link-checker tests, Playwright smoke suite. Only pushes to `main` deploy, via `actions/deploy-pages`.

The smoke suite is driven by `tests/routes.ts` (`tests/smoke.spec.ts`, `tests/output.spec.ts`), with `tests/landing.spec.ts` covering the landing page's store badges, nav, trust strip, footer, image formats, Open Graph tags, copy guardrails, tap targets and focus order. Add a route there and it is opened at 375px and 1280px with a dark system emulated, asserting a 200, a visible `h1`, the light background and teal text, no horizontal overflow, no external scripts, no cookies, plus a canonical link and a sitemap entry. `tests/landing.spec.ts` also walks the theme journey: light on arrival, dark after the toggle, dark across a reload and a route change, light again after toggling back.

`tests/features.spec.ts` covers the Bento feature grid and the showcase rows, including the card radius, alt text, the `Features` anchor clearing the sticky nav, both sections following the toggle into dark at 375px and 1280px, and the scroll reveal in all four motion states: default, `prefers-reduced-motion`, reduced motion switched on after load, and JavaScript disabled. Tests only ever look at the served build output, never at Astro internals.
