import { test, expect } from '@playwright/test';
import { routes } from './routes';

const badge = (page: import('@playwright/test').Page) =>
  page.getByRole('contentinfo').getByRole('link', { name: /Product Hunt$/ });

for (const route of routes) {
  test(`${route} shows the Product Hunt badge in the footer`, async ({ page }) => {
    await page.goto(route);
    const link = badge(page);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /producthunt\.com\/products\/gleamit-dental-health-tracker/);
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('target', '_blank');
  });
}

test('the Product Hunt badge follows the theme toggle', async ({ page }) => {
  await page.goto('/');
  const image = badge(page).locator('img');
  await expect(image).toHaveAttribute('src', /api\.producthunt\.com\/widgets\/.*theme=light$/);

  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(image).toHaveAttribute('src', /api\.producthunt\.com\/widgets\/.*theme=neutral$/);

  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(image).toHaveAttribute('src', /api\.producthunt\.com\/widgets\/.*theme=light$/);
});
