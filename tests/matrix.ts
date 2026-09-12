import type { Page } from '@playwright/test';

export const schemes = ['light', 'dark'] as const;
export const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

export async function open(page: Page, scheme: (typeof schemes)[number], viewport: (typeof viewports)[number]) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto('/');
}
