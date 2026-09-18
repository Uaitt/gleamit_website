import { test, expect } from '@playwright/test';

const heroAvifSources = (page: import('@playwright/test').Page) =>
  page.locator('section.hero .phone picture source[type="image/avif"]');

test('the hero shots are preloaded with the same URLs the picture asks for', async ({ page }) => {
  await page.goto('/');

  const preloads = page.locator('link[rel="preload"][as="image"]');
  await expect(preloads).toHaveCount(2);

  const sources = await heroAvifSources(page).all();
  expect(sources).toHaveLength(2);

  for (const [index, source] of sources.entries()) {
    const preload = preloads.nth(index);
    await expect(preload).toHaveAttribute('imagesrcset', (await source.getAttribute('srcset'))!);
    await expect(preload).toHaveAttribute('imagesizes', (await source.getAttribute('sizes'))!);
    await expect(preload).toHaveAttribute('type', 'image/avif');
    await expect(preload).toHaveAttribute('fetchpriority', 'high');
  }
});

test('a preloaded hero shot is fetched once, not once per preload and picture', async ({ page }) => {
  const requested: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('.avif')) requested.push(request.url());
  });

  await page.goto('/', { waitUntil: 'load' });
  await page.locator('section.hero .phone img').first().evaluate((img: HTMLImageElement) => img.decode());

  expect(requested.length).toBeGreaterThan(0);
  expect(new Set(requested).size, `duplicate downloads: ${requested.join(', ')}`).toBe(requested.length);
});

test('the hero shots paint on the first frame instead of decoding late', async ({ page }) => {
  await page.goto('/');
  for (const img of await page.locator('section.hero .phone img').all()) {
    await expect(img).toHaveAttribute('loading', 'eager');
    await expect(img).toHaveAttribute('decoding', 'sync');
    await expect(img).toHaveAttribute('fetchpriority', 'high');
  }
});

test('no render-blocking stylesheet stands between the visitor and the first paint', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(0);
  await expect(page.locator('head style')).not.toHaveCount(0);
});
