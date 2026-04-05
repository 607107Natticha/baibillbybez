/**
 * Base URL for API calls (no trailing slash).
 * Production build ใส่ flag ใน index.html (vite plugin) → ใช้ origin เดียวกับหน้าเว็บ แม้มี VITE_API_URL เก่าใน bundle
 * Dev: default http://localhost:3001
 * แยกโดเมน: build ด้วย VITE_SINGLE_HOST_API=false และตั้ง VITE_API_URL
 */
export function getApiBase() {
  const raw = import.meta.env.VITE_API_URL;

  if (
    import.meta.env.PROD &&
    typeof window !== 'undefined' &&
    window.__SABAIBILL_USE_PAGE_ORIGIN_FOR_API__ === true &&
    window.location?.origin
  ) {
    return window.location.origin;
  }

  const forceSameEnv =
    import.meta.env.PROD &&
    String(import.meta.env.VITE_SAME_ORIGIN_API || '').toLowerCase() === 'true';
  if (forceSameEnv && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

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
