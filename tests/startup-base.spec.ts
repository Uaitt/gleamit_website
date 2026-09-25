import { test, expect } from '@playwright/test';
import { routes } from './routes';

const badge = (page: import('@playwright/test').Page) =>
  page.getByRole('contentinfo').getByRole('link', { name: 'Featured on StartupBase' });

for (const route of routes) {
  test(`${route} shows the StartupBase badge in the footer`, async ({ page }) => {
    await page.goto(route);
    const link = badge(page);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      'href',
      'https://startupbase.io/products/gleamit?utm_source=startupbase&utm_medium=badge&utm_campaign=featured-badge-neutral',
    );
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('target', '_blank');
  });
}

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

test('the StartupBase badge sits next to the Product Hunt one', async ({ page }) => {
  await page.goto('/');
  const classes = await page
    .locator('footer .badges > a')
    .evaluateAll((links) => links.map((link) => link.className));
  expect(classes.indexOf('startup-base')).toBe(classes.indexOf('product-hunt') + 1);
});
