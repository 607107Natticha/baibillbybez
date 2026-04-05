# SabaiBill — ระบบออกเอกสารใบเสนอราคา/ใบสั่งขาย/ใบส่งของ/ใบแจ้งหนี้

## Live demo / กรรมการ

- **URL ทดลอง:** _(ใส่หลัง deploy — ตัวอย่าง `https://sabai-bill.onrender.com`)_
- **ที่เก็บโค้ด (GitHub):** _(ใส่ลิงก์ repository หลัง push — ดูคำสั่งด้านล่าง)_

**Push ขึ้น GitHub (ครั้งแรก):** สร้าง repository ว่างบน GitHub (ไม่ต้องติ๊ก README) แล้วรันที่โฟลเดอร์โปรเจกต์:

```bash
git config --global --add safe.directory D:/sabaibill
git remote add origin https://github.com/<USER>/<REPO>.git
git push -u origin main
```

ถ้าเครื่องติดตั้ง [GitHub CLI](https://cli.github.com/) แล้ว login แล้ว สามารถใช้ `gh repo create <REPO> --private --source=. --remote=origin --push` แทนได้
- **ลำดับทดลอง:** เปิด URL → สมัครสมาชิก (email + PIN 6 หลัก) → กรอก onboarding ข้อมูลบริษัท → สร้างเอกสาร (QT/SO/DO/IV) → ลองพิมพ์หรือบันทึก PDF จากหน้า Preview
- **ข้อจำกัด:** SQLite บนแพลตฟอร์มที่ดิสก์ไม่ถาวร อาจรีเซ็ตข้อมูลเมื่อ redeploy — ถ้าต้องการเก็บถาวร ให้ใช้ Persistent Disk หรือ DB แบบ hosted (ดู [DEPLOY.md](./DEPLOY.md))  
- **Google Login:** ใช้ได้เมื่อตั้งค่า OAuth ใน Google Cloud ให้ตรง **Authorized JavaScript origins** และ redirect ของ URL จริง — ถ้ายังไม่ตั้ง ให้ใช้การเข้าสู่ระบบด้วย email + PIN

รายละเอียด deploy แบบโฮสต์เดียว / Render Blueprint — ดู [DEPLOY.md](./DEPLOY.md)

**ตรวจสอบหลัง deploy (กรรมการ / smoke):**

```bash
SMOKE_BASE_URL=https://your-demo.example.com npm run smoke
```

จากนั้นเปิด URL ในเบราว์เซอร์ — ลองครบ flow: สมัคร → onboarding → สร้างเอกสาร → หน้า Preview → พิมพ์หรือบันทึก PDF

---

## 🚀 การติดตั้งและรันระบบ

### 1. ติดตั้ง Dependencies

```bash
# ในโฟลเดอร์ root (f:\sabaibill)
npm install

# ในโฟลเดอร์ client
cd client
npm install

# ในโฟลเดอร์ root อีกครั้งสำหรับ backend
cd ..
npm install
```

### 2. ตั้งค่าฐานข้อมูล

สำเนาไฟล์ environment แล้วแก้ค่าที่จำเป็น (อย่างน้อย `JWT_SECRET`; ถ้ายังไม่มี `DATABASE_URL` ให้คัดลอกจากตัวอย่าง):

```bash
# ในโฟลเดอร์ root — ถ้ายังไม่มี .env
cp .env.example .env
# Windows (cmd): copy .env.example .env
# จากนั้นแก้ JWT_SECRET และยืนยัน DATABASE_URL (ค่าเริ่มต้น SQLite อยู่ที่ prisma/dev.db)
```

```bash
# ในโฟลเดอร์ root
npx prisma generate
npx prisma db push
```

### 3. รัน Backend Server

```bash
# ในโฟลเดอร์ root (f:\sabaibill)
node src/server.js
```

- Backend จะทำงานที่ **http://localhost:3001**
- ดู log ใน terminal ได้เลย (มี Prisma query log)

### 4. รัน Frontend Dev Server

**เปิด terminal ใหม่** แล้วรัน:

```bash
# ในโฟลเดอร์ client
cd client
npm run dev
# หรือ
npx vite
```

- Frontend จะทำงานที่ **http://localhost:5173**
- รอจนขึ้น `Local: http://localhost:5173/`

---

## 📋 การใช้งานครั้งแรก

1. **เปิดเบราว์เซอร์** ไปที่ http://localhost:5173
2. **สมัครสมาชิก** (ใช้ email ใดๆ + PIN 6 หลัก)
3. **Login** ด้วย email และ PIN
4. **Onboarding** — กรอกข้อมูลบริษัท (จำเป็นต้องกรอกให้ครบ)
5. **เริ่มสร้างเอกสาร** ได้ทันที

**คู่มือการใช้งานทั้งหมด (รวมถึงตั้งค่าสกุลเงิน, หัก ณ ที่จ่าย, พิมพ์/PDF, สลับสกุลเงิน)** — ดูใน [DEPLOY.md](./DEPLOY.md#ขั้นตอนการใช้งานทั้งหมดคู่มือผู้ใช้)

---

## 🚀 การ Deploy สำหรับทดลองใช้

วิธีนำแอปขึ้น production (โฮสต์เดียว หรือแยก Frontend/Backend) และขั้นตอนการใช้งานครบ — ดู **[DEPLOY.md](./DEPLOY.md)**

---

## 🛠 หมายเหตุสำคัญ

- **ต้องรันทั้ง Backend และ Frontend พร้อมกัน**
- **Backend** ใช้ `node src/server.js` (อย่าใช้ `node index.js`)
- **Frontend** ใช้ `npm run dev` หรือ `npx vite`
- **Database** เป็น SQLite ไฟล์ `prisma/dev.db` เมื่อใช้ `DATABASE_URL="file:./dev.db"` ใน `.env`
- **Port**:
  - Backend: `3001`
  - Frontend: `5173`

---

## 🧩 ฟีเจอร์หลัก

- ✅ สร้างเอกสาร 4 ประเภท (QT, SO, DO, IV)
- ✅ แปลงเอกสารต่อเนื่อง (QT → SO → DO/IV)
- ✅ รองรับทั้งภาษาไทยและอังกฤษ
- ✅ แสดงราคา/ซ่อนราคา (สำหรับ DO)
- ✅ ส่วนลด % และ ฿
- ✅ คำนวณ VAT 7% อัตโนมัติ
- ✅ ภาษีหัก ณ ที่จ่าย (WHT) และยอดสุทธิที่ลูกค้าจ่าย (Net Payable)
- ✅ ตั้งค่าสกุลเงินและปุ่มสลับสกุลเงิน (THB / USD ฯลฯ)
- ✅ ลายเซ็นผู้จัดทำ
- ✅ ข้อมูลการชำระเงิน (IV)
- ✅ อัปเดตสถานะเอกสาร
- ✅ พิมพ์เอกสาร (Classic/Modern/Minimal layout)
- ✅ บันทึกข้อมูลลูกค้าและสินค้าอัตโนมัติ
- ✅ ค้นหาลูกค้า/สินค้าแบบ autocomplete
- ✅ รองรับผู้ใช้งานวัย senior (font 16px, touch targets ใหญ่)

---

## 📁 โครงสร้างโฟลเดอร์

```
sabaibill/
├── src/                 # Backend (Node.js + Express + Prisma)
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── prisma.js
│   └── server.js
├── client/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── utils/
│   └── package.json
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── dev.db           # SQLite (สร้างหลัง db push — ไม่ commit)
├── render.yaml          # ตัวอย่าง Blueprint สำหรับ Render
└── README.md
```

---

## 🔧 การแก้ไขปัญหาที่พบบ่อย

### 500 Error ตอนบันทึกเอกสาร
- ตรวจสอบว่ารัน `npx prisma db push` แล้ว
- ตรวจสอบว่า backend และ frontend รันพร้อมกัน
- ดู log ใน terminal ของ backend

### Frontend ไม่โหลด
- ตรวจสอบว่า backend รันที่ port 3001
- ลอง hard refresh (Ctrl+Shift+R)
- ตรวจสอบว่า `VITE_API_URL=http://localhost:3001` ใน `client/.env`

### Database ไม่ sync
```bash
npx prisma db push
```

---

## 📝 License

© 2026 SabaiBill. All rights reserved.
# การตรวจสอบการเชื่อม Frontend–Backend และโลโก้

## วิธีรัน Backend และ Frontend แบบถูกต้อง

### 1) รัน Backend ก่อน (ที่ root โปรเจกต์)

```bash
cd f:\sabaibill
npm run dev
```

- Server จะขึ้นที่ **port 3001** (หรือถ้าถูกใช้อยู่จะลอง 3002, 3003 ตามลำดับ)
- ถ้าเทอร์มินัลขึ้นว่า `Server is running on port 3002` (หรือเลขอื่น) ให้จำเลขพอร์ตนี้ไว้สำหรับขั้นตอน 3

### 2) รัน Frontend (เปิดเทอร์มินัลใหม่)

```bash
cd f:\sabaibill\client
npm run dev
```

- เปิดเบราว์เซอร์ไปที่ **http://localhost:5173** (หรือเลขที่ Vite แสดง เช่น 5174 ถ้า 5173 ถูกใช้)

### 3) ถ้า Backend ใช้พอร์ตไม่ใช่ 3001

ถ้า Backend ขึ้นที่พอร์ตอื่น (เช่น 3002) เพราะ 3001 ถูกใช้:

- สร้างหรือแก้ไฟล์ `client/.env` ให้มีบรรทัด:
  ```env
  VITE_API_URL=http://localhost:3002
  ```
  (เปลี่ยน 3002 เป็นเลขพอร์ตที่ Backend แสดงจริง)
- จากนั้น **รัน Frontend ใหม่** (หยุดแล้ว `npm run dev` อีกครั้ง) เพื่อให้อ่านค่า `.env`

---

## สิ่งที่ทำแล้ว

- **Backend**: รัน `npm run dev` ที่ root → server ขึ้นที่ port 3001 (หรือพอร์ตถัดไปถ้า 3001 ถูกใช้)
- **Frontend**: รัน `npm run build` ใน `client/` → build ผ่านไม่มี error

## ขั้นตอนตรวจสอบด้วยตัวเอง (Manual)

1. **ใส่ไฟล์โลโก้**: วาง `logo.png` ที่ `client/public/logo.png` แล้วรัน frontend เปิด http://localhost:5173 — ตรวจว่า favicon และ navbar แสดงโลโก้
2. **Login → Dashboard**: เข้าสู่ระบบแล้วดูว่าหน้า Dashboard โหลดและดึงรายการเอกสารได้
3. **Settings**: เปิด Settings แก้ไขแล้วบันทึก — ตรวจว่า PUT `/api/settings` ทำงาน
4. **Preview เอกสาร**: เปิดเอกสารใดๆ — ตรวจว่า theme และโลโก้ (หรือ fallback `/logo.png`) แสดงถูกต้อง

## Environment

- Backend: `DATABASE_URL`, `PORT`, `FRONTEND_URL`, `JWT_SECRET` ตาม [`.env.example`](./.env.example)
- Frontend: `VITE_API_URL` ใน `client/.env` (dev; ค่าเริ่มต้น `http://localhost:3001` ถ้า Backend ใช้พอร์ตอื่นให้ตั้งให้ตรง) — production build ต้องตั้ง `VITE_API_URL` ให้ตรง URL สาธารณะ (ดู [DEPLOY.md](./DEPLOY.md))
