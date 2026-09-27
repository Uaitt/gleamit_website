import { test, expect } from '@playwright/test';
import { routes } from './routes';
import { showcase } from './matrix';

test('the home page shows the badges and the ad just above the footer', async ({ page }) => {
  await page.goto('/');
  await expect(showcase(page)).toBeVisible();
  const nextToFooter = await page.locator('main > :last-child').evaluate((el) => el.classList.contains('showcase'));
  expect(nextToFooter).toBe(true);
  await expect(page.getByRole('contentinfo').locator('a[target="_blank"]')).toHaveCount(0);
  await expect(page.getByRole('contentinfo').locator('iframe')).toHaveCount(0);
});

for (const route of routes.filter((route) => route !== '/')) {
  test(`${route} shows neither the badges nor the ad`, async ({ page }) => {
    await page.goto(route);
    await expect(showcase(page)).toHaveCount(0);
    await expect(page.locator('iframe')).toHaveCount(0);
  });
}

for (const width of [375, 1280, 1440]) {
  test(`the ad and the badges sit in equal, tight space at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const [faq, badges, ad, footer] = await Promise.all(
      ['.faq details:last-of-type', '.showcase .badges', '.showcase .ad-swap', 'footer'].map((selector) =>
        page.locator(selector).evaluate((el) => el.getBoundingClientRect()),
      ),
    );
    const above = ad.top - faq.bottom;
    const below = footer.top - badges.bottom;
    expect(above).toBe(below);
    expect(above).toBeLessThanOrEqual(64);
  });
}
