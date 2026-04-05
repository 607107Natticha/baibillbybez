# แผนการ Deploy — SabaiBill

เอกสารนี้อธิบายวิธีนำแอป SabaiBill ขึ้น production เพื่อให้ทีมหรือลูกค้าทดลองใช้ผ่าน URL

---

## ตัวเลือกการ Deploy

| วิธี | Frontend | Backend | DB | ความยาก | หมายเหตุ |
|------|----------|---------|-----|---------|----------|
| **B. โฮสต์เดียว** | Serve จาก Express | Node ในตัว | SQLite ไฟล์เดียว | ง่าย | แนะนำสำหรับทดลองภายใน/ทีม |
| **A. แยก host** | Vercel / Netlify | Railway / Render / Fly.io | SQLite บน server หรือ PostgreSQL | ปานกลาง | ต้องตั้ง CORS และ env |

---

## B. Deploy แบบโฮสต์เดียว (แนะนำสำหรับทดลอง)

แอปรันด้วย Node เดียว: Backend + ไฟล์ static ของ Frontend

### 1. Build Frontend

```bash
cd client
npm run build
```

จะได้โฟลเดอร์ `client/dist`

### 2. ตั้งค่า Environment

สร้างหรือแก้ไข `.env` ที่ root โปรเจกต์:

```env
NODE_ENV=production
DATABASE_URL="file:./dev.db"
PORT=3001
JWT_SECRET=<สุ่มยาวๆ อย่าใช้ค่าตัวอย่าง>
# ถ้า deploy บน server จริง ใส่ URL ของ frontend สำหรับ CORS (ถ้ามีการเข้าจาก domain อื่น)
# FRONTEND_URL=https://your-domain.com
```

- **สำคัญ:** ตอน build frontend ต้องตั้ง `VITE_API_URL` ให้ตรง **origin สาธารณะ** ที่ผู้ใช้เปิดแอป (scheme + โดเมน + พอร์ตถ้ามี) เพราะโค้ดเรียก `${VITE_API_URL}/api/...`  
  สร้างหรือแก้ `client/.env.production` (หรือตัวแปร build บน PaaS):

```env
VITE_API_URL=https://your-domain.com
```

ถ้าโฮสต์เดียว (SPA กับ API ที่โดเมนเดียวกัน) ให้ใส่ URL นั้นเหมือนกัน เช่น `https://your-domain.com`

จากนั้น build อีกครั้ง:

```bash
cd client
npm run build
```

### 3. รัน Server (Production)

```bash
cd f:\sabaibill   # หรือ path โปรเจกต์
node src/server.js
```

หรือใช้ `pm2` สำหรับรันต่อเนื่อง:

```bash
npm install -g pm2
pm2 start src/server.js --name sabaibill
```

- เปิดผ่าน `http://localhost:3001` (หรือ `http://YOUR_SERVER_IP:3001`)
- ถ้า deploy บน VPS ให้ใช้ Nginx เป็น reverse proxy ผูกกับ domain และ HTTPS ตามต้องการ

### 4. หมายเหตุ

- ฐานข้อมูล SQLite อยู่ที่ไฟล์ **`prisma/dev.db`** เมื่อใช้ `DATABASE_URL="file:./dev.db"` (path สัมพันธ์กับโฟลเดอร์ `prisma/`) — ควร backup เป็นระยะ
- ต้องรัน `npx prisma generate` และ `npx prisma db push` ก่อนรัน production ครั้งแรก (หรือเมื่อแก้ schema)
- บน PaaS ที่ดิสก์ไม่ถาวร ข้อมูลอาจหายเมื่อ redeploy — ใช้ **Persistent Disk** (แผนมีค่าใช้จ่ายบน Render) หรือ **PostgreSQL แยก** ถ้าต้องการเก็บข้อมูลถาวร

### 4.1 (ทางเลือก) เก็บข้อมูลบน Render ไม่ให้หาย

- ค่าเริ่มต้นใน [`render.yaml`](./render.yaml) คือ **`plan: free`** + `DATABASE_URL=file:./dev.db` — เหมาะกับ demo ที่ยอมรับ **cold start** และยอมรับว่าข้อมูลอาจหายเมื่อ redeploy
- แผน **Free ใส่ Persistent Disk ไม่ได้** ตาม [เอกสาร Render](https://render.com/docs/disks)
- ถ้าต้องการ SQLite **คงอยู่ข้าม deploy:** อัปเกรดเป็น **Starter+** → เพิ่ม disk mount **`/data`** → ตั้ง **`DATABASE_URL=file:/data/dev.db`** → deploy ใหม่ (DB บน disk ใหม่จะว่างจนกว่าจะมีข้อมูลหรือ migrate)

### 5. Deploy บน Render (Blueprint)

โปรเจกต์มีไฟล์ [`render.yaml`](./render.yaml) สำหรับสร้าง Web service ตัวเดียว (build ทั้ง root + `client/` แล้ว `npm start`)

1. Push โค้ดขึ้น GitHub แล้วใน Render เลือก **New → Blueprint** ชี้ repo นี้
2. **Build command ต้องตรงกับ repo:** ใส่ใน Render (Build Command) **ทั้งบรรทัดนี้** (หรือ sync จาก [`render.yaml`](./render.yaml)):
   ```bash
   npm ci && npm ci --prefix client && npm run build --prefix client && npx prisma generate
   ```
   - **exit 127** = มักเป็นคำสั่งใน Build ผิด / ไม่ตรงกับ repo / ยังไม่ได้ `npm ci` ใน `client` จนมี `vite`
   - ถ้า Dashboard ยังเป็น command เก่าหรือว่าง — แก้แล้วกด **Clear build cache & deploy**
3. ใน Render ตั้ง **Build-time environment variable** `VITE_API_URL` = `https://<ชื่อ-service>.onrender.com` (หรือโดเมนของคุณ) แล้ว **Deploy ใหม่** หนึ่งครั้ง เพื่อให้ bundle ของ Vite ชี้ API ถูกต้อง
4. ตรวจสอบว่า `JWT_SECRET` ถูกตั้งแล้ว (Blueprint สร้างค่าสุ่มได้ — ดูในแท็บ Environment)
5. ถ้าอยากให้ข้อมูลไม่หายหลัง redeploy — ดูหัวข้อ **4.1** (ต้องเป็นแผนมีค่าใช้จ่าย + disk)

ทดสอบหลัง deploy:

```bash
SMOKE_BASE_URL=https://your-service.onrender.com npm run smoke
```

---

## A. Deploy แบบแยก (Frontend + Backend แยก host)

### Backend (Railway / Render / Fly.io ฯลฯ)

1. ตั้งค่า environment:
   - `DATABASE_URL` — ถ้าใช้ PostgreSQL ใส่ connection string; ถ้าใช้ SQLite บน disk ตามที่ platform รองรับ
   - `FRONTEND_URL` — URL ของ frontend (เช่น `https://sabaibill.vercel.app`) สำหรับ CORS
   - `PORT` — ตามที่ platform กำหนด

2. Deploy โค้ด backend (โฟลเดอร์ root มี `src/`, `prisma/`)

3. รัน migration:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Frontend (Vercel / Netlify)

1. ตั้งค่า environment ใน dashboard:
   - `VITE_API_URL` = URL ของ backend (เช่น `https://your-backend.railway.app`)

2. Build command: `npm run build` (ในโฟลเดอร์ `client` ถ้า repo เป็น monorepo ต้องตั้ง root เป็น `client` หรือใช้ build command ที่ cd เข้า client ก่อน)

3. Publish directory: `dist`

4. ตรวจสอบว่า Backend อนุญาต CORS จาก origin ของ Frontend (`FRONTEND_URL`)

---

## ขั้นตอนการใช้งานทั้งหมด (คู่มือผู้ใช้)

สำหรับผู้ใช้ปลายทางที่เข้าใช้แอปหลัง deploy แล้ว:

1. **เปิดเว็บ** → ลงทะเบียน (อีเมล + PIN 6 หลัก) หรือล็อกอิน
2. **Onboarding** — กรอกข้อมูลบริษัทครั้งแรก (ชื่อ ที่อยู่ เลขประจำตัวผู้เสียภาษี ฯลฯ)
3. **ตั้งค่า** (Settings):
   - ข้อมูลบริษัท, ธนาคาร, เงื่อนไขท้ายบิล
   - เทมเพลต (รูปแบบ layout, สี)
   - ลายเซ็น, QR ชำระเงิน
   - **สกุลเงิน** — เลือกสกุลหลัก (THB/USD/EUR), สกุลรอง และอัตราแลกเปลี่ยน (สำหรับลูกค้าต่างชาติ)
4. **สร้างเอกสาร** — เลือกประเภท (ใบเสนอราคา QT / ใบสั่งขาย SO / ใบส่งของ DO / ใบแจ้งหนี้ IV), กรอกลูกค้า, รายการสินค้า, ส่วนลด, VAT และ **หัก ณ ที่จ่าย (WHT)** ถ้ามี → บันทึก
5. **ประวัติเอกสาร** — เปิดดู, แปลงประเภท, คัดลอกบิล, ลบ, อัปเดตสถานะ
6. **พิมพ์ / Save PDF** — จากหน้า Preview เลือกปุ่มพิมพ์หรือบันทึก PDF
7. **สลับสกุลเงิน** — ใช้ปุ่ม Toggle ในแถบเมนู (บาท | USD ฯลฯ) เพื่อแสดงยอดเป็นสกุลหลักหรือสกุลรอง

---

## Environment สรุป

| ตัวแปร | ที่ใช้ | คำอธิบาย |
|--------|--------|----------|
| `NODE_ENV` | Backend | `production` เพื่อ serve ไฟล์ static จาก Express |
| `PORT` | Backend | พอร์ต server (default 3001; บน PaaS มักถูกตั้งโดยแพลตฟอร์ม) |
| `FRONTEND_URL` | Backend | คั่นด้วย comma ได้ ใช้สำหรับ CORS |
| `VITE_API_URL` | Frontend (build time) | origin ของ API สำหรับเรียก `${VITE_API_URL}/api/...` |
| `DATABASE_URL` | Prisma | SQLite ค่าเริ่มต้น `file:./dev.db` → ไฟล์ที่ `prisma/dev.db` |
| `JWT_SECRET` | Backend | ลงชื่อ JWT — ต้องเป็นความลับใน production |
