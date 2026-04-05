/**
 * ศูนย์กลาง theme สีสำหรับเอกสาร (TemplatePreview, PreviewDocument)
 * และค่าสีแบรนด์ที่ใช้ร่วมกับ Tailwind ได้
 */

export const THEME_COLORS = {
  blue: { primary: '#1E40AF', secondary: '#3B82F6', light: '#DBEAFE' },
  green: { primary: '#047857', secondary: '#10B981', light: '#D1FAE5' },
  pink: { primary: '#DB2777', secondary: '#F472B6', light: '#FCE7F3' },
  black: { primary: '#1F2937', secondary: '#4B5563', light: '#F3F4F6' },
  red: { primary: '#DC2626', secondary: '#EF4444', light: '#FEE2E2' },
  yellow: { primary: '#D97706', secondary: '#F59E0B', light: '#FEF3C7' },
};

/** คีย์ theme ที่ใช้ใน settings.templateTheme */
export const THEME_KEYS = Object.keys(THEME_COLORS);
