import { test, expect } from '@playwright/test';
import { routes } from './routes';

const badge = (page: import('@playwright/test').Page) =>
  page.getByRole('contentinfo').getByRole('link', { name: 'Gleamit: Dental Health Tracker on PeerPush' });

for (const route of routes) {
  test(`${route} shows the PeerPush badge in the footer`, async ({ page }) => {
    await page.goto(route);
    const link = badge(page);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://peerpush.com/p/gleamit-dental-health-tracker');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link.locator('img')).toHaveAttribute(
      'src',
      'https://peerpush.com/p/gleamit-dental-health-tracker/badge.png',
    );
  });
}

test('the footer badges sit in two rows of three on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const badges = await page.locator('footer .badges > a').all();
  const centers = await Promise.all(
    badges.map(async (badge) => {
      const box = (await badge.boundingBox())!;
      return Math.round(box.y + box.height / 2);
    }),
  );
  expect(centers).toHaveLength(6);
  expect(new Set(centers.slice(0, 3)).size, 'first row').toBe(1);
  expect(new Set(centers.slice(3)).size, 'second row').toBe(1);
  expect(centers[3]).toBeGreaterThan(centers[0]);
  const firstRow = badges.slice(0, 3).map((badge) => badge.getAttribute('class'));
  expect(await Promise.all(firstRow)).toEqual(['product-hunt', 'peerlist', 'startup-base']);
});
