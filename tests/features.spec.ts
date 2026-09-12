import { test, expect } from '@playwright/test';
import { open, schemes, viewports } from './matrix';

const tiles = [
  'A 32-tooth map that is yours',
  '2-minute timer',
  'Brushing and floss streaks',
  'Dentist and appointments',
  'Smile photos',
  'Document vault',
  'Brushes and heads',
];
const showcase = ['Habits', 'Dentist visits', 'Private by design'];

for (const scheme of schemes) {
  for (const viewport of viewports) {
    test.describe(`features in ${scheme} at ${viewport.width}px`, () => {
      test.beforeEach(({ page }) => open(page, scheme, viewport));

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
        for (const [index, eyebrow] of showcase.entries()) {
          const row = rows.nth(index);
          await expect(row.getByText(eyebrow, { exact: true })).toBeVisible();
          await expect(row.getByRole('heading')).toBeVisible();
          await expect(row.locator('.phone img')).toBeVisible();
        }
      });

      test('neither section overflows horizontally', async ({ page }) => {
        await page.locator('#showcase').scrollIntoViewIfNeeded();
        const overflow = await page.evaluate(() => {
          const root = document.documentElement;
          return root.scrollWidth - root.clientWidth;
        });
        expect(overflow, 'horizontal overflow in px').toBe(0);
      });
    });
  }
}

test('the nav Features anchor lands on the feature grid', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Features' }).click();
  await expect(page).toHaveURL(/#features$/);
  await expect
    .poll(async () => Math.abs((await page.locator('#features').boundingBox())!.y), {
      message: 'distance from the top edge of the feature grid to the viewport top',
    })
    .toBeLessThanOrEqual(1);
});

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

  test('content is visible without the reveal script', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#features .tile').last()).toHaveCSS('opacity', '1');
    await context.close();
  });
});
