# Frontend–Backend API Mapping (Sabaibill)

Base URL ฝั่ง Frontend: `import.meta.env.VITE_API_URL || 'http://localhost:3001'`  
CORS ฝั่ง Backend: `process.env.FRONTEND_URL || 'http://localhost:5173'`

---

## ตาราง Mapping: หน้า/คอมโพเนนต์ → Endpoint

| หน้า/คอมโพเนนต์ | Method | Endpoint | ใช้ทำอะไร |
|-----------------|--------|----------|-----------|
| **EntryPage** | GET | `/api/onboarding-status` | เช็ค `isOnboarded` แล้วไป `/onboarding` หรือ `/dashboard` (ไม่ใช้ token) |
| **OnboardingPage** | POST | `/api/onboarding/complete` | บันทึกข้อมูลบริษัท/โลโก้หลัง onboard ครั้งแรก |
| **DashboardPage** | GET | `/api/documents` | ดึงรายการเอกสาร |
| **DashboardPage** | GET | `/api/settings` | ดึงชื่อบริษัทมาแสดงใน header |
| **DocumentHistoryPage** | GET | `/api/documents` | ดึงรายการเอกสาร (ประวัติ) |
| **PreviewDocument** | GET | `/api/documents/:id` | ดึงรายละเอียดเอกสาร |
| **PreviewDocument** | GET | `/api/settings` | ดึง settings สำหรับ theme/โลโก้/ layout |
| **PreviewDocument** | PUT | `/api/documents/:id/status` | อัปเดตสถานะเอกสาร |
| **SettingsPage** | GET | `/api/settings` | ดึงการตั้งค่าบริษัท/ธนาคาร/เทมเพลต |
| **SettingsPage** | PUT | `/api/settings` | บันทึกการตั้งค่า (รวม logoImage, templateTheme, templateLayout) |
| **CreateDocumentPage** | GET | `/api/search?type=...&q=...` | ค้นหา master data (ลูกค้า/สินค้า) |
| **CreateDocumentPage** | GET | `/api/settings` | ดึง settings สำหรับสร้างเอกสาร |
| **CreateDocumentPage** | GET | `/api/products/popular` | ดึงสินค้ายอดนิยม |
| **CreateDocumentPage** | POST | `/api/documents` | สร้างเอกสารใหม่ |
| **CreateDocumentPage** | POST | `/api/customers` | สร้างลูกค้าใหม่ (จากฟอร์ม) |
| **CustomersPage** | GET | `/api/customers` | ดึงรายการลูกค้า |
| **CustomersPage** | PUT | `/api/customers/:id` | แก้ไขลูกค้า |
| **CustomersPage** | POST | `/api/customers` | สร้างลูกค้า |
| **CustomersPage** | DELETE | `/api/customers/:id` | ลบลูกค้า |

---

## Endpoint ใน Backend ที่ Frontend ยังไม่เรียก

(ไม่มีรายการจากตารางหลัก — ปรับ mapping เมื่อเพิ่มหน้าใหม่)

---

## Schema ที่ต้องสอดคล้องกัน

- **Settings**: Frontend ส่ง/รับ `companyName`, `companyNameEn`, `address`, `addressEn`, `country`, `postalCode`, `taxId`, `phone`, `logoImage`, `templateTheme`, `templateLayout`, `fontFamily`, ข้อมูลธนาคาร (`bankName`, `customBankName`, `customBankLogo`, `bankAccountName`, `bankAccountNumber`), ข้อความเงื่อนไข (`condQT`, `condSO`, `condDO`, `condIV`) — ควรตรงกับที่ Backend (Prisma/settingsController) บันทึกและส่งคืน
- **Documents**: รูปแบบเอกสาร (type, no, date, items, customer, total, status ฯลฯ) ต้องตรงกับที่ documentController และ documentRoutes ใช้
- **Auth / ผู้ใช้**: ฝั่ง API ใช้ `singletonUserMiddleware` — สร้าง/เลือกผู้ใช้คนเดียวใน DB แล้วตั้ง `req.userId` โดยไม่ต้องส่ง `Authorization` จากเบราว์เซอร์ (เหมาะ demo ส่วนตัวเท่านั้น)

---

## การเชื่อมกันโดยรวม

Frontend กับ Backend ทำงานร่วมกันผ่านชุด endpoint ด้านบน โดย Frontend ใช้ `axios` โดยไม่แนบ Bearer token; Backend ใช้ `singletonUserMiddleware` บน route ที่เคยต้อง login และส่ง CORS อนุญาตจาก `FRONTEND_URL`/`http://localhost:5173`
