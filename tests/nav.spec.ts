import { test, expect, type Page } from '@playwright/test';
import { routes } from './routes';
import { horizontalOverflow, viewports } from './matrix';

const mobile = viewports.find((viewport) => viewport.name === 'mobile')!;
const desktop = viewports.find((viewport) => viewport.name === 'desktop')!;
const menuLinks = ['Features', 'Pricing', 'FAQ', 'Support', 'Privacy Policy', 'Terms'];

function navLink(page: Page, name: string) {
  return page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name, exact: true });
}

test.describe('the desktop nav', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(desktop);
    await page.goto('/');
  });

  test('shows the section links inline, without a menu button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
    for (const name of ['Features', 'Pricing', 'FAQ', 'Support']) {
      await expect(navLink(page, name)).toBeVisible();
    }
  });

  test('leaves the legal links to the footer', async ({ page }) => {
    for (const name of ['Privacy Policy', 'Terms']) {
      await expect(navLink(page, name)).toBeHidden();
      await expect(page.getByRole('contentinfo').getByRole('link', { name, exact: true })).toBeVisible();
    }
  });
});

for (const route of routes) {
  test.describe(`the mobile menu on ${route}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize(mobile);
      await page.goto(route);
    });

    test('keeps every link behind a menu button until it is opened', async ({ page }) => {
      const button = page.getByRole('button', { name: 'Open menu' });
      await expect(button).toBeVisible();
      for (const name of menuLinks) {
        await expect(navLink(page, name)).toBeHidden();
      }

      await button.click();
      const open = page.getByRole('button', { name: 'Close menu' });
      await expect(open).toHaveAttribute('aria-expanded', 'true');
      for (const name of menuLinks) {
        await expect(navLink(page, name)).toBeVisible();
      }
      expect(await horizontalOverflow(page), 'horizontal overflow in px').toBe(0);

      await open.click();
      await expect(navLink(page, 'Terms')).toBeHidden();
    });

    test('offers 48px tap targets while open', async ({ page }) => {
      await page.getByRole('button', { name: 'Open menu' }).click();
      const targets = page.locator('nav a:visible, nav button:visible');
      for (const target of await targets.all()) {
        const box = (await target.boundingBox())!;
        const label = (await target.getAttribute('aria-label')) ?? (await target.innerText());
        expect(box.height, `${label} height`).toBeGreaterThanOrEqual(48);
        expect(box.width, `${label} width`).toBeGreaterThanOrEqual(48);
      }
    });

    test('reaches the privacy policy and the terms', async ({ page }) => {
      for (const [name, url] of [['Privacy Policy', '/privacy/'], ['Terms', '/terms/']] as const) {
        await page.goto(route);
        await page.getByRole('button', { name: 'Open menu' }).click();
        await navLink(page, name).click();
        await expect(page).toHaveURL(new RegExp(`${url}$`));
      }
    });

    test('closes on Escape and hands focus back to the button', async ({ page }) => {
      const button = page.getByRole('button', { name: 'Open menu' });
      await button.click();
      await page.keyboard.press('Escape');
      await expect(navLink(page, 'Terms')).toBeHidden();
      await expect(button).toBeFocused();
    });
  });
}
