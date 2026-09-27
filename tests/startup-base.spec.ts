import { test, expect } from '@playwright/test';
import { showcase } from './matrix';

const badge = (page: import('@playwright/test').Page) =>
  showcase(page).getByRole('link', { name: 'Featured on StartupBase' });

test('the home page shows the StartupBase badge above the footer', async ({ page }) => {
  await page.goto('/');
  const link = badge(page);
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute(
    'href',
    'https://startupbase.io/products/gleamit?utm_source=startupbase&utm_medium=badge&utm_campaign=featured-badge-neutral',
  );
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(link).toHaveAttribute('target', '_blank');
});

test('the StartupBase badge follows the theme toggle', async ({ page }) => {
  await page.goto('/');
  const image = badge(page).locator('img');
  const light = 'https://statics.startupbase.io/site/badges/featured-on-sb.svg';
  const dark = 'https://statics.startupbase.io/site/badges/featured-on-sb-neutral.svg';
  await expect(image).toHaveAttribute('src', light);

  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(image).toHaveAttribute('src', dark);

  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(image).toHaveAttribute('src', light);
});
