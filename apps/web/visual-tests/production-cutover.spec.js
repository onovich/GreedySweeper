import { test, expect } from '@playwright/test';

test('production entry renders one shared Lunar Console and retains local room access', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('./');
  await page.getByRole('grid').waitFor();
  await page.evaluate(() => document.fonts.ready);

  await expect(page.locator('.gs-shell')).toHaveCount(1);
  await expect(page.locator('.game-shell')).toHaveCount(0);
  await expect(page.getByRole('grid')).toHaveAttribute('aria-rowcount', '16');
  await page.getByRole('button', { name: /房间/ }).click();
  await expect(page.getByRole('heading', { name: '房间' })).toBeVisible();
  await expect(page.getByText('联机不可用')).toBeVisible();
  await expect(page.getByRole('grid')).toBeVisible();
});
