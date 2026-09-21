import { test, expect } from '@playwright/test';
import { routes } from './routes';
import { horizontalOverflow, viewports } from './matrix';
import { pageBackground, tealText } from './theme';

for (const route of routes) {
  test(`${route} fits a 320px phone with nothing poking past the edges`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    expect(await horizontalOverflow(page), 'horizontal overflow in px').toBe(0);

    const poking = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      return [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((el) => el.offsetParent !== null)
        .map((el) => ({ el, box: el.getBoundingClientRect() }))
        .filter(({ box }) => box.width > 0 && (box.left < -1 || box.right > width + 1))
        .map(({ el, box }) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} ${Math.round(box.left)}..${Math.round(box.right)}`);
    });
    expect(poking).toEqual([]);
  });

  for (const systemScheme of ['light', 'dark'] as const) {
    for (const viewport of viewports) {
      test(`${route} renders light under a ${systemScheme} system at ${viewport.width}px`, async ({ page, context }) => {
        await page.emulateMedia({ colorScheme: systemScheme });
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        const requested: string[] = [];
        page.on('request', (request) => requested.push(request.url()));

        const response = await page.goto(route);
        expect(response?.status()).toBe(200);

        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        await expect(page.locator('body')).toHaveCSS('background-color', pageBackground.light);
        const teal = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--teal-text').trim());
        expect(teal).toBe(tealText.light);

        expect(await horizontalOverflow(page), 'horizontal overflow in px').toBe(0);

        await expect(page.locator('script[src]')).toHaveCount(0);
        await expect(page.locator('script')).toHaveCount(route === '/' ? 5 : 2);
        expect(await context.cookies()).toEqual([]);

        const origin = new URL(page.url()).origin;
        const badgeHosts = ['api.producthunt.com', 'peerlist.io'];
        const thirdParty = requested
          .map((url) => new URL(url))
          .filter((url) => url.origin !== origin && !badgeHosts.includes(url.hostname));
        expect(thirdParty.map((url) => url.href)).toEqual([]);
      });
    }
  }
}
