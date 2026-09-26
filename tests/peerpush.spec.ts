import { test, expect } from '@playwright/test';
import { routes } from './routes';
import { horizontalOverflow } from './matrix';

const badge = (page: import('@playwright/test').Page) =>
  page.getByRole('contentinfo').getByRole('link', { name: 'Gleamit: Dental Health Tracker on PeerPush' });

for (const route of routes) {
  test(`${route} shows the PeerPush badge in the footer`, async ({ page }) => {
    await page.goto(route);
    const link = badge(page);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', 'https://peerpush.com/p/gleamit-dental-health-tracker');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link.locator('img')).toHaveAttribute(
      'src',
      'https://peerpush.com/p/gleamit-dental-health-tracker/badge.png',
    );
  });
}

for (const { width, rows } of [
  { width: 1280, rows: 2 },
  { width: 1440, rows: 1 },
]) {
  test(`the footer badges sit in ${rows} row(s) at ${width}px, at full size`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const layout = await page.locator('footer .badges > a').evaluateAll((links) =>
      links.map((link) => {
        const box = link.getBoundingClientRect();
        const image = link.querySelector('img')!;
        const style = getComputedStyle(image);
        const inset = (sides: string[]) => sides.reduce((sum, side) => sum + parseFloat(style.getPropertyValue(side)), 0);
        const rendered = image.getBoundingClientRect();
        const contentWidth = rendered.width - inset(['padding-left', 'padding-right', 'border-left-width', 'border-right-width']);
        const contentHeight = rendered.height - inset(['padding-top', 'padding-bottom', 'border-top-width', 'border-bottom-width']);
        return {
          name: link.className,
          center: Math.round(box.y + box.height / 2),
          height: rendered.height,
          squeeze: contentWidth / contentHeight / (Number(image.getAttribute('width')) / Number(image.getAttribute('height'))),
        };
      }),
    );
    expect(layout).toHaveLength(6);
    expect(new Set(layout.map(({ center }) => center)).size, 'badge rows').toBe(rows);
    expect(layout.slice(0, 3).map(({ name }) => name)).toEqual(['product-hunt', 'peerlist', 'startup-base']);
    expect(await horizontalOverflow(page), 'horizontal overflow in px').toBe(0);
    for (const { name, height, squeeze } of layout) {
      expect(height, `${name} height`).toBe(46);
      expect(squeeze, `${name} aspect ratio`).toBeCloseTo(1, 1);
    }
  });
}
