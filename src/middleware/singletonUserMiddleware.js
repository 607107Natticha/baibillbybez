const prisma = require('../prisma');

/**
 * Single-tenant demo: no login — always use one User row (create if missing).
 */
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
