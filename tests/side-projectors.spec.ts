import { test, expect } from '@playwright/test';
import { routes } from './routes';

const badge = (page: import('@playwright/test').Page) =>
  page.getByRole('contentinfo').getByRole('link', { name: /at @SideProjectors$/ });

for (const route of routes) {
  test(`${route} shows the SideProjectors badge in the footer`, async ({ page }) => {
    await page.goto(route);
    const link = badge(page);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      'href',
      'https://www.sideprojectors.com/project/96547/gleamit-dental-health-tracker',
    );
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('target', '_blank');
  });
}

test('the SideProjectors badge is a white card under both themes', async ({ page }) => {
  await page.goto('/');
  const image = badge(page).locator('img');
  for (const theme of ['light', 'dark']) {
    if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(image).toHaveAttribute('src', '/badges/sideprojectors.png');
    await expect(image).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(image).toHaveCSS('border-radius', '12px');
  }
});
