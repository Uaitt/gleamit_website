import { test, expect, type Page } from '@playwright/test';
import { expectAnchorClearsNav, horizontalOverflow, open, toggleDark, viewports } from './matrix';
import { cardBackground, tealText, tealTextColor } from './theme';

const features = [
  { title: 'Your whole day in one tab', shot: /home\./ },
  { title: 'A 32-tooth map that is yours', shot: /teeth/ },
  { title: '2-minute timer', shot: /timer/ },
  { title: 'Brushing and floss streaks', shot: /streak/ },
  { title: 'Dentist, appointments and documents', shot: /dentist/ },
  { title: 'Smile photos', shot: /smile/ },
  { title: 'Brushes and heads', shot: /brushes/ },
  { title: 'Dark mode, out of the box', shot: /home_dark/ },
];
const privacyPoints = ['No server, no account', 'Backup only to your own cloud', 'Export a full zip anytime, free'];

const card = (page: Page, title: string) =>
  page.locator('#features .feature', { has: page.getByRole('button', { name: title }) });
const slides = (page: Page) => page.locator('#features .slide');

/** The feature whose phone is showing; exactly one at any time, and every card keeps its copy. */
async function expectOnlyOpen(page: Page, index: number) {
  const { title, shot } = features[index];
  await expect(page.locator('#features .feature.is-open')).toHaveCount(1);
  await expect(card(page, title)).toHaveClass(/is-open/);
  await expect(card(page, title).getByRole('button')).toHaveAttribute('aria-expanded', 'true');

  await expect(page.locator('#features .slide.on')).toHaveCount(1);
  await expect(slides(page).nth(index)).toHaveClass(/on/);
  await expect(slides(page).nth(index).locator('img')).toHaveAttribute('src', shot);

  for (const [other, feature] of features.entries()) {
    if (other === index) continue;
    await expect(card(page, feature.title).getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    await expect(slides(page).nth(other).locator('img')).not.toBeVisible();
  }
  for (const { title: each } of features) {
    await expect(card(page, each).locator('.text')).toBeVisible();
  }
}

for (const viewport of viewports) {
  test.describe(`features at ${viewport.width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page, viewport);
      await page.locator('#features').scrollIntoViewIfNeeded();
    });

    test('the deck lists all eight features, each with an icon, a button and its copy', async ({ page }) => {
      const deck = page.locator('#features .deck');
      await expect(deck.locator('.feature')).toHaveCount(features.length);
      for (const { title } of features) {
        const head = deck.getByRole('button', { name: title });
        await expect(head).toBeVisible();
        await expect(head.locator('.ico svg')).toBeVisible();
        await expect(card(page, title).locator('.text')).toBeVisible();
      }
    });

    test('the Home tab is open by default and is the only phone showing', async ({ page }) => {
      await expectOnlyOpen(page, 0);
    });

    test('clicking a feature moves the open card and swaps the phone to its shot', async ({ page }) => {
      for (const [index, { title }] of features.entries()) {
        await card(page, title).getByRole('button').click();
        await expectOnlyOpen(page, index);
      }
    });

    test('tabbing through the heads moves the open feature along', async ({ page }) => {
      await card(page, features[0].title).getByRole('button').focus();
      for (const [index, { title }] of features.entries()) {
        if (index === 0) continue;
        await page.keyboard.press('Tab');
        await expect(card(page, title).getByRole('button')).toBeFocused();
        await expectOnlyOpen(page, index);
      }
    });

    test('the privacy band closes the section with its three points and a phone', async ({ page }) => {
      const band = page.locator('#privacy-band');
      await expect(band.getByRole('heading', { name: 'Nothing leaves your phone unless you send it' })).toBeVisible();
      for (const point of privacyPoints) {
        await expect(band.getByText(point, { exact: true })).toBeVisible();
      }
      await expect(band.locator('.phone img')).toHaveAttribute('src', /data-backup/);
      await expect(band.getByRole('link', { name: 'Read the privacy policy' })).toHaveAttribute('href', '/privacy');
    });

    test('neither section overflows horizontally', async ({ page }) => {
      await card(page, features[7].title).getByRole('button').click();
      await page.locator('#privacy-band').scrollIntoViewIfNeeded();
      expect(await horizontalOverflow(page), 'horizontal overflow in px').toBe(0);
    });

    test('both sections follow the theme toggle into dark', async ({ page }) => {
      const first = page.locator('#features .feature').first();
      await expect(first).toHaveCSS('background-color', cardBackground.light);

      await toggleDark(page);

      await expect(first).toHaveCSS('background-color', cardBackground.dark);
      const teal = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--teal-text').trim());
      expect(teal).toBe(tealText.dark);

      for (const { title } of features) {
        await expect(page.locator('#features').getByRole('button', { name: title })).toBeVisible();
      }
      const band = page.locator('#privacy-band');
      await expect(band.locator('.eyebrow')).toHaveCSS('color', tealTextColor.dark);
      await expect(band.locator('.phone img')).toBeVisible();

      await band.scrollIntoViewIfNeeded();
      expect(await horizontalOverflow(page), 'horizontal overflow in px').toBe(0);
    });
  });
}

test.describe('the deck on a desktop with a mouse', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, viewports[1]);
    await page.locator('#features').scrollIntoViewIfNeeded();
  });

  test('the cards stack in one column beside the pinned phone, and hold no phone themselves', async ({ page }) => {
    const boxes = await Promise.all(features.map(({ title }) => card(page, title).boundingBox()));
    const stage = (await page.locator('#features .stage').boundingBox())!;

    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i]!.y, `card ${i} sits under card ${i - 1}`).toBeGreaterThan(boxes[i - 1]!.y);
      expect(Math.abs(boxes[i]!.width - boxes[0]!.width), 'the cards share a width').toBeLessThanOrEqual(1);
      expect(boxes[i]!.x + boxes[i]!.width, `card ${i} clears the phone`).toBeLessThanOrEqual(stage.x);
    }
    await expect(page.locator('#features .feature .art .phone').first()).not.toBeVisible();
  });

  test('hovering a card opens it and the phone stays pinned while the list scrolls', async ({ page }) => {
    await card(page, features[4].title).hover();
    await expectOnlyOpen(page, 4);

    await card(page, features[7].title).hover();
    await expectOnlyOpen(page, 7);
    await expect(page.locator('#features .stack')).toBeInViewport();

    await page.mouse.move(5, 5);
    await expectOnlyOpen(page, 7);
  });

  test('the pinned phone keeps its full height and never runs under the sticky nav', async ({ page }) => {
    await card(page, features[3].title).getByRole('button').click();
    const slide = (await slides(page).nth(3).boundingBox())!;
    const navBottom = await page.locator('nav[aria-label="Main"]').evaluate((el) => el.getBoundingClientRect().bottom);

    expect(slide.width, 'the phone keeps its size').toBeGreaterThanOrEqual(280);
    expect(slide.height / slide.width, 'the phone is not cropped').toBeGreaterThan(2);
    expect(slide.y, 'the top of the phone clears the nav').toBeGreaterThanOrEqual(navBottom);
  });
});

test.describe('the deck on a phone', () => {
  test.use({ hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, viewports[0]);
    await page.locator('#features').scrollIntoViewIfNeeded();
  });

  test('the pinned phone gives way to an accordion: the open card holds its own phone', async ({ page }) => {
    await expect(page.locator('#features .stage')).not.toBeVisible();

    const boxes = await Promise.all(features.map(({ title }) => card(page, title).boundingBox()));
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i]!.y, `card ${i} sits under card ${i - 1}`).toBeGreaterThan(boxes[i - 1]!.y + boxes[i - 1]!.height);
      expect(boxes[i]!.height, `closed card ${i} is compact`).toBeLessThan(260);
    }
    expect(boxes[0]!.height, 'the open card holds the phone').toBeGreaterThan(boxes[1]!.height + 300);
    await expect(card(page, features[0].title).locator('.art .phone img')).toBeVisible();

    await card(page, features[4].title).getByRole('button').tap();
    await expect(card(page, features[4].title).locator('.art .phone img')).toHaveAttribute('src', features[4].shot);
    await expect(card(page, features[0].title).locator('.art .phone')).not.toBeVisible();
    expect((await card(page, features[4].title).boundingBox())!.height).toBeGreaterThan(400);
    expect((await card(page, features[0].title).boundingBox())!.height).toBeLessThan(260);
  });
});

test('the nav Features link points at the feature deck', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation').getByRole('link', { name: 'Features' }).click();
  await expect(page).toHaveURL(/#features$/);
});

for (const viewport of viewports) {
  test(`the Features anchor lands on the deck, clear of the sticky nav, at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await expectAnchorClearsNav(page, 'features');
  });
}

test('every screenshot in the feature and privacy sections has alt text', async ({ page }) => {
  await page.goto('/');
  const images = page.locator('#features img, #privacy-band img');
  expect(await images.count()).toBeGreaterThan(0);
  for (const img of await images.all()) {
    await expect(img).toHaveAttribute('alt', /\S+(\s+\S+){3,}/);
  }
});

test('without JavaScript the first feature is open and every head is still readable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: viewports[1] });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#features .feature.is-open')).toHaveCount(1);
  await expect(page.locator('#features .slide.on img')).toBeVisible();
  for (const { title } of features) {
    await expect(page.locator('#features').getByRole('button', { name: title })).toBeVisible();
  }
  await context.close();
});

test.describe('scroll reveal', () => {
  test('sections below the fold reveal once they are scrolled into view', async ({ page }) => {
    await page.goto('/');
    const deck = page.locator('#features .deck');
    await expect(deck).toHaveCSS('opacity', '0');
    await deck.scrollIntoViewIfNeeded();
    await expect(deck).toHaveCSS('opacity', '1');
  });

  test('content is visible immediately and nothing animates under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    for (const target of ['#features .deck', '#privacy-band .art']) {
      for (const element of await page.locator(target).all()) {
        await expect(element).toHaveCSS('opacity', '1');
        await expect(element).toHaveCSS('transform', 'none');
      }
    }
    await expect(page.locator('html')).not.toHaveClass(/reveal-on-scroll/);
  });

  test('turning on reduced motion after load reveals whatever is still hidden', async ({ page }) => {
    await page.goto('/');
    const deck = page.locator('#features .deck');
    await expect(deck).toHaveCSS('opacity', '0');

    await page.emulateMedia({ reducedMotion: 'reduce' });

    await expect(deck).toHaveCSS('opacity', '1');
    await expect(deck).toHaveCSS('transform', 'none');
  });

  test('content is visible without the reveal script', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#features .deck')).toHaveCSS('opacity', '1');
    await context.close();
  });
});
