const { PrismaClient } = require('@prisma/client');

// เปิด Log เพื่อให้เห็น Query และ Error ชัดเจนขึ้น
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

module.exports = prisma;