const prisma = require('../prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Helper: Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper: Validate PIN (6 digits)
const isValidPin = (pin) => {
  return /^\d{6}$/.test(pin);
};

exports.register = async (req, res) => {
  const { email, pin, confirmPin } = req.body;

  // Validation
  if (!email || !pin) {
    return res.status(400).json({ message: 'กรุณากรอก Email และ PIN' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'รูปแบบ Email ไม่ถูกต้อง' });
  }

  if (!isValidPin(pin)) {
    return res.status(400).json({ message: 'PIN ต้องเป็นตัวเลข 6 หลัก' });
  }

  if (pin !== confirmPin) {
    return res.status(400).json({ message: 'PIN ยืนยันไม่ตรงกัน' });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Email นี้มีผู้ใช้งานแล้ว' });
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        pinHash,
        isOnboarded: false,
      },
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isOnboarded: user.isOnboarded },
      process.env.JWT_SECRET || 'your-default-secret-key',
      { expiresIn: '1d' }
    );

    res.status(201).json({ 
      message: 'สมัครสมาชิกสำเร็จ', 
      token,
      isOnboarded: false
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ: ' + error.message });
  }
};

exports.login = async (req, res) => {
  const { email, pin } = req.body;

  if (!email || !pin) {
    return res.status(400).json({ message: 'กรุณากรอก Email และ PIN' });
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้งานนี้' });
    }

    const isPinValid = await bcrypt.compare(pin, user.pinHash);
    if (!isPinValid) {
      return res.status(401).json({ message: 'PIN ไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, isOnboarded: user.isOnboarded },
      process.env.JWT_SECRET || 'your-default-secret-key',
      { expiresIn: '1d' }
    );

    res.json({ 
      message: 'ล็อกอินสำเร็จ', 
      token,
      isOnboarded: user.isOnboarded
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ: ' + error.message });
  }
};

exports.checkOnboarding = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isOnboarded: true }
    });
    
    res.json({ isOnboarded: user?.isOnboarded || false });
  } catch (error) {
    console.error('Check onboarding error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
};

exports.completeOnboarding = async (req, res) => {
  try {
    const { companyName, companyNameEn, address, country, postalCode, taxId, phone, logoImage } = req.body;

    // Validation
    if (!companyName || !companyNameEn || !address || !country || !postalCode || !taxId || !phone) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // Update or create company settings
    await prisma.companySetting.upsert({
      where: { id: 1 },
      update: {
        companyName,
        companyNameEn,
        address,
        country,
        postalCode,
        taxId,
        phone,
        logoImage,
      },
      create: {
        id: 1,
        companyName,
        companyNameEn,
        address,
        country,
        postalCode,
        taxId,
        phone,
        logoImage,
      },
    });

    // Update user onboarding status
    await prisma.user.update({
      where: { id: req.userId },
      data: { isOnboarded: true },
    });

    res.json({ message: 'บันทึกข้อมูลสำเร็จ' });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ: ' + error.message });
  }
};

// Google Auth - Verify ID Token from Google Identity Services
exports.googleAuth = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'Missing Google credential' });
  }

  try {
    // Verify Google ID Token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const googleId = payload.sub;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleId },
          { email: email }
        ]
      }
    });

    if (!user) {
      // Create new user with Google login
      user = await prisma.user.create({
        data: {
          email: email,
          googleId: googleId,
          pinHash: null, // No PIN for Google users
          isOnboarded: false,
        },
      });
    } else if (!user.googleId) {
      // Link Google to existing email user
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleId }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isOnboarded: user.isOnboarded },
      process.env.JWT_SECRET || 'your-default-secret-key',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'เข้าสู่ระบบด้วย Google สำเร็จ',
      token,
      isOnboarded: user.isOnboarded,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'ไม่สามารถยืนยันตัวตนกับ Google ได้' });
  }
};