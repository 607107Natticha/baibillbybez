/**
 * แปลงตัวเลขเป็นตัวหนังสือภาษาไทย (บาท/สตางค์)
 * ใช้แสดงในเอกสารทางการเงิน เช่น (หนึ่งพันสองร้อยบาทถ้วน)
 */

const DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const TENS = ['', 'สิบ', 'ยี่สิบ', 'สามสิบ', 'สี่สิบ', 'ห้าสิบ', 'หกสิบ', 'เจ็ดสิบ', 'แปดสิบ', 'เก้าสิบ'];
const SCALES = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function convertGroup(num) {
  if (num === 0) return '';
  const n = Math.floor(num);
  if (n < 10) return DIGITS[n];
  if (n < 20) return n === 10 ? 'สิบ' : 'สิบ' + (n === 11 ? 'เอ็ด' : DIGITS[n - 10]);
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const one = n % 10;
    return TENS[ten] + (one === 1 ? 'เอ็ด' : one === 0 ? '' : DIGITS[one]);
  }
  if (n < 1000) {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return DIGITS[hundred] + 'ร้อย' + (rest === 0 ? '' : convertGroup(rest));
  }
  if (n < 10000) {
    const thousand = Math.floor(n / 1000);
    const rest = n % 1000;
    return DIGITS[thousand] + 'พัน' + (rest === 0 ? '' : convertGroup(rest));
  }
  if (n < 100000) {
    const tenk = Math.floor(n / 10000);
    const rest = n % 10000;
    return (tenk === 1 ? 'หนึ่ง' : DIGITS[tenk]) + 'หมื่น' + (rest === 0 ? '' : convertGroup(rest));
  }
  if (n < 1000000) {
    const hundredk = Math.floor(n / 100000);
    const rest = n % 100000;
    return (hundredk === 1 ? 'หนึ่ง' : DIGITS[hundredk]) + 'แสน' + (rest === 0 ? '' : convertGroup(rest));
  }
  if (n < 1000000000000) {
    const million = Math.floor(n / 1000000);
    const rest = n % 1000000;
    return convertGroup(million) + 'ล้าน' + (rest === 0 ? '' : convertGroup(rest));
  }
  return '';
}

/**
 * แปลงจำนวนเงินเป็นตัวหนังสือบาทไทย
 * @param {number} amount - จำนวนเงิน (บาท.สตางค์)
 * @returns {string} ตัวหนังสือ เช่น "หนึ่งพันสองร้อยบาทถ้วน" หรือ "หนึ่งพันบาทห้าสิบสตางค์"
 */
export function numberToThaiBahtText(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num < 0) return 'ศูนย์บาทถ้วน';
  const intPart = Math.floor(num);
  const decimalPart = Math.round((num - intPart) * 100);
  const bahtText = intPart === 0 ? 'ศูนย์' : convertGroup(intPart);
  if (decimalPart === 0) {
    return bahtText + 'บาทถ้วน';
  }
  const satangText = convertGroup(decimalPart);
  return bahtText + 'บาท' + satangText + 'สตางค์';
}
