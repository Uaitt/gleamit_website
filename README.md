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

## Legal texts

The privacy policy and the terms are **authored here and nowhere else**, as Markdown in the `legal` content collection (`src/content/legal/`, schema in `src/content.config.ts`), and published at `/privacy/` and `/terms/`. This is [ADR 0010](https://github.com/Uaitt/gleamit/blob/main/docs/adr/0010-gleamit-app-hosts-legal-texts.md) in the app repository: the app, the store listings and the support page link to these two URLs.

**No version ever appears in a URL.** Each text carries `version` and `effective` in its frontmatter, which `src/layouts/Legal.astro` prints in the page masthead; earlier versions live in this repository's git history. Changing a text means editing the Markdown and bumping both fields, never adding a path. Both are currently **v6, effective 13 September 2026**.

`src/layouts/TextPage.astro` is the shared reading layout: site nav and footer, a masthead, and the body in a 68ch column beside a table of contents. The ToC is rendered twice, as a sticky column above 900px and as a closed `details` below it, so a phone reader meets the text rather than a screenful of links. Rendering it twice rather than toggling one copy keeps the page working with JavaScript off, and adds no inline script. `src/layouts/Legal.astro` wraps it for the `legal` collection, turning the frontmatter into the masthead line and the `h2` headings the Markdown renderer reports into ToC entries; `/support` uses `TextPage` directly and passes its four sections by hand, which `tests/support.spec.ts` holds to the `h2` headings actually on the page.

The app's banned-word guardrail from the app repository's `CONTEXT.md` cannot hold on these pages: the medical disclaimer is legally required to say "diagnose", which is the only hit in either text. That carve-out is recorded here but belongs upstream in `CONTEXT.md` or ADR 0010, so the two repositories agree. The spaced-hyphen punctuation rule still applies, and is asserted.

## CI gate

Every push to `main` (and every pull request) runs: type check, build, link check, link-checker tests, Playwright smoke suite. Only pushes to `main` deploy, via `actions/deploy-pages`.

The smoke suite is driven by `tests/routes.ts` (`tests/smoke.spec.ts`, `tests/output.spec.ts`), with `tests/landing.spec.ts` covering the landing page's store badges, nav, trust strip, footer, image formats, Open Graph tags, copy guardrails, tap targets and focus order. Add a route there and it is opened at 375px and 1280px with a dark system emulated, asserting a 200, a visible `h1`, the light background and teal text, no horizontal overflow, no external scripts, no cookies, plus a canonical link and a sitemap entry. `tests/landing.spec.ts` also walks the theme journey: light on arrival, dark after the toggle, dark across a reload and a route change, light again after toggling back.

`tests/features.spec.ts` covers the Bento feature grid and the showcase rows, including the card radius, alt text, the `Features` anchor clearing the sticky nav, both sections following the toggle into dark at 375px and 1280px, and the scroll reveal in all four motion states: default, `prefers-reduced-motion`, reduced motion switched on after load, and JavaScript disabled.

`tests/pricing.spec.ts` covers the pricing card and the FAQ: the one-time euro price, the not-a-subscription line and the currency/taxes note, every row of the free-vs-Pro table against the paywall rules in the app repository's `CONTEXT.md`, the seven `details`/`summary` answers opening and closing from the keyboard, the copy guardrails with every answer expanded, both sections following the toggle into dark at 375px and 1280px, and the `Pricing` and `FAQ` anchors clearing the sticky nav.

`tests/legal.spec.ts` covers `/privacy/` and `/terms/`: the version and effective date in the masthead, the v6 Website section (GitHub Pages logs, no cookies, no analytics, the theme preference never leaving the device), the unencrypted-backup statement, the two pages cross-linking by their unversioned routes, the ToC listing every `h2` and every entry jumping to its section clear of the sticky nav, the ToC staying clear of the text, the mobile `details` starting closed and working from the keyboard at a 48px target, both pages following the toggle into dark at 375px and 1280px, and no `vN` in any URL the site emits, sitemap included.

`tests/support.spec.ts` covers `/support/`: the contact card with `support@gleamit.app`, the 3-business-day reply promise and a 48px mail button, the Android and iOS notes stating that the in-app switch leaves the cloud copy in place, the three numbered deletion routes (Google Drive, iOS Settings, Mac System Settings), the delete-everything section, the four-entry ToC matching the page's own `h2` headings and jumping clear of the sticky nav, the toggle into dark at 375px and 1280px, the copy guardrails, and the absence of the old support page's stale advice (no personal Gmail address, no claim that the device backup carries Gleamit).

Tests only ever look at the served build output, never at Astro internals.

## Support page

`/support` is the URL the App Store and Play listings point at. Its per-platform copy has to keep step with the app's own: the Android and iOS backup sections restate `cloudBackupInfoContentAndroid`, `cloudBackupInfoContentIos` and `cloudBackupAccountSignOutMessage` from the app repository's `l10n/app_en.arb`, the restore step names `proRestore` ("Restore purchase", singular), and the underlying behaviour is [ADR 0005](https://github.com/Uaitt/gleamit/blob/main/docs/adr/0005-cloud-backup-android.md) and [ADR 0006](https://github.com/Uaitt/gleamit/blob/main/docs/adr/0006-cloud-backup-ios.md).

Two distinctions those sources draw, which the page must preserve. Turning the switch off **in Gleamit**, or disconnecting the Google account **in Gleamit**, never deletes the copy already in the user's cloud, whereas disconnecting Gleamit **in Drive's own settings** does delete it. And the user's own cloud is the one place a copy outlives the app, so "everything is on your device" can never be stated flatly here.
