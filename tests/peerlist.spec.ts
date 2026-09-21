import { test, expect } from '@playwright/test';
import { routes } from './routes';

const badge = (page: import('@playwright/test').Page) =>
  page.getByRole('contentinfo').getByRole('link', { name: /Peerlist$/ });

for (const route of routes) {
  test(`${route} shows the Peerlist badge in the footer`, async ({ page }) => {
    await page.goto(route);
    const link = badge(page);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      'href',
      'https://peerlist.io/uaitt/project/gleamit-dental-health-tracker',
    );
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('target', '_blank');
  });
}

test('the Peerlist badge stays light under both themes', async ({ page }) => {
  await page.goto('/');
  const image = badge(page).locator('img');
  await expect(image).toHaveAttribute('src', /peerlist\.io\/api\/.*theme=light$/);

  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(image).toHaveAttribute('src', /peerlist\.io\/api\/.*theme=light$/);
});
