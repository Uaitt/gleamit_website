import { test, expect } from '@playwright/test';
import { showcase } from './matrix';

const badge = (page: import('@playwright/test').Page) =>
  showcase(page).getByRole('link', { name: /Peerlist$/ });

test('the home page shows the Peerlist badge above the footer', async ({ page }) => {
  await page.goto('/');
  const link = badge(page);
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    'href',
    'https://peerlist.io/uaitt/project/gleamit-dental-health-tracker',
  );
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(link).toHaveAttribute('target', '_blank');
});

test('the Peerlist badge stays light under both themes', async ({ page }) => {
  await page.goto('/');
  const image = badge(page).locator('img');
  await expect(image).toHaveAttribute('src', /peerlist\.io\/api\/.*theme=light$/);

  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(image).toHaveAttribute('src', /peerlist\.io\/api\/.*theme=light$/);
});
