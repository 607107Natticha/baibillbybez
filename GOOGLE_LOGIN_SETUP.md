# ==========================================
# คู่มือตั้งค่า Google Login (แบบง่าย)
# ==========================================

## ขั้นตอนที่ 1: สร้าง Google OAuth Client ID

1. ไปที่ https://console.cloud.google.com/
2. เลือก Project หรือสร้างใหม่
3. ไปที่ **APIs & Services** → **Credentials**
4. คลิก **Configure Consent Screen** (ถ้ายังไม่ได้ตั้งค่า)
   - User Type: External
   - App name: Sabaibill
   - User support email: your-email@gmail.com
   - Developer contact: your-email@gmail.com
   - กด Save and Continue
   - Scopes: ไม่ต้องเพิ่ม กด Save and Continue
   - Test users: เพิ่ม beetwowin2@gmail.com (หรือ email ที่จะใช้ทดสอบ)
   - กด Save and Continue

5. กลับไปที่ **Credentials**
6. คลิก **Create Credentials** → **OAuth client ID**
7. Application type: **Web application**
8. Name: Sabaibill Web Client
9. **Authorized JavaScript origins:**
   - http://localhost:5173
   - http://127.0.0.1:5173
10. **Authorized redirect URIs:** (ไม่ต้องใส่ก็ได้สำหรับ GIS)
11. กด **Create**
12. **คัดลอก Client ID** (จะขึ้น popup)

---

## ขั้นตอนที่ 2: ตั้งค่า Environment Variables

### Backend (.env ใน f:/sabaibill/)
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
```

### Frontend (.env ใน f:/sabaibill/client/)
```env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
```

**สำคัญ:** ต้องใช้ Client ID **เดียวกัน** ทั้ง Backend และ Frontend

---

## ขั้นตอนที่ 3: Restart Server

```bash
# Backend (Terminal 1)
cd f:/sabaibill
npm run dev

# Frontend (Terminal 2)
cd f:/sabaibill/client
npm run dev
```

---

## ขั้นตอนที่ 4: ทดสอบ

1. เปิด http://localhost:5173/login
2. กดปุ่ม "Sign in with Google"
3. เลือกบัญชี Google
4. เข้าสู่ระบบสำเร็จ!

---

## แก้ปัญหา

### Error 401: invalid_client
- **สาเหตุ:** Client ID ไม่ถูกต้องหรือไม่ได้ตั้งค่า
- **วิธีแก้:** ตรวจสอบว่า GOOGLE_CLIENT_ID และ VITE_GOOGLE_CLIENT_ID ตรงกับที่ได้จาก Google Console

### Error 403: origin_mismatch
- **สาเหตุ:** URL ไม่ตรงกับ Authorized JavaScript origins
- **วิธีแก้:** เพิ่ม http://localhost:5173 ใน Authorized JavaScript origins

### [GSI_LOGGER]: The given client ID is not found
- **สาเหตุ:** ใช้ API Key แทน OAuth Client ID
- **วิธีแก้:** ต้องใช้ OAuth 2.0 Client ID (ลงท้ายด้วย .apps.googleusercontent.com)

### Access blocked: Authorization Error
- **สาเหตุ:** App ยังอยู่ในโหมด Testing และ user ไม่ได้อยู่ใน Test users
- **วิธีแก้:** เพิ่ม email ใน Test users ที่ OAuth consent screen

---

## หมายเหตุ

- Client ID จะมีรูปแบบ: `123456789-abc123.apps.googleusercontent.com`
- ไม่ใช่ API Key (AIzaSy...)
- ต้อง Restart ทั้ง Backend และ Frontend หลังแก้ไข .env
