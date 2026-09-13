import type { Page } from '@playwright/test';

export const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

export async function open(page: Page, viewport: (typeof viewports)[number]) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto('/');
}

export async function toggleDark(page: Page) {
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
}

/** Waits for smooth scrolling and lazy images to stop moving the page. */
export async function settleScroll(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => {
    const self = window as unknown as { last?: number; stable?: number };
    const y = window.scrollY;
    self.stable = y === self.last ? (self.stable ?? 0) + 1 : 0;
    self.last = y;
    return self.stable >= 3;
  }, undefined, { polling: 100 });
}

export async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}
