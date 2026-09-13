import { test, expect } from '@playwright/test';
import { routes } from './routes';
import { horizontalOverflow, viewports } from './matrix';
import { pageBackground, tealText } from './theme';

for (const route of routes) {
  for (const systemScheme of ['light', 'dark'] as const) {
    for (const viewport of viewports) {
      test(`${route} renders light under a ${systemScheme} system at ${viewport.width}px`, async ({ page, context }) => {
        await page.emulateMedia({ colorScheme: systemScheme });
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        const response = await page.goto(route);
        expect(response?.status()).toBe(200);

        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        await expect(page.locator('body')).toHaveCSS('background-color', pageBackground.light);
        const teal = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--teal-text').trim());
        expect(teal).toBe(tealText.light);

        expect(await horizontalOverflow(page), 'horizontal overflow in px').toBe(0);

        await expect(page.locator('script[src]')).toHaveCount(0);
        await expect(page.locator('script')).toHaveCount(route === '/' ? 3 : 2);
        expect(await context.cookies()).toEqual([]);
      });
    }
  }
}
