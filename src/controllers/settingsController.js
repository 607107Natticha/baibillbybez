const prisma = require('../prisma');

const SETTINGS_ID = 1;

exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.companySetting.findUnique({
      where: { id: SETTINGS_ID },
    });

    if (!settings) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลการตั้งค่า' });
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    console.error('Error message:', error.message);
    if (error.meta) {
      console.error('Error meta:', error.meta);
    }
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในระบบ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    // กรอง fields ที่อนุญาตให้อัปเดตเท่านั้น (ตาม schema)
    const allowedFields = [
      'companyName', 'companyNameEn', 'address', 'addressEn',
      'country', 'postalCode', 'taxId', 'phone', 'email',
      'logoText', 'logoImage', 
      'bankName', 'customBankName', 'customBankLogo',
      'bankAccountName', 'bankAccountNumber',
      'condQT', 'condSO', 'condDO', 'condIV',
      'templateTheme', 'templateLayout', 'fontFamily',
      'signatureImage', 'signatureMethod', 'preparerName', 'paymentQrImage',
      'defaultCurrency', 'currencySymbol', 'secondaryCurrency', 'exchangeRateToSecondary'
    ];
    
    const filteredData = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        filteredData[key] = req.body[key];
      }
    }

    const updatedSettings = await prisma.companySetting.update({
      where: { id: SETTINGS_ID },
      data: filteredData,
    });

    res.json({ message: 'บันทึกข้อมูลสำเร็จ', data: updatedSettings });
  } catch (error) {
    console.error('Update settings error:', error);
    console.error('Error message:', error.message);
    if (error.meta) {
      console.error('Error meta:', error.meta);
    }
    res.status(500).json({ 
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};