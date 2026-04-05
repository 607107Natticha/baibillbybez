# คู่มือ Style และ UI — Sabaibill

เอกสารนี้อธิบายว่า **ไฟล์ไหนใช้ปรับ UI/สไตล์** และเชื่อมกันอย่างไร

---

## 1. ชั้น Global (ทั้งเว็บ)

| ไฟล์ | หน้าที่ |
|------|--------|
| **`client/index.html`** | โครง HTML หลัก, โหลดฟอนต์ (Sarabun, Noto Sans Thai), favicon, meta, title. ปรับฟอนต์หรือ favicon ให้แก้ที่นี่ |
| **`client/src/index.css`** | Tailwind (`@tailwind base/components/utilities`) + สไตล์ global (ขนาดฟอนต์ body, placeholder, print สำหรับ A4). ปรับพื้นหลังทั้งเว็บ/พิมพ์ ให้แก้ที่นี่ |
| **`client/tailwind.config.js`** | ค่า theme ของ Tailwind: สี, spacing, fontFamily, breakpoint. ปรับสีแบรนด์หรือตัวแปรร่วม ให้เพิ่มใน `theme.extend` |

---

## 2. สไตล์ระดับหน้า/คอมโพเนนต์

ส่วนใหญ่ใช้ **Tailwind utility class ใน JSX** โดยตรง:

| ไฟล์ | หน้าที่ |
|------|--------|
| **`client/src/pages/DashboardPage.jsx`** | Navbar บน, sidebar, การ์ดหน้าหลัก |
| **`client/src/pages/SettingsPage.jsx`** | Navbar หน้า settings, ฟอร์มตั้งค่าบริษัท/ธนาคาร/เทมเพลต |
| **`client/src/pages/OnboardingPage.jsx`** | ฟอร์มเริ่มต้น, โลโก้บริษัทครั้งแรก |
| **`client/src/components/TemplatePreview.jsx`** | Preview เทมเพลตเอกสาร (classic/modern/minimal/compact/professional), ใช้ theme + layout |
| **`client/src/pages/PreviewDocument.jsx`** | แสดงเอกสารจริง/ก่อนพิมพ์, layout หลายแบบ, print styles |

สำหรับ **สี theme ของเอกสาร** (primary, secondary, light) ใช้ค่าจาก **`client/src/styles/theme.js`** (THEME_COLORS) แล้วอ้างใน TemplatePreview และ PreviewDocument ให้สอดคล้องกัน

---

## 3. ไฟล์ CSS อื่น

| ไฟล์ | หน้าที่ |
|------|--------|
| **`client/src/App.css`** | สไตล์เหลือจาก Vite starter (เช่น .logo, animation). ใช้เฉพาะส่วนที่ยังถูก import/ใช้อยู่ |

---

## 4. การเชื่อมกัน

```
index.html (favicon, fonts)
    ↓
main.jsx → โหลด index.css (Tailwind + global)
    ↓
tailwind.config.js → สร้าง utility classes
    ↓
styles/theme.js → สี/ค่าสำหรับเอกสาร (TemplatePreview, PreviewDocument)
    ↓
แต่ละหน้า (DashboardPage, SettingsPage, …) ใช้ class จาก Tailwind + ค่า theme
```

- **ปรับสี/ฟอนต์ทั้งเว็บ**: `tailwind.config.js` + `index.css` + `index.html`
- **ปรับเฉพาะหน้า**: แก้ในไฟล์ page/component นั้น (Tailwind ใน JSX)
- **ปรับ theme เอกสาร (ใบเสนอราคา/ใบแจ้งหนี้)**: `styles/theme.js` แล้วให้ TemplatePreview + PreviewDocument อ้างอิงไฟล์นี้

---

## 5. โลโก้เว็บ (logo.png)

- **ตำแหน่งไฟล์**: วางไฟล์ `logo.png` ที่ **`client/public/logo.png`** จะถูกใช้เป็น favicon และโลโก้ใน navbar (Dashboard, Settings) และเป็นค่าเริ่มต้นในเอกสารเมื่อยังไม่ได้อัปโหลดโลโก้บริษัท
- **การเชื่อม**: Favicon ตั้งใน `index.html`; navbar ใช้ `<img src="/logo.png" />`; TemplatePreview และ PreviewDocument ใช้ `settings?.logoImage || '/logo.png'` เป็น fallback
