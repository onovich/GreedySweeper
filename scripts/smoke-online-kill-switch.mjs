const endpoint = requiredHttpsOrigin(process.env.PREVIEW_ENDPOINT);
const REQUEST_TIMEOUT_MS = 20_000;

function requiredHttpsOrigin(value) {
  if (!value) throw new Error('Missing Preview endpoint');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
    throw new Error('Preview endpoint must be a clean HTTPS origin');
  return url;
}

try {
  const health = await fetch(new URL('/health', endpoint), {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!health.ok) throw new Error('Kill-switch health request failed');
  const response = await fetch(new URL('/v1/rooms', endpoint), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ruleset: 'classic-v1' }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = await response.json();
  if (response.status !== 503 || body?.error?.code !== 'online_disabled')
    throw new Error('New-room kill switch did not reject creation');
  console.log('Kill-switch smoke PASS: health remains available and new rooms are blocked.');
} catch (error) {
  const reason = error instanceof Error ? error.message : 'unknown error';
  console.error(`Kill-switch smoke failed: ${reason}`);
  process.exitCode = 1;
}
