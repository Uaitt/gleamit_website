import { test, expect } from '@playwright/test';
import { expectCopyGuardrails, open, viewports } from './matrix';
import { pageBackground } from './theme';

const appStore = 'https://apps.apple.com/app/id6798220310';
const googlePlay = 'https://play.google.com/store/apps/details?id=com.kirami.app';

for (const viewport of viewports) {
  test.describe(`landing at ${viewport.width}px`, () => {
    test.beforeEach(({ page }) => open(page, viewport));

    test('hero shows both store badges pointing at the store listings', async ({ page }) => {
      const hero = page.locator('section.hero');
      const apple = hero.getByRole('link', { name: 'Download on the App Store' });
      const google = hero.getByRole('link', { name: 'Get it on Google Play' });
      await expect(apple).toBeVisible();
      await expect(apple).toHaveAttribute('href', appStore);
      await expect(google).toBeVisible();
      await expect(google).toHaveAttribute('href', googlePlay);
      await expect(hero.getByText('Free to use. One optional €9.99 unlock, no subscription.')).toBeVisible();
    });

    test('hero, trust strip, nav and footer are all present', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const trust = page.locator('section.trust');
      await expect(trust.getByRole('listitem')).toHaveCount(4);
      await expect(trust.getByText('Everything stays on your device')).toBeVisible();
      await expect(trust.getByText('No account, no Gleamit server')).toBeVisible();
      await expect(trust.getByText('No ads, no analytics')).toBeVisible();
      await expect(trust.getByText('Optional backup to your own iCloud or Drive')).toBeVisible();

      const nav = page.getByRole('navigation');
      for (const [name, href] of [['Features', '/#features'], ['Pricing', '/#pricing'], ['FAQ', '/#faq'], ['Support', '/support/']]) {
        await expect(nav.getByRole('link', { name, includeHidden: true })).toHaveAttribute('href', href);
      }
      await expect(nav.getByRole('link', { name: 'Support' })).toBeVisible();

      const footer = page.getByRole('contentinfo');
      await expect(footer.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute('href', '/privacy/');
      await expect(footer.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms/');
      await expect(footer.getByRole('link', { name: 'Support', exact: true })).toHaveAttribute('href', '/support/');
      await expect(footer.getByRole('link', { name: 'support@gleamit.app' })).toHaveAttribute('href', 'mailto:support@gleamit.app');
    });

    test('visible links, and the theme toggle, are at least 48px tap targets', async ({ page }) => {
      const targets = page.locator('nav a:visible, nav button:visible, section.hero a:visible, footer a:visible');
      const count = await targets.count();
      expect(count).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const box = await targets.nth(i).boundingBox();
        const label = (await targets.nth(i).getAttribute('aria-label')) ?? (await targets.nth(i).innerText());
        expect(box, label).not.toBeNull();
        expect(box!.height, `${label} height`).toBeGreaterThanOrEqual(48);
        expect(box!.width, `${label} width`).toBeGreaterThanOrEqual(48);
      }
    });
  });
}

test('hero screenshots are served as AVIF and WebP with dimensions and alt text', async ({ page, request }) => {
  await page.goto('/');
  const pictures = page.locator('section.hero .phone picture');
  await expect(pictures).toHaveCount(2);
  for (const picture of await pictures.all()) {
    const avif = picture.locator('source[type="image/avif"]');
    await expect(avif).toHaveCount(1);
    const img = picture.locator('img');
    await expect(img).toHaveAttribute('src', /\.webp$/);
    for (const url of [(await avif.getAttribute('srcset'))!.split(/\s+/)[0], (await img.getAttribute('src'))!]) {
      const res = await request.get(url);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toMatch(/^image\/(avif|webp)$/);
    }
    await expect(img).toHaveAttribute('width', /^\d+$/);
    await expect(img).toHaveAttribute('height', /^\d+$/);
    await expect(img).toHaveAttribute('alt', /\S+(\s+\S+){3,}/);
  }
});

test('every image on the landing page has alt text and declared dimensions', async ({ page }) => {
  await page.goto('/');
  const images = page.locator('img');
  for (const img of await images.all()) {
    await expect(img).toHaveAttribute('alt');
    await expect(img).toHaveAttribute('width', /^\d+$/);
    await expect(img).toHaveAttribute('height', /^\d+$/);
  }
});

test('Open Graph tags point at the feature graphic', async ({ page, request }) => {
  await page.goto('/');
  const image = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(image).toMatch(/^https:\/\/gleamit\.app\/.+\.(png|jpg)$/);
  const res = await request.get(new URL(image!).pathname);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('image/');
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', /^\d+$/);
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', /^\d+$/);
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /\S+/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Gleamit/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
});

test('copy follows the app guardrails', async ({ page }) => {
  await page.goto('/');
  await expectCopyGuardrails(page);
});

test('keyboard focus is visible and follows the reading order', async ({ page }) => {
  await page.goto('/');
  const expected = ['Gleamit', 'Features', 'Pricing', 'FAQ', 'Support', 'Switch to dark theme', 'Download on the App Store'];
  for (const name of expected) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el);
      return { name: (el.getAttribute('aria-label') ?? el.innerText ?? '').trim() || el.querySelector('img')?.alt, outline: style.outlineStyle, width: style.outlineWidth };
    });
    expect(focused.name, `tab stop ${name}`).toContain(name);
    expect(focused.outline, `${name} focus ring`).not.toBe('none');
    expect(parseFloat(focused.width), `${name} focus ring width`).toBeGreaterThanOrEqual(2);
  }
});

test('a dark-preferring visitor still opens light and can switch the whole site to dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  const body = page.locator('body');
  const toggle = page.getByRole('button', { name: 'Switch to dark theme' });
  await expect(body).toHaveCSS('background-color', pageBackground.light);
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  await toggle.click();
  await expect(body).toHaveCSS('background-color', pageBackground.dark);
  const pressed = page.getByRole('button', { name: 'Switch to light theme' });
  await expect(pressed).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#111418');
  await expect(page.locator('.badge img.app-store').first()).toHaveAttribute('src', '/badges/app-store-white.svg');

  await page.reload();
  await expect(body).toHaveCSS('background-color', pageBackground.dark);

  await page.getByRole('navigation').getByRole('link', { name: 'Support' }).click();
  await expect(page).toHaveURL(/\/support\/$/);
  await expect(body).toHaveCSS('background-color', pageBackground.dark);

  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(body).toHaveCSS('background-color', pageBackground.light);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#D8E1DD');

  await page.goto('/');
  await expect(body).toHaveCSS('background-color', pageBackground.light);
  await expect(page.locator('.badge img.app-store').first()).toHaveAttribute('src', '/badges/app-store-black.svg');
});

test('without JavaScript the site is light and the toggle is not offered', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('body')).toHaveCSS('background-color', pageBackground.light);
  await expect(page.locator('.theme-toggle')).toBeHidden();
  await context.close();
});
