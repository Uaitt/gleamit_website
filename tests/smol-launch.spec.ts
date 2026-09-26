import { test, expect } from '@playwright/test';
import { routes } from './routes';

const badge = (page: import('@playwright/test').Page) =>
  page.getByRole('contentinfo').getByRole('link', { name: 'Gleamit: Featured on Smol Launch' });

for (const route of routes) {
  test(`${route} shows the Smol Launch badge in the footer`, async ({ page }) => {
    await page.goto(route);
    const link = badge(page);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://smollaunch.com');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link.locator('img')).toHaveAttribute('src', 'https://smollaunch.com/badges/featured.svg');
  });
}
