const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // รับ Token จาก Header (รูปแบบ: "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'ไม่มีสิทธิ์เข้าถึง (Access Denied)' });
  }

  try {
    // ตรวจสอบความถูกต้องของ Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-default-secret-key');
    req.user = decoded; // เก็บข้อมูล user ไว้ใช้ต่อ
    req.userId = decoded.userId; // ตั้งค่า userId สำหรับ controller
    next(); // อนุญาตให้ไปทำงานต่อ
  } catch (error) {
    return res.status(403).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};