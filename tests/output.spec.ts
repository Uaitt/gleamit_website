import { test, expect } from '@playwright/test';
import { routes } from './routes';

const site = 'https://gleamit.app';

test('CNAME names the custom domain', async ({ request }) => {
  const res = await request.get('/CNAME');
  expect(res.status()).toBe(200);
  expect((await res.text()).trim()).toBe('gleamit.app');
});

test('robots.txt allows crawling and points at the sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain('Allow: /');
  expect(text).toContain(`Sitemap: ${site}/sitemap-index.xml`);
});

test('sitemap lists every route', async ({ request }) => {
  const index = await request.get('/sitemap-index.xml');
  expect(index.status()).toBe(200);
  expect(await index.text()).toContain(`${site}/sitemap-0.xml`);

  const sitemap = await request.get('/sitemap-0.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  for (const route of routes) {
    expect(xml).toContain(`<loc>${site}${route}</loc>`);
  }
});

for (const route of routes) {
  test(`${route} carries its canonical URL`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${site}${route}`);
  });
}

test('an unknown route serves the 404 page', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
