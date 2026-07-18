import { spawn } from 'node:child_process';

const PUBLIC_SITE_URL = requiredHttpsOrigin(process.env.PUBLIC_SITE_URL, 'public site URL');
const PREVIEW_ENDPOINT = requiredHttpsOrigin(process.env.PREVIEW_ENDPOINT, 'Worker endpoint');
const REQUEST_TIMEOUT_MS = 20_000;

function requiredHttpsOrigin(value, label) {
  if (!value) throw new Error(`Missing ${label}`);
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error(`${label} must be a clean HTTPS URL`);
  }
  return url;
}

async function fetchText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new Error('Public Pages request failed');
  return response.text();
}

async function verifyPublishedUi() {
  const html = await fetchText(PUBLIC_SITE_URL);
  if (!html.includes('id="root"')) throw new Error('Public Pages root is missing');
  const assets = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((match) => match[1]);
  if (!assets.length) throw new Error('Public Pages JavaScript asset is missing');
  const bundles = await Promise.all(
    assets.map((asset) => fetchText(new URL(asset, PUBLIC_SITE_URL))),
  );
  if (!bundles.some((bundle) => bundle.includes(PREVIEW_ENDPOINT.origin)))
    throw new Error('Public Pages build does not contain the approved Worker origin');
  if (!bundles.some((bundle) => bundle.includes('Private online room')))
    throw new Error('Public Pages online UI is missing');
}

async function runWorkerSmoke() {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/smoke-preview.mjs'], {
      env: { ...process.env, PREVIEW_ENDPOINT: PREVIEW_ENDPOINT.origin },
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error('Public Worker smoke failed'));
    });
  });
}

try {
  await verifyPublishedUi();
  await runWorkerSmoke();
  console.log('Free beta smoke PASS: public Pages UI and two-client HTTPS/WSS flow verified.');
} catch (error) {
  const reason = error instanceof Error ? error.message : 'unknown error';
  console.error(`Free beta smoke failed: ${reason}`);
  process.exitCode = 1;
}
