const prisma = require('../prisma');

// Get popular products (top 10 by usage count)
exports.getPopularProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { usageCount: 'desc' },
      take: 10
    });
    res.json(products);
  } catch (error) {
    console.error('Get popular products error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้ายอดนิยม' });
  }
};
