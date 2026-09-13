import { test, expect } from '@playwright/test';
import {
  expectClearsNav,
  expectCopyGuardrails,
  horizontalOverflow,
  settleScroll,
  toc,
  toggleDark,
  viewports,
} from './matrix';
import { pageBackground } from './theme';

const sections = ['Contact', 'Android', 'iOS', 'Delete all Gleamit data'];

test.describe('/support/', () => {
  test.beforeEach(({ page }) => page.goto('/support/'));

  test('leads with the support address and the reply promise', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Support' })).toBeVisible();

    const contact = page.locator('#contact-card');
    await expect(contact).toContainText('support@gleamit.app');
    await expect(contact).toContainText('3 business days');
    await expect(contact.getByRole('link', { name: 'Email support' })).toHaveAttribute(
      'href',
      'mailto:support@gleamit.app',
    );
  });

  test('the email button is a 48px target', async ({ page }) => {
    const box = await page.getByRole('link', { name: 'Email support' }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
  });

  test('keeps the copy guardrails', async ({ page }) => {
    await expectCopyGuardrails(page);
  });

  test('drops the stale advice of the old support page', async ({ page }) => {
    const copy = await page.locator('body').innerText();
    const hrefs = await page
      .locator('[href]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')!));

    expect(copy, 'the personal Gmail address is gone').not.toMatch(/gmail\.com/i);
    expect(hrefs.join('\n'), 'the personal Gmail address is gone').not.toMatch(/gmail\.com/i);
    expect(copy, 'the device-backup claim is gone').not.toMatch(/iCloud Backup|built-in backup|Google's cloud backup/i);
  });

  test.describe('Android', () => {
    test('says the switch leaves the Drive copy in place', async ({ page }) => {
      const note = page.locator('#android-switch ~ .note').first();
      await expect(note).toContainText('does not delete the copy already in Drive');
      await expect(note).toContainText('stops new uploads');
    });

    test('walks through Drive as a numbered list, and says to repeat it per account', async ({ page }) => {
      const steps = page.locator('#android-delete ~ * ol').first();
      const text = await steps.innerText();
      expect(text).toContain('Google Drive');
      expect(text).toContain('Settings');
      expect(text).toContain('Manage apps');
      expect(text).toContain('Gleamit');
      expect(text).toContain('Delete hidden app data');
      expect(await steps.locator('li').count()).toBeGreaterThanOrEqual(5);

      await expect(page.locator('#android')).toBeVisible();
      await expect(page.locator('.text-page')).toContainText('repeat these steps in each account');
    });
  });

  test.describe('iOS', () => {
    test('says the switch leaves the iCloud copy in place', async ({ page }) => {
      const note = page.locator('#ios-switch ~ .note').first();
      await expect(note).toContainText('does not delete the copy already in iCloud');
      await expect(note).toContainText('stops new uploads');
    });

    test('walks through iOS Settings as a numbered list', async ({ page }) => {
      const steps = page.locator('#ios-delete ~ * ol').first();
      const text = await steps.innerText();
      expect(text).toContain('Settings');
      expect(text).toContain('iCloud');
      expect(text).toContain('Manage Account Storage');
      expect(text).toContain('Gleamit');
      expect(text).toContain('Delete Data');
      expect(await steps.locator('li').count()).toBeGreaterThanOrEqual(5);
    });

    test('walks through Mac System Settings as its own numbered list', async ({ page }) => {
      const steps = page.locator('#ios-delete-mac ~ * ol').first();
      const text = await steps.innerText();
      expect(text).toContain('System Settings');
      expect(text).toContain('iCloud');
      expect(text).toContain('Gleamit');
      expect(text).toMatch(/Delete Documents and Data/);
      expect(await steps.locator('li').count()).toBeGreaterThanOrEqual(4);
    });
  });

  test('deleting the app clears the device, and Pro restores from the store', async ({ page }) => {
    const section = page.locator('#delete-all ~ *');
    const text = (await section.allInnerTexts()).join('\n');

    expect(text).toMatch(/Deleting the app removes everything stored on the phone/);
    // The label the app actually shows, singular: `proRestore` in the app repo's l10n.
    expect(text).toContain('Restore purchase');
    expect(text).toMatch(/App Store or Google Play/);
    expect(text, 'the cloud copy outliving the app must not be contradicted').toMatch(/If cloud backup was ever on/);
  });

  for (const viewport of viewports) {
    test.describe(`at ${viewport.width}px`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/support/');
      });

      test('lists every section, and only one ToC is on show', async ({ page }) => {
        const shown = toc(page, viewport.width);
        const hidden = page.locator(viewport.width > 900 ? '.toc-narrow' : '.toc-wide');
        await expect(shown).toBeVisible();
        await expect(hidden).toBeHidden();

        await expect(shown.locator('.toc-list a')).toHaveText(sections);
        await expect(page.locator('.prose h2')).toHaveText(sections);
      });

      test('every ToC entry jumps to its section, clear of the sticky nav', async ({ page }) => {
        // Reduced motion turns the site's smooth scrolling off, so each jump lands in one step.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.reload();

        const shown = toc(page, viewport.width);
        if (viewport.width <= 900) await shown.locator('summary').click();

        const hrefs = await shown.locator('.toc-list a').evaluateAll((els) => els.map((el) => el.getAttribute('href')!));
        expect(hrefs).toHaveLength(sections.length);
        for (const href of hrefs) {
          await page.goto(`/support/${href}`);
          await settleScroll(page);
          await expectClearsNav(page, page.locator(`.prose ${href}`), href);
        }
      });

      test('follows the toggle into dark and back', async ({ page }) => {
        await expect(page.locator('body')).toHaveCSS('background-color', pageBackground.light);

        await toggleDark(page);
        await expect(page.locator('body')).toHaveCSS('background-color', pageBackground.dark);
        await expect(page.getByRole('heading', { level: 1, name: 'Support' })).toBeVisible();
        expect(await horizontalOverflow(page), 'horizontal overflow in px').toBe(0);

        await page.getByRole('button', { name: 'Switch to light theme' }).click();
        await expect(page.locator('body')).toHaveCSS('background-color', pageBackground.light);
      });
    });
  }
});
