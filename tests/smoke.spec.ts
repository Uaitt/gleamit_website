import { test, expect } from '@playwright/test';
import { routes } from './routes';
import { schemes, viewports } from './matrix';

const pageBackground = { light: 'rgb(243, 246, 248)', dark: 'rgb(17, 20, 24)' };

for (const route of routes) {
  for (const scheme of schemes) {
    for (const viewport of viewports) {
      test(`${route} renders in ${scheme} at ${viewport.width}px`, async ({ page, context }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        const response = await page.goto(route);
        expect(response?.status()).toBe(200);

        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        const body = page.locator('body');
        await expect(body).toHaveCSS('background-color', pageBackground[scheme]);

        const overflow = await page.evaluate(() => {
          const root = document.documentElement;
          return root.scrollWidth - root.clientWidth;
        });
        expect(overflow, 'horizontal overflow in px').toBe(0);

        await expect(page.locator('script[src]')).toHaveCount(0);
        await expect(page.locator('script')).toHaveCount(route === '/' ? 1 : 0);
        expect(await context.cookies()).toEqual([]);
      });
    }
  }
}
