# SabaiBill

**SabaiBill** เป็นเว็บแอปสำหรับธุรกิจขนาดเล็กที่ต้องการออกเอกสารซื้อขายครบวงจรในที่เดียว — ตั้งแต่ใบเสนอราคาไปจนถึงใบแจ้งหนี้ พร้อมตั้งค่าบริษัท เทมเพลต พิมพ์ และบันทึก PDF

---

## สำหรับกรรมการ (สรุปสั้น ๆ)

| รายการ | ลิงก์ / คำอธิบาย |
|--------|-------------------|
| **ทดลองออนไลน์** | [https://baibillbybez.onrender.com](https://baibillbybez.onrender.com) |
| **ซอร์สโค้ด** | [github.com/607107Natticha/baibillbybez](https://github.com/607107Natticha/baibillbybez) |
| **ลำดับทดลอง** | เปิด URL → กด **เข้าใช้งาน** → กรอกข้อมูลบริษัท (ครั้งแรก) → สร้างเอกสาร → เปิด Preview → พิมพ์หรือ Save PDF |
| **หมายเหตุ demo** | โฮสต์แบบฟรีอาจ **หน่วง ~1 นาที** ครั้งแรกหลังไม่มีคนใช้นาน (cold start) และข้อมูล SQLite อาจ **หายเมื่อ redeploy** ถ้าไม่ใช้ดิสก์ถาวร |

**ตรวจ API หลัง deploy (ไม่ต้องเปิดเบราว์เซอร์):**

```bash
git clone https://github.com/607107Natticha/baibillbybez.git
cd baibillbybez
npm install
SMOKE_BASE_URL=https://baibillbybez.onrender.com npm run smoke
```

---

## โปรเจกต์นี้คืออะไร

SabaiBill ช่วยให้ผู้ใช้:

- สร้างและจัดเก็บเอกสาร **QT** (ใบเสนอราคา), **SO** (ใบสั่งขาย), **DO** (ใบส่งของ), **IV** (ใบแจ้งหนี้)
- **แปลงต่อเนื่อง** เช่น QT → SO → DO / IV
- ตั้งค่า **ข้อมูลบริษัท ธนาคาร เงื่อนไขท้ายบิล เทมเพลต ลายเซ็น QR ชำระเงิน สกุลเงิน**
- คำนวณ **VAT ส่วนลด หัก ณ ที่จ่าย (WHT)** และแสดงยอดสุทธิ
- **พิมพ์ / บันทึก PDF** จากหน้า Preview
- จัดการ **ลูกค้าและสินค้า** พร้อมค้นหาแบบ autocomplete

**การเข้าใช้งาน:** ไม่มีหน้าสมัครหรือล็อกอินแยก — กดปุ่มเดียวแล้วระบบใช้ผู้ใช้คนเดียวในฐานข้อมูล (เหมาะกับ **demo / ทดลองภายใน** ไม่เหมาะกับข้อมูลลับโดยไม่มีชั้นป้องกันอื่น)

---

## ภาษาและประสบการณ์ผู้ใช้

- **ภาษาอินเทอร์เฟซ:** ไทยและอังกฤษ (สลับได้ในแอป)
- **ข้อความในเอกสาร:** รองรับฟิลด์คู่ไทย/อังกฤษ (ชื่อบริษัท ที่อยู่ ลูกค้า ฯลฯ)
- **ออกแบบให้อ่านง่าย:** ตัวอักษรโต ปุ่มกดใหญ่ เหมาะผู้ใช้ที่ต้องการความชัดเจน

---

## Tech Stack

| ชั้น | เทคโนโลยี |
|-----|-----------|
| **Frontend** | React 19, Vite, React Router, Tailwind CSS, Axios, Heroicons / Lucide |
| **Backend** | Node.js, Express |
| **ฐานข้อมูล** | SQLite + **Prisma ORM** |
| **เอกสาร / พิมพ์** | html2pdf.js, jsPDF, html2canvas (ในหน้า Preview) |

ภาษาโปรแกรมหลัก: **JavaScript (ES modules ฝั่ง client)** และ **CommonJS ฝั่ง server** — สคีมาฐานข้อมูลนิยามใน **Prisma Schema**

---

## โครงสร้างโปรเจกต์ (ย่อ)

```
sabaibill/
├── src/                 # Backend (Express)
│   ├── controllers/
│   ├── middleware/      # เช่น singletonUserMiddleware
│   ├── routes/
│   └── server.js
├── client/              # Frontend (Vite + React)
│   └── src/
│       ├── pages/
│       ├── components/
│       └── context/
├── prisma/
│   ├── schema.prisma
│   └── dev.db           # สร้างหลัง db push (ไม่ควร commit)
├── scripts/smoke-test.mjs
├── render.yaml          # ตัวอย่าง Blueprint สำหรับ Render
└── README.md
```

---

## ตัวอย่างโค้ดสำคัญ

### 1) เข้าใช้งานจากหน้าแรก — เช็ค onboarding แล้วส่งต่อ route

```jsx
// client/src/pages/EntryPage.jsx (แนวคิดหลัก)
const handleEnter = async () => {
  setLoading(true);
  try {
    const { data } = await axios.get(`${API_URL}/api/onboarding-status`);
    navigate(data.isOnboarded ? '/dashboard' : '/onboarding', { replace: true });
  } catch {
    navigate('/onboarding', { replace: true });
  } finally {
    setLoading(false);
  }
};
```

### 2) Middleware ผู้ใช้คนเดียว (ไม่ใช้ JWT ในเบราว์เซอร์)

```javascript
// src/middleware/singletonUserMiddleware.js
module.exports = async function singletonUserMiddleware(req, res, next) {
  try {
    let user = await prisma.user.findFirst({ orderBy: { id: 'asc' } });
    if (!user) {
      user = await prisma.user.create({ data: { isOnboarded: false } });
    }
    req.userId = user.id;
    req.user = { userId: user.id, email: user.email, isOnboarded: user.isOnboarded };
    next();
  } catch (err) {
    console.error('singletonUserMiddleware:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
};
```

### 3) Production: API + เสิร์ฟหน้าเว็บจากโฟลเดอร์เดียว

```javascript
// src/server.js — โหมด production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => { if (err) next(err); });
  });
}
```

### 4) โมเดลหลักใน Prisma (ตัวอย่าง)

```prisma
// prisma/schema.prisma (ย่อ)
model User {
  id          Int     @id @default(autoincrement())
  isOnboarded Boolean @default(false)
  // ฟิลด์ email / OAuth เหลือเพื่อความเข้ากันได้กับโค้ดเดิม
}

model Document {
  id     Int    @id @default(autoincrement())
  type   String // QT, SO, DO, IV
  no     String @unique
  items  DocumentItem[]
  // ยอดเงิน VAT ส่วนลด WHT ฯลฯ
}
```

---

## วิธีรันบนเครื่องตัวเอง

### 1. ติดตั้งแพ็กเกจ

```bash
npm install
cd client && npm install && cd ..
```

### 2. ตั้งค่า `.env` ที่ root

```bash
# macOS / Linux
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

ตรวจว่า `DATABASE_URL` ชี้ SQLite ตามที่ต้องการ (ค่าเริ่มต้นมักเป็น `file:./dev.db` ภายใต้โฟลเดอร์ `prisma/`)

### 3. สร้างตารางในฐานข้อมูล

```bash
npx prisma generate
npx prisma db push
```

### 4. เปิด Backend และ Frontend (สองเทอร์มินัล)

**เทอร์มินัล 1 — Backend**

```bash
node src/server.js
# หรือ: npm run dev
```

เปิดที่ `http://localhost:3001` (ถ้าพอร์ตถูกใช้ ระบบอาจเลื่อนเป็น 3002, 3003)

**เทอร์มินัล 2 — Frontend**

```bash
cd client
npm run dev
```

เปิดที่ `http://localhost:5173` (หรือพอร์ตที่ Vite แจ้ง)

ถ้า Backend ไม่ได้อยู่ที่ `3001` ให้สร้าง `client/.env`:

```env
VITE_API_URL=http://localhost:PORT_ที่_backend_ใช้จริง
```

แล้วรัน `npm run dev` ใหม่ใน `client/`

---

## คู่มือใช้งานแบบละเอียด (หลังเข้าแอปแล้ว)

1. **หน้าแรก** → กด **เข้าใช้งาน**
2. **Onboarding** — กรอกข้อมูลบริษัทครั้งแรก (ถ้ายังไม่เคย)
3. **Settings** — บริษัท, ธนาคาร, เงื่อนไขท้ายบิล, เทมเพลต, ลายเซ็น, QR, **สกุลเงิน**
4. **สร้างเอกสาร** — เลือก QT / SO / DO / IV, ลูกค้า, รายการ, ส่วนลด, VAT, WHT
5. **ประวัติ** — ดู แปลงประเภท อัปเดตสถานะ
6. **Preview** — พิมพ์หรือบันทึก PDF
7. **สลับสกุลเงิน** — จากแถบเมนู (ถ้าตั้งค่าไว้)

---

## Deploy แบบโฮสต์เดียว (สรุป)

แนวทาง: build หน้าเว็บแล้วให้ Express เสิร์ฟ `client/dist` พร้อม API ที่ `/api`

1. ตั้ง `NODE_ENV=production` และ `DATABASE_URL` ใน `.env` ที่ root  
2. **แนะนำ:** อย่าตั้ง `VITE_API_URL` ตอน build (หรือเว้นว่าง) — แอปจะเรียก API ที่ **origin เดียวกับหน้าเว็บ** จึงไม่โดน CORS  
   ถ้าจำเป็นต้องชี้ API คนละโดเมน ค่อยตั้ง `VITE_API_URL` แล้วบน backend ต้องตั้ง `FRONTEND_URL` หรือ `CORS_ALLOWED_ORIGINS` ให้ตรงโดเมนหน้าเว็บ  
3. รัน:

   ```bash
   cd client
   npm run build
   cd ..
   npx prisma generate
   npx prisma db push
   npm start
   ```

**Render:** ใช้ไฟล์ [`render.yaml`](./render.yaml) เป็น Blueprint ได้ — **ถ้าเป็น service เดียว** ลบหรือไม่ตั้ง `VITE_API_URL` ตอน build แล้ว deploy ใหม่ จะใช้ same-origin อัตโนมัติ ถ้ายังแยกสอง service ให้ตั้ง `VITE_API_URL` ที่ build และบน API ใส่ `FRONTEND_URL=https://โดเมนหน้าเว็บ`

**ข้อมูลไม่หายหลัง redeploy:** บน Render แผนฟรีดิสก์มักไม่ถาวร — ถ้าต้องการ SQLite คงอยู่ ต้องใช้แผนมีค่าใช้จ่าย + Persistent Disk และตั้ง `DATABASE_URL` ชี้ path บนดิสก์ (ดูเอกสาร Render เรื่อง Disks)

---

## ตัวแปรสภาพแวดล้อมหลัก

| ตัวแปร | ใช้ที่ไหน | ความหมายสั้น ๆ |
|--------|-----------|----------------|
| `DATABASE_URL` | Prisma | SQLite เช่น `file:./dev.db` |
| `PORT` | Backend | พอร์ตเซิร์ฟเวอร์ (ค่าเริ่มต้น 3001) |
| `NODE_ENV` | Backend | ใส่ `production` เพื่อเสิร์ฟ SPA จาก `client/dist` |
| `FRONTEND_URL` | Backend | CORS — origin ของหน้าเว็บ คั่นหลายตัวด้วย comma |
| `CORS_ALLOWED_ORIGINS` | Backend | เพิ่ม origin ที่อนุญาต (คั่นด้วย comma) ใช้คู่กับ `FRONTEND_URL` เมื่อมีหลายหน้าเว็บ |
| `VITE_API_URL` | ตอน build client | ถ้าไม่ตั้ง = production ใช้ origin เดียวกับหน้าเว็บ; ตั้งเมื่อ API คนละโดเมน |
| `VITE_SAME_ORIGIN_API` | ตอน build client | ทางเลือก: `true` = บังคับ same-origin (ส่วนใหญ่ build ฝัง flag ใน `index.html` ให้แล้ว) |
| `VITE_SINGLE_HOST_API` | ตอน build client | ใส่ `false` เมื่อแยกโดเมน SPA/API (ไม่ฝังสคริปต์ same-origin) |
| `JWT_SECRET` | Backend | ค่าใน `.env.example` (โค้ดเดิมรองรับ JWT; flow ปัจจุบันไม่บังคับส่ง token จากเบราว์เซอร์) |

---

## แก้ปัญหาที่พบบ่อย

- **CORS / ยังยิงไปโดเมน API เก่า (`billbybz` ฯลฯ)** — โปรเจกต์นี้ build production จะฝังสคริปต์ใน `index.html` ให้เรียก API ที่ **origin เดียวกับหน้าเว็บ** โดยอัตโนมัติ — deploy โค้ดล่าสุดแล้ว **Clear build cache** บน Render ถ้าแยกโดเมนจริง ให้ build ด้วย **`VITE_SINGLE_HOST_API=false`** + `VITE_API_URL` และตั้ง CORS บน backend  
- **500 ตอนบันทึก** — รัน `npx prisma db push` และตรวจว่า Backend รันอยู่  
- **Frontend เรียก API ไม่ถึง** — dev: ตั้ง `VITE_API_URL` ให้ตรงพอร์ต Backend  
- **โลโก้** — วาง `client/public/logo.png` แล้วรีเฟรชหน้าเว็บ

---

## Checklist ตรวจด้วยตนเอง (หลังรัน local)

1. หน้าแรก → เข้าใช้งาน → Dashboard หลัง onboarding  
2. Settings บันทึกได้  
3. สร้างเอกสาร → เปิด Preview → theme / โลโก้ แสดงถูกต้อง  

---

## License

© 2026 SabaiBill. All rights reserved.
