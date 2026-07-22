import { expect } from '@playwright/test';

export async function openFixture(page, fixtureId) {
  const unexpectedRequests = [];
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') {
      unexpectedRequests.push(url.href);
      await route.abort();
      return;
    }
    await route.continue();
  });
  await page.goto(`visual.html?fixture=${encodeURIComponent(fixtureId)}`);
  await page.locator('[data-visual-ready="true"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('500 16px "Noto Sans SC"'))).toBe(true);
  expect(unexpectedRequests).toEqual([]);
}

export async function assertGeometry(page, { width }) {
  const shell = page.locator('.gs-shell');
  const shellBox = await shell.boundingBox();
  expect(shellBox).toBeTruthy();
  expect(shellBox.x).toBeGreaterThanOrEqual(0);
  expect(shellBox.x + shellBox.width).toBeLessThanOrEqual(width);
  const cells = page.locator('.gs-cell');
  await expect(cells).toHaveCount(256);
  const cellBox = await cells.first().boundingBox();
  expect(cellBox.width).toBeGreaterThanOrEqual(width < 768 ? 44 : 36);
  if (width < 768) expect(cellBox.width).toBe(44);
}
