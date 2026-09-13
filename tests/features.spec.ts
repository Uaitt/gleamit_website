import { test, expect } from '@playwright/test';
import { expectAnchorClearsNav, horizontalOverflow, open, toggleDark, viewports } from './matrix';
import { cardBackground, tealText, tealTextColor } from './theme';

const tiles = [
  'A 32-tooth map that is yours',
  '2-minute timer',
  'Brushing and floss streaks',
  'Dentist and appointments',
  'Smile photos',
  'Document vault',
  'Brushes and heads',
];
const showcase = [
  { eyebrow: 'Habits', heading: 'Twice a day, and the streak grows' },
  { eyebrow: 'Dentist visits', heading: 'Everything your dentist asks about, in one place' },
  { eyebrow: 'Private by design', heading: 'Backup only if you want it, only to your own cloud' },
];

for (const viewport of viewports) {
  test.describe(`features at ${viewport.width}px`, () => {
    test.beforeEach(({ page }) => open(page, viewport));

    test('the Bento grid shows all seven feature cards', async ({ page }) => {
      const grid = page.locator('#features .bento');
      await expect(grid.locator('.tile')).toHaveCount(tiles.length);
      for (const tile of tiles) {
        await expect(grid.getByRole('heading', { name: tile })).toBeVisible();
      }
    });

    test('Bento cards carry the app card radius', async ({ page }) => {
      for (const tile of await page.locator('#features .tile').all()) {
        await expect(tile).toHaveCSS('border-radius', '24px');
      }
    });

    test('the three showcase rows are visible with their screenshots', async ({ page }) => {
      const rows = page.locator('#showcase .show');
      await expect(rows).toHaveCount(showcase.length);
      for (const [index, { eyebrow, heading }] of showcase.entries()) {
        const row = rows.nth(index);
        await expect(row.getByText(eyebrow, { exact: true })).toBeVisible();
        await expect(row.getByRole('heading', { name: heading })).toBeVisible();
        await expect(row.locator('.phone img')).toBeVisible();
      }
    });

    test('neither section overflows horizontally', async ({ page }) => {
      await page.locator('#showcase').scrollIntoViewIfNeeded();
      expect(await horizontalOverflow(page), 'horizontal overflow in px').toBe(0);
    });

    test('both sections follow the theme toggle into dark', async ({ page }) => {
      const firstTile = page.locator('#features .tile').first();
      await expect(firstTile).toHaveCSS('background-color', cardBackground.light);

      await toggleDark(page);

      await expect(firstTile).toHaveCSS('background-color', cardBackground.dark);
      const teal = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--teal-text').trim());
      expect(teal).toBe(tealText.dark);

      for (const tile of tiles) {
        await expect(page.locator('#features').getByRole('heading', { name: tile })).toBeVisible();
      }
      for (const [index, { eyebrow, heading }] of showcase.entries()) {
        const row = page.locator('#showcase .show').nth(index);
        await expect(row.getByText(eyebrow, { exact: true })).toHaveCSS('color', tealTextColor.dark);
        await expect(row.getByRole('heading', { name: heading })).toBeVisible();
      }
      await expect(page.locator('#showcase .show .phone img')).toHaveCount(showcase.length);

      await page.locator('#showcase').scrollIntoViewIfNeeded();
      expect(await horizontalOverflow(page), 'horizontal overflow in px').toBe(0);
    });
  });
}

test('the nav Features link points at the feature grid', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Features' }).click();
  await expect(page).toHaveURL(/#features$/);
});

for (const viewport of viewports) {
  test(`the Features anchor lands on the grid, clear of the sticky nav, at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await expectAnchorClearsNav(page, 'features');
  });
}

test('every screenshot in the feature and showcase sections has alt text', async ({ page }) => {
  await page.goto('/');
  const images = page.locator('#features img, #showcase img');
  expect(await images.count()).toBeGreaterThan(0);
  for (const img of await images.all()) {
    await expect(img).toHaveAttribute('alt', /\S+(\s+\S+){3,}/);
  }
});

test.describe('scroll reveal', () => {
  test('sections below the fold reveal once they are scrolled into view', async ({ page }) => {
    await page.goto('/');
    const tile = page.locator('#features .tile').last();
    await expect(tile).toHaveCSS('opacity', '0');
    await tile.scrollIntoViewIfNeeded();
    await expect(tile).toHaveCSS('opacity', '1');
  });

  test('content is visible immediately and nothing animates under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    for (const target of ['#features .tile', '#showcase .show']) {
      for (const element of await page.locator(target).all()) {
        await expect(element).toHaveCSS('opacity', '1');
        await expect(element).toHaveCSS('transform', 'none');
      }
    }
    await expect(page.locator('html')).not.toHaveClass(/reveal-on-scroll/);
  });

  test('turning on reduced motion after load reveals whatever is still hidden', async ({ page }) => {
    await page.goto('/');
    const tile = page.locator('#features .tile').last();
    await expect(tile).toHaveCSS('opacity', '0');

    await page.emulateMedia({ reducedMotion: 'reduce' });

    await expect(tile).toHaveCSS('opacity', '1');
    await expect(tile).toHaveCSS('transform', 'none');
  });

  test('content is visible without the reveal script', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#features .tile').last()).toHaveCSS('opacity', '1');
    await context.close();
  });
});
