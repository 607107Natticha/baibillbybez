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

- เปิดเบราว์เซอร์ไปที่ **http://localhost:5174** (พอร์ตหลักของ frontend)

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

1. **ใส่ไฟล์โลโก้**: วาง `logo.png` ที่ `client/public/logo.png` แล้วรัน frontend เปิด http://localhost:5174 — ตรวจว่า favicon และ navbar แสดงโลโก้
2. **Login → Dashboard**: เข้าสู่ระบบแล้วดูว่าหน้า Dashboard โหลดและดึงรายการเอกสารได้
3. **Settings**: เปิด Settings แก้ไขแล้วบันทึก — ตรวจว่า PUT `/api/settings` ทำงาน
4. **Preview เอกสาร**: เปิดเอกสารใดๆ — ตรวจว่า theme และโลโก้ (หรือ fallback `/logo.png`) แสดงถูกต้อง

## Environment

- Backend: `PORT`, `FRONTEND_URL`, ตัวแปร DB (Prisma/DATABASE_URL) ตาม `.env`
- Frontend: `VITE_API_URL` (ค่าเริ่มต้น `http://localhost:3001` — ถ้า Backend ใช้พอร์ตอื่นให้ตั้งใน `client/.env`)

---

## แก้ error เข้าสู่ระบบด้วย Google

### 1) `net::ERR_CONNECTION_REFUSED` ที่ `:3001/api/auth/google/verify`

- **สาเหตุ**: Backend ไม่ได้รัน หรือไม่ฟังที่ port 3001
- **แก้**: รัน Backend ก่อนเสมอ (ที่ root โปรเจกต์: `npm run dev`) ให้เทอร์มินัลขึ้นว่า `Server is running on port 3001` แล้วค่อยลองกดเข้าสู่ระบบด้วย Google อีกครั้ง

### 2) `403` และ `The given origin is not allowed for the given client ID`

- **สาเหตุ**: ใน Google Cloud Console ยังไม่ได้เพิ่ม origin ของหน้าเว็บ (เช่น `http://localhost:5174`) ให้กับ Client ID ที่ใช้
- **แก้**:
  1. เปิด [Google Cloud Console](https://console.cloud.google.com/) → โปรเจกต์ที่ใช้กับแอปนี้
  2. ไปที่ **APIs & Services** → **Credentials**
  3. เลือก OAuth 2.0 Client ID ที่ใช้กับแอป (ประเภท Web application)
  4. ใน **Authorized JavaScript origins** ให้เพิ่ม:
     - `http://localhost:5174`
     - (ถ้าจะใช้ 5173 ด้วย) `http://localhost:5173`
  5. บันทึก แล้วรอสักครู่แล้วลองล็อกอินด้วย Google อีกครั้ง
