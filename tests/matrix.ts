import { expect, type Locator, type Page } from '@playwright/test';

export const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

export async function open(page: Page, viewport: (typeof viewports)[number]) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto('/');
}

/** The ToC the text layout shows at this width: the sticky one on desktop, the collapsible one on mobile. */
export function toc(page: Page, width: number) {
  return page.locator(width > 900 ? '.toc-wide' : '.toc-narrow');
}

export async function toggleDark(page: Page) {
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
}

/** Waits for smooth scrolling and lazy images to stop moving the page. */
export async function settleScroll(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForFunction(() => {
    const self = window as unknown as { last?: number; stable?: number };
    const y = window.scrollY;
    const imagesLoaded = [...document.images]
      .filter((image) => {
        const box = image.getBoundingClientRect();
        return box.width > 0 && box.bottom > 0 && box.top < innerHeight;
      })
      .every((image) => image.complete);
    self.stable = imagesLoaded && y === self.last ? (self.stable ?? 0) + 1 : 0;
    self.last = y;
    return self.stable >= 3;
  }, undefined, { polling: 100 });
}

export async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

/** Opens `/#id` and asserts the section's first line is not hidden under the sticky nav. */
export async function expectAnchorClearsNav(page: Page, id: string) {
  await page.goto(`/#${id}`);
  await settleScroll(page);
  await expect(page.locator(`#${id}`)).toBeInViewport();
  await expectClearsNav(page, page.locator(`#${id} .eyebrow`), `the first line of #${id}`);
}

/** Asserts the target is on screen and not tucked under the sticky nav. */
export async function expectClearsNav(page: Page, target: Locator, what: string) {
  await expect(target).toBeInViewport();

  const navBottom = await page.locator('nav[aria-label="Main"]').evaluate((el) => el.getBoundingClientRect().bottom);
  const targetTop = await target.evaluate((el) => el.getBoundingClientRect().top);
  expect(targetTop, `${what} must not sit under the sticky nav`).toBeGreaterThanOrEqual(navBottom);
}

/** The app's copy guardrails: banned words from CONTEXT.md, and no em or en dashes. */
export async function expectCopyGuardrails(page: Page) {
  const text = await page.locator('body').innerText();
  const alts = await page.locator('img[alt]').evaluateAll((els) => els.map((el) => el.getAttribute('alt')));
  const copy = [text, ...alts].join('\n');
  expect(copy).not.toMatch(/\b(detect|diagnose|screen|monitor|cavity|gum disease|oral cancer)\b/i);
  expect(copy).not.toContain('—');
  expect(copy).not.toContain('–');
}
