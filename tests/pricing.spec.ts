import { test, expect, type Page } from '@playwright/test';
import { expectAnchorClearsNav, expectCopyGuardrails, horizontalOverflow, open, toggleDark, viewports } from './matrix';
import { cardBackground, tealTextColor } from './theme';

/** The free-vs-Pro rules of the app's paywall, as CONTEXT.md states them. */
const comparison = [
  ['Brushing timer, streaks, reminders, floss', 'Included', 'Included'],
  ['Full 32-tooth map with conditions and notes', 'Included', 'Included'],
  ['Dentist contact, appointments, Learn', 'Included', 'Included'],
  ['Cloud backup, full export and import', 'Included', 'Included'],
  ['Tooth history', 'Latest entry', 'Full timeline'],
  ['Brushes you track at once', '1', 'Unlimited'],
  ['Brushing history and trends', '7 days / 4 weeks', 'Unlimited'],
  ['Streak insights', 'This month', 'All-time plus patterns'],
  ['Smile photos', '1', 'Unlimited plus compare'],
  ['Document vault', '1 file', 'Unlimited'],
  ['Dentist PDF report', 'Sample preview', 'Included'],
  ['Custom brush, cleaning and appointment intervals', 'Presets', 'Included'],
];

const questions = [
  'Where is my data?',
  'Can you see my data?',
  'Is Pro a subscription?',
  'How do I move to a new phone?',
  'Is the backup encrypted?',
  'Does Gleamit give medical advice?',
  'How do I delete everything?',
];

for (const viewport of viewports) {
  test.describe(`pricing at ${viewport.width}px`, () => {
    test.beforeEach(({ page }) => open(page, viewport));

    test('the card states the one-time price, that it is not a subscription, and the store note', async ({ page }) => {
      const pricing = page.locator('#pricing');
      await expect(pricing.getByText('€9.99', { exact: false }).first()).toBeVisible();
      await expect(pricing.getByText('One-time purchase. No subscription, no ads, ever.')).toBeVisible();
      await expect(
        pricing.getByText('Price shown in euro. Your store shows the exact amount in your currency, taxes included.'),
      ).toBeVisible();
    });

    test('the heading, eyebrow and intro stack in one centred column', async ({ page }) => {
      const head = page.locator('#pricing .head');
      const eyebrow = (await head.locator('.eyebrow').boundingBox())!;
      const heading = (await head.getByRole('heading', { name: 'Free, with one optional unlock' }).boundingBox())!;
      const intro = (await head.locator('p').boundingBox())!;

      expect(heading.y, 'the heading sits under the eyebrow').toBeGreaterThanOrEqual(eyebrow.y + eyebrow.height);
      expect(intro.y, 'the intro sits under the heading').toBeGreaterThanOrEqual(heading.y + heading.height);
      expect(heading.height, 'the heading is not squeezed into a narrow column').toBeLessThan(160);
    });

    test('the free vs Pro table matches the paywall rules', async ({ page }) => {
      const table = page.locator('#pricing table');
      const header = table.getByRole('row').first();
      for (const name of ['Feature', 'Free', 'Pro']) {
        const columnheader = header.getByRole('columnheader', { name });
        // A phone gets the same columns as a stack, labelled row by row instead.
        if (viewport.width > 640) await expect(columnheader).toBeVisible();
        else await expect(columnheader).toBeHidden();
      }

      const rows = table.locator('tbody tr');
      await expect(rows).toHaveCount(comparison.length);
      for (const [index, [feature, free, pro]] of comparison.entries()) {
        const row = rows.nth(index);
        await expect(row.getByRole('rowheader')).toHaveText(feature);
        const cells = row.getByRole('cell');
        await expect(cells).toHaveCount(2);
        await expect(cells.nth(0)).toHaveText(free);
        await expect(cells.nth(1)).toHaveText(pro);
      }
    });

    test('every Free and Pro value is readable inside the card, not clipped by it', async ({ page }) => {
      const card = page.locator('#pricing .price-card');
      const clipped = await card.evaluate((el) =>
        [...el.querySelectorAll('td, tbody th')]
          .filter((cell) => {
            const box = cell.getBoundingClientRect();
            const bounds = el.getBoundingClientRect();
            return box.right > bounds.right + 1 || box.left < bounds.left - 1;
          })
          .map((cell) => cell.textContent?.trim()),
      );
      expect(clipped, 'cells reaching outside the card').toEqual([]);

      for (const [feature, free, pro] of comparison) {
        const row = page.locator('#pricing tbody tr', { has: page.getByRole('rowheader', { name: feature, exact: true }) });
        for (const value of [free, pro]) {
          if (value === 'Included') await expect(row.locator('.check').first()).toBeVisible();
          else await expect(row.getByText(value, { exact: true })).toBeVisible();
        }
      }
    });

    test('the pricing card and the FAQ do not overflow horizontally', async ({ page }) => {
      await page.locator('#faq').scrollIntoViewIfNeeded();
      expect(await horizontalOverflow(page), 'horizontal overflow in px').toBe(0);
    });

    test('both sections follow the theme toggle into dark', async ({ page }) => {
      const card = page.locator('#pricing .price-card');
      const answer = page.locator('#faq details').first();
      await expect(card).toHaveCSS('background-color', cardBackground.light);
      await expect(answer).toHaveCSS('background-color', cardBackground.light);

      await toggleDark(page);

      await expect(card).toHaveCSS('background-color', cardBackground.dark);
      await expect(answer).toHaveCSS('background-color', cardBackground.dark);
      await expect(page.locator('#pricing .eyebrow')).toHaveCSS('color', tealTextColor.dark);
      await expect(page.locator('#pricing table').getByText('Full timeline')).toBeVisible();
      for (const question of questions) {
        await expect(page.locator('#faq summary', { hasText: question })).toBeVisible();
      }

      expect(await horizontalOverflow(page), 'horizontal overflow in px').toBe(0);
    });
  });
}

/** Reads every answer at once, which means leaving the accordion group so they can all stay open. */
async function expandEveryAnswer(page: Page) {
  for (const item of await page.locator('#faq details').all()) {
    await item.evaluate((el: HTMLDetailsElement) => {
      el.removeAttribute('name');
      el.open = true;
    });
  }
}

test.describe('FAQ', () => {
  test.beforeEach(({ page }) => page.goto('/'));

  test('asks six to eight questions, each a native disclosure', async ({ page }) => {
    const items = page.locator('#faq details');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(6);
    expect(count).toBeLessThanOrEqual(8);
    await expect(items).toHaveCount(questions.length);
    for (const [index, question] of questions.entries()) {
      await expect(items.nth(index).locator('summary')).toHaveText(question);
    }
  });

  test('every answer opens and closes from the keyboard', async ({ page }) => {
    for (const question of questions) {
      const item = page.locator('#faq details', { has: page.locator('summary', { hasText: question }) });
      const wasOpen = await item.evaluate((el: HTMLDetailsElement) => el.open);
      await item.locator('summary').focus();
      await expect(item.locator('summary')).not.toHaveCSS('outline-style', 'none');

      await page.keyboard.press('Enter');
      await expect(item).toHaveJSProperty('open', !wasOpen);
      await expect(item.locator('p')).toBeVisible({ visible: !wasOpen });

      await page.keyboard.press('Enter');
      await expect(item).toHaveJSProperty('open', wasOpen);
    }
  });

  test('opening one answer collapses the one already open', async ({ page }) => {
    const items = page.locator('#faq details');
    await expect(items.first()).toHaveJSProperty('open', true);

    for (const index of [2, 4, 1]) {
      await items.nth(index).locator('summary').click();
      await expect(items.nth(index)).toHaveJSProperty('open', true);

      const open = await items.evaluateAll((els) =>
        els.flatMap((el, i) => ((el as HTMLDetailsElement).open ? [i] : [])),
      );
      expect(open, `only question ${index} stays open`).toEqual([index]);
    }
  });

  test('answers state where the data lives, who can see it, the backup and the advice line', async ({ page }) => {
    await expandEveryAnswer(page);
    const faq = page.locator('#faq');
    await expect(faq.getByText('no servers and no accounts')).toBeVisible();
    await expect(faq.getByText('Gleamit does not add its own encryption.')).toBeVisible();
    await expect(faq.getByText('It is not a medical device')).toBeVisible();
    await expect(faq.getByText('turning backup off in the app leaves it where it is')).toBeVisible();
  });

  test('the answers keep the copy guardrails even when expanded', async ({ page }) => {
    await expandEveryAnswer(page);
    await expectCopyGuardrails(page);
  });
});

for (const [name, id] of [
  ['Pricing', 'pricing'],
  ['FAQ', 'faq'],
] as const) {
  for (const viewport of viewports) {
    test(`the ${name} anchor lands on its section, clear of the sticky nav, at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await expectAnchorClearsNav(page, id);
    });
  }

  test(`the nav ${name} link points at the section`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name, includeHidden: true }).click({ force: true });
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
  });
}
