import { test, expect } from '@playwright/test';
import { GAME_UI_FIXTURE_IDS } from '../src/ui/fixtures/game-ui-fixtures';
import { VISUAL_VIEWPORTS } from '../src/ui/fixtures/visual-test-manifest';
import { openFixture, assertGeometry } from './visual-helpers';

const referenceFixture = 'local-greed-player-x3-pot18';
const chromiumCases = [
  ...VISUAL_VIEWPORTS.map((viewport) => ({ fixtureId: referenceFixture, viewport })),
  ...GAME_UI_FIXTURE_IDS.filter((id) => id !== referenceFixture).map((fixtureId) => ({
    fixtureId,
    viewport: VISUAL_VIEWPORTS.find(({ id }) => id === 'desktop-1440'),
  })),
];
const crossEngineCases = [
  {
    fixtureId: referenceFixture,
    viewport: VISUAL_VIEWPORTS.find(({ id }) => id === 'desktop-1440'),
  },
  {
    fixtureId: 'online-reconnecting',
    viewport: VISUAL_VIEWPORTS.find(({ id }) => id === 'mobile-primary'),
  },
];
const allCases = [
  ...new Map(
    [...chromiumCases, ...crossEngineCases].map((entry) => [
      `${entry.fixtureId}:${entry.viewport.id}`,
      entry,
    ]),
  ).values(),
];

for (const entry of allCases) {
  test(`${entry.fixtureId} -- ${entry.viewport.id}`, async ({ browser }, testInfo) => {
    const isChromium = testInfo.project.name === 'chromium';
    const cases = isChromium ? chromiumCases : crossEngineCases;
    const validCase = cases.some(
      (candidate) =>
        candidate.fixtureId === entry.fixtureId && candidate.viewport.id === entry.viewport.id,
    );
    test.skip(!validCase);
    const context = await browser.newContext({
      viewport: { width: entry.viewport.width, height: entry.viewport.height },
      deviceScaleFactor: entry.viewport.dpr,
      colorScheme: 'dark',
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await openFixture(page, entry.fixtureId);
    await assertGeometry(page, { width: entry.viewport.width });
    await expect(page).toHaveScreenshot(`${entry.fixtureId}--${entry.viewport.id}.png`, {
      animations: 'disabled',
      caret: 'hide',
      threshold: 0.18,
      maxDiffPixelRatio: entry.viewport.dpr === 2 ? 0.0025 : 0.0015,
      fullPage: true,
    });
    await context.close();
  });
}
