/**
 * Base URL for API calls (no trailing slash).
 * - If VITE_API_URL is set at build time → use it (split frontend/backend hosts).
 * - Dev (vite): default http://localhost:3001.
 * - Production without VITE_API_URL → same origin as the SPA (single-host deploy, avoids CORS).
 */
export function getApiBase() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).trim().replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:3001';
}
