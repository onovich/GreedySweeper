export const VISUAL_TEST_ENVIRONMENT = Object.freeze({
  schemaVersion: 1,
  locale: 'zh-CN',
  timezone: 'Asia/Shanghai',
  colorScheme: 'dark',
  reducedMotion: 'reduce',
  network: 'local-only',
  primaryBrowser: 'playwright-chromium-pinned',
  referenceViewport: 'desktop-1920',
});

export const VISUAL_VIEWPORTS = Object.freeze([
  { id: 'desktop-1920', width: 1920, height: 1080, dpr: 1 },
  { id: 'desktop-1440', width: 1440, height: 900, dpr: 1 },
  { id: 'tablet-landscape', width: 1180, height: 820, dpr: 1 },
  { id: 'tablet-portrait', width: 820, height: 1180, dpr: 1 },
  { id: 'mobile-primary', width: 390, height: 844, dpr: 2 },
  { id: 'mobile-narrow', width: 360, height: 800, dpr: 2 },
]);
