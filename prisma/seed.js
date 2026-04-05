// e:\sabaibill\prisma\seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // 1. สร้าง User สำหรับ Login (เบอร์: 0812345678, PIN: 1234)
  const hashedPassword = await bcrypt.hash('1234', 10)
  const user = await prisma.user.upsert({
    where: { phoneNumber: '0812345678' },
    update: {},
    create: {
      phoneNumber: '0812345678',
      pinHash: hashedPassword,
    },
  })
  console.log(`Created user: ${user.phoneNumber}`)

  // 2. สร้างข้อมูลบริษัทเริ่มต้น
  const settings = await prisma.companySetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      companyName: 'บริษัท ตัวอย่าง จำกัด',
      address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
      taxId: '1234567890123',
      phone: '02-123-4567',
      condQT: '1. ยืนยันราคาภายใน 30 วัน\n2. รับประกันสินค้า 1 ปี',
      condSO: '1. ชำระเงินมัดจำ 50%\n2. ส่งสินค้าภายใน 7 วัน',
      condDO: 'โปรดตรวจสอบสินค้าทันทีที่ได้รับ',
      condIV: 'ชำระเงินภายใน 30 วัน',
    },
  })
  console.log('Created company settings')

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
