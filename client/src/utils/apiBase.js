/**
 * Base URL for API calls (no trailing slash).
 * - If VITE_API_URL is set at build time → use it (split frontend/backend hosts).
 * - Dev (vite): default http://localhost:3001.
 * - Production without VITE_API_URL → same origin as the SPA (single-host deploy, avoids CORS).
 */
export function getApiBase() {
  const raw = import.meta.env.VITE_API_URL;
  const forceSame =
    import.meta.env.PROD &&
    String(import.meta.env.VITE_SAME_ORIGIN_API || '').toLowerCase() === 'true';

  let resolved;
  let branch;

  if (forceSame && typeof window !== 'undefined' && window.location?.origin) {
    resolved = window.location.origin;
    branch = 'force-same-origin-env';
  } else if (raw != null && String(raw).trim() !== '') {
    resolved = String(raw).trim().replace(/\/$/, '');
    branch = 'vite-env';
  } else if (import.meta.env.DEV) {
    resolved = 'http://localhost:3001';
    branch = 'dev-default';
  } else if (typeof window !== 'undefined' && window.location?.origin) {
    resolved = window.location.origin;
    branch = 'prod-same-origin-fallback';
  } else {
    resolved = 'http://localhost:3001';
    branch = 'ssr-fallback';
  }

  // #region agent log
  fetch('http://127.0.0.1:7553/ingest/733d9fd1-9b7d-4324-82db-c4651f3a2a34', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '16e659' },
    body: JSON.stringify({
      sessionId: '16e659',
      hypothesisId: 'H1',
      location: 'apiBase.js:getApiBase',
      message: 'API base resolution',
      data: {
        branch,
        resolved,
        forceSameOriginFlag: forceSame,
        rawViteApiUrl: raw === undefined ? '(undefined)' : String(raw),
        isDev: !!import.meta.env.DEV,
        isProd: !!import.meta.env.PROD,
        pageOrigin: typeof window !== 'undefined' ? window.location?.origin : null,
      },
      timestamp: Date.now(),
      runId: 'post-fix',
    }),
  }).catch(() => {});
  // #endregion

  return resolved;
}
