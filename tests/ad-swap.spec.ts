import { test, expect } from '@playwright/test';
import { showcase } from './matrix';

const embed = 'https://ad-swap.web.app/frame.html?site=c6bkSuDDIqaqoMlkjpSt&theme=light';
const ad = (page: import('@playwright/test').Page) => showcase(page).getByTitle('Ad');

test('the home page shows the sandboxed Ad Swap ad above the badges', async ({ page }) => {
  await page.goto('/');
  const frame = ad(page);
  await frame.scrollIntoViewIfNeeded();
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute('src', embed);
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-popups');
  const [adBox, badgesBox] = await Promise.all([frame.boundingBox(), page.locator('.showcase .badges').boundingBox()]);
  expect(adBox!.y + adBox!.height).toBeLessThanOrEqual(badgesBox!.y);
});

test('the Ad Swap ad stays light in the dark theme', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(ad(page)).toHaveAttribute('src', embed);
});

test('the Ad Swap ad fits a 320px phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  const box = await ad(page).boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
});
