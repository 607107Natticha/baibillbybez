/**
 * Quick smoke test for SabaiBill (dev or production server).
 * Usage: SMOKE_BASE_URL=https://your-demo.example.com npm run smoke
 * Default: http://127.0.0.1:3001
 */
const base = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');

async function main() {
  const rootRes = await fetch(`${base}/`);
  if (!rootRes.ok) {
    throw new Error(`GET / expected 2xx, got ${rootRes.status}`);
  }
  const rootText = await rootRes.text();
  const looksLikeSpa =
    rootText.includes('<!DOCTYPE') ||
    rootText.includes('<html') ||
    rootText.includes('id="root"');
  const looksLikeApiDev = rootText.includes('Sabaibill API');
  if (!looksLikeSpa && !looksLikeApiDev) {
    throw new Error('GET / body did not look like SPA or dev API landing');
  }

  const email = `smoke_${Date.now()}@sabaibill.local`;
  const pin = '123456';
  const regRes = await fetch(`${base}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pin, confirmPin: pin }),
  });
  if (!regRes.ok) {
    const errBody = await regRes.text();
    throw new Error(`POST /api/register expected 2xx, got ${regRes.status}: ${errBody}`);
  }
  const regJson = await regRes.json();
  if (!regJson.token) {
    throw new Error('POST /api/register missing token in JSON body');
  }

  console.log(`Smoke OK against ${base} (mode: ${looksLikeSpa ? 'production SPA or similar' : 'dev API'})`);
}

main().catch((e) => {
  console.error('Smoke failed:', e.message);
  process.exit(1);
});
