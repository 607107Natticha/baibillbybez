const prisma = require('../prisma');

// Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' });
  }
};

// Get single customer
exports.getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) }
    });
    if (!customer) {
      return res.status(404).json({ message: 'ไม่พบลูกค้า' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' });
  }
};

// Create new customer
exports.createCustomer = async (req, res) => {
  const { name, nameEn, address, addressEn, taxId, phone } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อลูกค้า' });
  }

  try {
    // Check if customer name already exists
    const existing = await prisma.customer.findUnique({
      where: { name }
    });

    if (existing) {
      return res.status(409).json({ message: 'ชื่อลูกค้านี้มีอยู่ในระบบแล้ว' });
    }

    const customer = await prisma.customer.create({
      data: { name, nameEn, address, addressEn, taxId, phone }
    });

    res.status(201).json({ message: 'เพิ่มลูกค้าสำเร็จ', data: customer });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มลูกค้า' });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, nameEn, address, addressEn, taxId, phone } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อลูกค้า' });
  }

  try {
    // Check if new name conflicts with another customer
    const existing = await prisma.customer.findFirst({
      where: { 
        name,
        NOT: { id: parseInt(id) }
      }
    });

    if (existing) {
      return res.status(409).json({ message: 'ชื่อลูกค้านี้มีอยู่ในระบบแล้ว' });
    }

    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: { name, nameEn, address, addressEn, taxId, phone }
    });

    res.json({ message: 'แก้ไขข้อมูลลูกค้าสำเร็จ', data: customer });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลลูกค้า' });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.customer.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: 'ลบลูกค้าสำเร็จ' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบลูกค้า' });
  }
};
