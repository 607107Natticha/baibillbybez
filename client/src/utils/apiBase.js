/**
 * Base URL for API calls (no trailing slash).
 * Production ค่าเริ่มต้น: origin เดียวกับหน้าเว็บ — กันค่า VITE_API_URL เก่าที่ติดใน bundle (เช่น billbybz) จนเกิด CORS
 * แยกโดเมน SPA/API: build ด้วย VITE_SINGLE_HOST_API=false และตั้ง VITE_API_URL + CORS บน backend
 * Dev: ใช้ VITE_API_URL ถ้ามี ไม่มีใช้ http://localhost:3001
 */
export function getApiBase() {
  const raw = import.meta.env.VITE_API_URL;
  const splitHosts =
    String(import.meta.env.VITE_SINGLE_HOST_API || '').toLowerCase() === 'false';
  const forceSame =
    import.meta.env.PROD &&
    String(import.meta.env.VITE_SAME_ORIGIN_API || '').toLowerCase() === 'true';

  if (forceSame && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  if (splitHosts) {
    const trimmed = raw != null ? String(raw).trim() : '';
    if (trimmed !== '') return trimmed.replace(/\/$/, '');
  } else if (
    import.meta.env.PROD &&
    typeof window !== 'undefined' &&
    window.location?.origin
  ) {
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
