import { test, expect } from '@playwright/test';
import { expectClearsNav, horizontalOverflow, settleScroll, toc, toggleDark, viewports } from './matrix';
import { cardBackground, pageBackground } from './theme';

const pages = [
  { route: '/privacy/', heading: 'Privacy Policy', version: 8, effective: 'Effective 21 September 2026' },
  { route: '/terms/', heading: 'Terms and conditions', version: 7, effective: 'Effective 17 September 2026' },
];

for (const { route, heading, version, effective } of pages) {
  test.describe(route, () => {
    test('states its version and effective date in the body', async ({ page }) => {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page.locator('.masthead .meta')).toHaveText(`Version ${version} · ${effective}`);
    });

    // The banned-word guardrail does not apply here: the medical disclaimer has to say "diagnose".
    test('keeps the punctuation guardrail: no em or en dashes', async ({ page }) => {
      await page.goto(route);
      const copy = await page.locator('body').innerText();
      expect(copy).not.toContain('—');
      expect(copy).not.toContain('–');
    });

    test('gives the Gleamit support address as the only contact', async ({ page }) => {
      await page.goto(route);
      const contact = page.locator('.prose h2#contact ~ *').filter({ hasNot: page.locator('h2') });
      await expect(contact.getByRole('link', { name: 'support@gleamit.app' })).toHaveAttribute(
        'href',
        'mailto:support@gleamit.app',
      );
      expect(await page.locator('body').innerText()).not.toMatch(/@gmail\.com/);
    });

    test('cross-links to the other text page by its unversioned route', async ({ page }) => {
      await page.goto(route);
      const other = route === '/privacy/' ? '/terms/' : '/privacy/';
      await expect(page.locator(`.prose a[href="${other}"]`).first()).toBeVisible();
    });

    for (const viewport of viewports) {
      test.describe(`at ${viewport.width}px`, () => {
        test.beforeEach(async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(route);
        });

        test('lists every section of the text, and only one ToC is on show', async ({ page }) => {
          const shown = toc(page, viewport.width);
          const hidden = page.locator(viewport.width > 900 ? '.toc-narrow' : '.toc-wide');
          await expect(shown).toBeVisible();
          await expect(hidden).toBeHidden();

          const sections = await page.locator('.prose h2').allInnerTexts();
          expect(sections.length).toBeGreaterThan(5);
          await expect(shown.locator('.toc-list a')).toHaveText(sections);
        });

        test('every ToC entry jumps to its section, clear of the sticky nav', async ({ page }) => {
          // Reduced motion turns the site's smooth scrolling off, so each jump lands in one step.
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.reload();

          const shown = toc(page, viewport.width);
          if (viewport.width <= 900) await shown.locator('summary').click();

          const hrefs = await shown.locator('.toc-list a').evaluateAll((els) => els.map((el) => el.getAttribute('href')!));
          for (const href of hrefs) {
            await page.goto(`${route}${href}`);
            await settleScroll(page);
            await expectClearsNav(page, page.locator(`.prose ${href}`), href);
          }
        });

        test('keeps the ToC clear of the text', async ({ page }) => {
          const shown = toc(page, viewport.width);
          const tocBox = (await shown.boundingBox())!;
          const proseBox = (await page.locator('.prose').boundingBox())!;

          const clearsSideways = tocBox.x + tocBox.width <= proseBox.x + 1;
          const clearsAbove = tocBox.y + tocBox.height <= proseBox.y + 1;
          expect(clearsSideways || clearsAbove, 'the ToC overlaps the text').toBe(true);
        });

        test('follows the toggle into dark and back', async ({ page }) => {
          await expect(page.locator('body')).toHaveCSS('background-color', pageBackground.light);

          await toggleDark(page);
          await expect(page.locator('body')).toHaveCSS('background-color', pageBackground.dark);
          await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
          expect(await horizontalOverflow(page), 'horizontal overflow in px').toBe(0);

          await page.getByRole('button', { name: 'Switch to light theme' }).click();
          await expect(page.locator('body')).toHaveCSS('background-color', pageBackground.light);
        });
      });
    }
  });
}

test.describe('the collapsible ToC on mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/privacy/');
  });

  test('starts closed so the text is the first thing read', async ({ page }) => {
    await expect(page.locator('.toc-narrow')).not.toHaveAttribute('open', /.*/);
    await expect(page.locator('.toc-narrow .toc-list a').first()).toBeHidden();
    await expect(page.locator('.prose h2').first()).toBeInViewport();
  });

  test('opens and closes from the keyboard', async ({ page }) => {
    const summary = page.locator('.toc-narrow summary');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.toc-narrow .toc-list a').first()).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page.locator('.toc-narrow .toc-list a').first()).toBeHidden();
  });

  test('its summary is a 48px target', async ({ page }) => {
    const box = await page.locator('.toc-narrow summary').boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
  });
});

test.describe('the privacy policy at v7', () => {
  test.beforeEach(({ page }) => page.goto('/privacy/'));

  test('has a Website section covering logs, cookies, analytics and the theme preference', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2, name: 'Website' })).toBeVisible();
    const website = page.locator('.prose h2#website ~ *').filter({ hasNot: page.locator('h2') });
    const text = (await website.allInnerTexts()).join('\n');

    expect(text).toContain('GitHub Pages');
    expect(text).toMatch(/no cookies/i);
    expect(text).toMatch(/no analytics/i);
    expect(text).toMatch(/local storage/i);
    expect(text).toMatch(/never leaves your device/i);
  });

  test('still says the backup files are not encrypted by Gleamit', async ({ page }) => {
    await expect(page.locator('.prose')).toContainText('The files are not encrypted by Gleamit.');
  });
});

test.describe('the terms', () => {
  test.beforeEach(({ page }) => page.goto('/terms/'));

  test('keeps the medical disclaimer and the not-a-subscription statement', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2, name: 'Medical disclaimer' })).toBeVisible();
    await expect(page.locator('.prose')).toContainText('Gleamit is not a medical device and does not give dental advice.');
    await expect(page.locator('.prose')).toContainText('It is not a recurring subscription.');
  });
});

test('the text pages sit on the page background, not on a card', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.locator('body')).toHaveCSS('background-color', pageBackground.light);
  await expect(page.locator('.prose')).not.toHaveCSS('background-color', cardBackground.light);
});

test('no version number appears in any URL the site emits', async ({ page, request }) => {
  const versioned = /\/v\d+(\/|$)/;

  for (const route of ['/', '/privacy/', '/terms/', '/support/']) {
    await page.goto(route);
    const urls = await page.evaluate(() =>
      [...document.querySelectorAll('[href], [src]')].map((el) => el.getAttribute('href') ?? el.getAttribute('src')!),
    );
    for (const url of urls.filter((url) => !/^[a-z]+:/i.test(url))) {
      expect(url, `${route} emits a versioned URL`).not.toMatch(versioned);
    }
  }

  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).not.toMatch(versioned);
});
