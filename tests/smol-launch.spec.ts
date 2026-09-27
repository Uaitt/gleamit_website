import { test, expect } from '@playwright/test';
import { showcase } from './matrix';

const badge = (page: import('@playwright/test').Page) =>
  showcase(page).getByRole('link', { name: 'Gleamit: Featured on Smol Launch' });

test('the home page shows the Smol Launch badge above the footer', async ({ page }) => {
  await page.goto('/');
  const link = badge(page);
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', 'https://smollaunch.com');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link.locator('img')).toHaveAttribute('src', 'https://smollaunch.com/badges/featured.svg');
});
