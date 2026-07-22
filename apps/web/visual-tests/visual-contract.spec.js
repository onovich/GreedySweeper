import { test, expect } from '@playwright/test';
import { GAME_UI_FIXTURE_IDS } from '../src/ui/fixtures/game-ui-fixtures';
import { openFixture, assertGeometry } from './visual-helpers';

test.describe('deterministic Lunar Console visual contract', () => {
  for (const fixtureId of GAME_UI_FIXTURE_IDS) {
    test(`${fixtureId} is network-free and structurally ready`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== 'chromium' && fixtureId !== 'local-greed-player-x3-pot18',
      );
      await page.setViewportSize({ width: 1440, height: 900 });
      await openFixture(page, fixtureId);
      await expect(page.locator('[data-fixture-id]')).toHaveAttribute('data-fixture-id', fixtureId);
      await assertGeometry(page, { width: 1440 });
      await expect(page.locator('[style]')).toHaveCount(0);
    });
  }
});
