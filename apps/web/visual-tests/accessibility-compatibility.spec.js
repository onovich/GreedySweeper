import { test, expect } from '@playwright/test';
import { openFixture } from './visual-helpers';

test.describe('integrated Lunar Console accessibility and compatibility', () => {
  test('exposes landmarks, live status, labels, and one keyboard grid stop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openFixture(page, 'local-greed-player-x3-pot18');

    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: '工具栏' })).toHaveCount(1);
    await expect(page.locator('[aria-live="polite"]')).not.toHaveCount(0);
    await expect(page.getByRole('grid')).toHaveAttribute('aria-rowcount', '16');
    await expect(page.getByRole('grid')).toHaveAttribute('aria-colcount', '16');
    await expect(page.locator('.gs-cell[tabindex="0"]')).toHaveCount(1);
    await expect(page.locator('.gs-cell[tabindex="-1"]')).toHaveCount(255);
  });

  test('supports roving keyboard focus and keyboard flag intent', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openFixture(page, 'local-greed-player-x3-pot18');
    const activeCell = page.locator('.gs-cell[tabindex="0"]');
    await activeCell.focus();
    const startColumn = Number(await activeCell.getAttribute('data-column'));
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.gs-cell:focus')).toHaveAttribute(
      'data-column',
      String(startColumn + 1),
    );
    await page.keyboard.press('End');
    await expect(page.locator('.gs-cell:focus')).toHaveAttribute('data-column', '15');
    await page.keyboard.press('Control+Home');
    await expect(page.locator('.gs-cell:focus')).toHaveAttribute('data-row', '0');
    await expect(page.locator('.gs-cell:focus')).toHaveAttribute('data-column', '0');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.gs-cell:focus')).toHaveAttribute('data-row', '2');
    await page.keyboard.press('f');
    await expect(page.locator('[data-last-intent]')).toHaveAttribute('data-last-intent', 'flag');
  });

  test('keeps touch targets and primary content usable in compact and 200% layouts', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFixture(page, 'online-reconnecting');
    const cellBox = await page.locator('.gs-cell').first().boundingBox();
    expect(cellBox.width).toBeGreaterThanOrEqual(44);
    expect(cellBox.height).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole('grid')).toBeVisible();
    await expect(page.getByRole('navigation', { name: '工具栏' })).toBeVisible();

    await page.setViewportSize({ width: 720, height: 900 });
    await openFixture(page, 'long-copy-stress');
    await expect(page.getByRole('grid')).toBeVisible();
    const documentWidth = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(documentWidth.scroll).toBeLessThanOrEqual(documentWidth.client);
  });

  test('honors reduced motion for the confirmed Bank path', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await openFixture(page, 'local-greed-bank-confirmed-start');
    const duration = await page
      .locator('.gs-reward-circuit')
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).animationDuration));
    expect(duration).toBeLessThanOrEqual(0.1);
    await context.close();
  });
});
