const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const googleId = profile.id;
      
      // Find user by googleId or email
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleId: googleId },
            { email: email }
          ]
        }
      });

      if (!user) {
        // Create new user if not exists
        user = await prisma.user.create({
          data: {
            email: email,
            googleId: googleId,
            pinHash: null, // No PIN for Google users initially
            isOnboarded: false
          }
        });
      } else if (!user.googleId) {
        // Link Google account to existing email user
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleId }
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Auth Callback Handler
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isOnboarded: user.isOnboarded },
      process.env.JWT_SECRET || 'your-default-secret-key',
      { expiresIn: '1d' }
    );

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/google/callback?token=${token}&isOnboarded=${user.isOnboarded}`);
  } catch (error) {
    console.error('Google callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?error=google_auth_failed`);
  }
};

// Handle Google token from frontend (for popup/redirect flow)
exports.googleTokenAuth = async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ message: 'Missing Google credentials' });
    }

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
      // Create new user
      user = await prisma.user.create({
        data: {
          email: email,
          googleId: googleId,
          pinHash: null,
          isOnboarded: false
        }
      });
    } else if (!user.googleId) {
      // Link Google to existing account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleId }
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isOnboarded: user.isOnboarded },
      process.env.JWT_SECRET || 'your-default-secret-key',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'เข้าสู่ระบบด้วย Google สำเร็จ',
      token,
      isOnboarded: user.isOnboarded,
      user: {
        id: user.id,
        email: user.email,
        name: name
      }
    });
  } catch (error) {
    console.error('Google token auth error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google' });
  }
};

exports.passport = passport;
