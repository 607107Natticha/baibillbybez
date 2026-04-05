const prisma = require('../prisma');

const generateDocNumber = async (type, dateInput) => {
  const date = new Date(dateInput);
  const year = (date.getFullYear() + 543) % 100;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `${type}-${year}${month}`;

  const lastDoc = await prisma.document.findFirst({
    where: { no: { startsWith: prefix } },
    orderBy: { no: 'desc' },
  });

  let runningNo = 1;
  if (lastDoc) {
    const parts = lastDoc.no.split('-');
    if (parts.length === 3) {
      runningNo = parseInt(parts[2]) + 1;
    }
  }

  return `${prefix}-${String(runningNo).padStart(4, '0')}`;
};

const getAncestors = async (refNo) => {
  const ancestors = [];
  let currentRef = refNo;
  while (currentRef) {
    const parent = await prisma.document.findUnique({
      where: { no: currentRef },
      select: { id: true, type: true, no: true, status: true, refNo: true }
    });
    if (parent) { ancestors.unshift(parent); currentRef = parent.refNo; }
    else { break; }
  }
  return ancestors;
};

// Base = หลังหักส่วนลด; VAT = Base*7% if exclude; total = Base+VAT; WHT = Base*(whtRate/100); netPayable = total - WHT
const calculateTotal = (items, vatType, discountType, discountValue, whtRate = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  let afterDiscount = subtotal;
  if (discountType === 'percent') {
    afterDiscount = subtotal * (1 - (discountValue / 100));
  } else {
    afterDiscount = Math.max(0, subtotal - discountValue);
  }
  const base = afterDiscount;
  let total = base;
  if (vatType === 'exclude') {
    total = base * 1.07;
  }
  const whtAmount = (whtRate && whtRate > 0) ? base * (whtRate / 100) : 0;
  const netPayable = total - whtAmount;
  return { total, whtAmount, netPayable };
};

exports.getDocuments = async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = {};
    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      if (!Number.isNaN(m) && m >= 1 && m <= 12 && !Number.isNaN(y)) {
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0, 23, 59, 59, 999);
        where.date = { gte: start, lte: end };
      }
    }
    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDocumentById = async (req, res) => {
  const { id } = req.params;
  try {
    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
      include: { items: true },
    });
    if (!document) return res.status(404).json({ message: 'Document not found' });

    // ดึงประวัติ (Ancestors & Children)
    const ancestors = await getAncestors(document.refNo);
    const children = await prisma.document.findMany({
        where: { refNo: document.no },
        select: { id: true, type: true, no: true, status: true }
    });

    res.json({ ...document, ancestors, children });
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    res.status(500).json({ message: 'Failed to fetch document' });
  }
};

exports.createDocument = async (req, res) => {
  try {
    const { type, date, items, vatType, discountType, discountValue, ...rest } = req.body;
    
    console.log('Creating document with data:', { type, date, items, vatType, discountType, discountValue, rest });

    // Convert DateTime strings to Date objects (Prisma requires this)
    rest.dueDate = rest.dueDate ? new Date(rest.dueDate) : null;
    rest.deliveryDate = rest.deliveryDate ? new Date(rest.deliveryDate) : null;

    // Sanitize: convert empty strings to null for all optional string fields
    const stringFields = ['customer','customerEn','customerAddress','customerAddressEn','customerTaxId','customerPhone','note','refNo','poNumber','deliveryMethod','recipient','preparerName','approverName'];
    for (const f of stringFields) {
      if (rest[f] === '') rest[f] = null;
    }

    // Remove 'no' from rest (will be overridden by generated number)
    delete rest.no;

    // Ensure numeric fields are numbers
    if (rest.whtRate !== undefined) rest.whtRate = parseFloat(rest.whtRate) || 0;

    const docDate = date ? new Date(date) : new Date();
    const no = await generateDocNumber(type, docDate);
    const whtRate = parseFloat(rest.whtRate) || 0;
    const { total, netPayable } = calculateTotal(items, vatType, discountType, parseFloat(discountValue) || 0, whtRate);

    const createData = {
      ...rest,
      type,
      no,
      date: docDate,
      vatType,
      discountType,
      discountValue: parseFloat(discountValue) || 0,
      whtRate,
      total,
      netPayable: whtRate > 0 ? netPayable : null,
      items: { create: items.map(item => ({ name: item.name, qty: parseFloat(item.qty) || 0, unit: item.unit || null, price: parseFloat(item.price) || 0 })) }
    };
    console.log('=== PRISMA CREATE DATA ===');
    console.log(JSON.stringify({ ...createData, items: createData.items }, null, 2));

    const newDoc = await prisma.document.create({
      data: {
        ...rest,
        type,
        no,
        date: docDate,
        vatType,
        discountType,
        discountValue: parseFloat(discountValue) || 0,
        whtRate,
        total,
        netPayable: whtRate > 0 ? netPayable : null,
        items: {
          create: items.map(item => ({
            name: item.name,
            qty: parseFloat(item.qty) || 0,
            unit: item.unit || null,
            price: parseFloat(item.price) || 0
          }))
        }
      },
      include: { items: true }
    });

    // --- WOW FACTOR: แอบบันทึก Master Data อัตโนมัติ ---
    // 1. บันทึก/อัปเดต ลูกค้า
    const customerName = rest.customer || rest.customerEn; // Use English name if Thai is missing
    if (customerName) {
      try {
        const customerData = {
          name: rest.customer || rest.customerEn, // Ensure unique name is always set
          nameEn: rest.customerEn,
          address: rest.customerAddress,
          addressEn: rest.customerAddressEn,
          taxId: rest.customerTaxId,
          phone: rest.customerPhone
        };
        
        await prisma.customer.upsert({
          where: { name: customerData.name },
          update: customerData,
          create: customerData
        });
      } catch (error) {
        console.error('Error auto-saving customer:', error);
      }
    }
    // 2. บันทึก/อัปเดต สินค้า (จำราคาล่าสุด + นับ usageCount)
    for (const item of items) {
      if (item.name) {
        await prisma.product.upsert({
          where: { name: item.name },
          update: { 
            price: parseFloat(item.price),
            unit: item.unit || null,
            usageCount: { increment: 1 }
          },
          create: { 
            name: item.name, 
            price: parseFloat(item.price),
            unit: item.unit || null,
            usageCount: 1
          }
        }).catch(err => console.error('Auto-save product failed:', err.message));
      }
    }

    res.status(201).json(newDoc);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ message: 'Failed to create document', detail: error.message, meta: error.meta });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const document = await prisma.document.update({
      where: { id: parseInt(id) },
      data: { status },
    });
    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.document.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'Document deleted', id: parseInt(id) });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.searchMasterData = async (req, res) => {
  const { type, q } = req.query;
  if (!q) return res.json([]);

  try {
    if (type === 'customer') {
      const results = await prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { nameEn: { contains: q } }
          ]
        },
        take: 10
      });
      res.json(results);
    } else if (type === 'product') {
      const results = await prisma.product.findMany({
        where: { name: { contains: q } },
        take: 10
      });
      res.json(results);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};