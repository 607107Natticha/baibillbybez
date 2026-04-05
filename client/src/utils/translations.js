// Translation system for Thai/English language switching

export const translations = {
  th: {
    // Document types
    quotation: 'ใบเสนอราคา',
    salesOrder: 'ใบสั่งขาย',
    deliveryOrder: 'ใบส่งของ',
    invoice: 'ใบแจ้งหนี้',
    
    // Document fields
    documentNo: 'เลขที่เอกสาร',
    date: 'วันที่',
    dueDate: 'วันครบกำหนด',
    validUntil: 'ยืนราคาถึงวันที่',
    
    // Customer info
    customer: 'ลูกค้า',
    customerName: 'ชื่อลูกค้า',
    address: 'ที่อยู่',
    taxId: 'เลขผู้เสียภาษี',
    phone: 'เบอร์โทร',
    email: 'อีเมล',
    
    // Company info
    from: 'จาก',
    to: 'ถึง',
    companyName: 'ชื่อบริษัท',
    
    // Items table
    items: 'รายการสินค้า',
    no: 'ลำดับ',
    itemName: 'รายการ',
    description: 'รายละเอียด',
    qty: 'จำนวน',
    unit: 'หน่วย',
    price: 'ราคา',
    pricePerUnit: 'ราคา/หน่วย',
    amount: 'จำนวนเงิน',
    total: 'รวม',
    
    // Pricing
    subtotal: 'รวมเป็นเงิน',
    discount: 'ส่วนลด',
    afterDiscount: 'หลังหักส่วนลด',
    vat: 'ภาษีมูลค่าเพิ่ม',
    vatPercent: 'VAT 7%',
    grandTotal: 'ยอดรวมสุทธิ',
    totalAmount: 'ยอดสุทธิ',
    baht: 'บาท',
    wht: 'หัก ณ ที่จ่าย',
    withholdingTax: 'ภาษีหัก ณ ที่จ่าย',
    netPayable: 'ยอดสุทธิที่ลูกค้าจ่าย',
    
    // Signatures
    buyer: 'ผู้สั่งซื้อสินค้า',
    seller: 'ผู้รับมอบอำนาจ',
    preparer: 'ผู้จัดทำ',
    authorized: 'ผู้มีอำนาจลงนาม',
    signature: 'ลายเซ็น',
    
    // Notes
    note: 'หมายเหตุ',
    terms: 'เงื่อนไข',
    termsAndConditions: 'เงื่อนไขและข้อกำหนด',
    remarks: 'หมายเหตุ',
    
    // Actions
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    back: 'กลับ',
    print: 'พิมพ์',
    preview: 'ดูตัวอย่าง',
    saveDocument: 'บันทึกเอกสาร',
    createDocument: 'สร้างเอกสารใหม่',
    addItem: 'เพิ่มรายการ',
    deleteItem: 'ลบ',
    addDays: 'เพิ่มวัน',
    days: 'วัน',
    
    // Status
    draft: 'ร่าง',
    approved: 'อนุมัติ',
    sent: 'ส่งแล้ว',
    paid: 'ชำระแล้ว',
    
    // Form labels
    customerInfo: 'ข้อมูลลูกค้า',
    itemsList: 'รายการสินค้า',
    discountAndVat: 'ส่วนลดและภาษี',
    notesSection: 'หมายเหตุ',
    autoGenerate: 'สร้างอัตโนมัติ',
    issueDate: 'วันที่ออกเอกสาร',
    paymentDueDate: 'วันครบกำหนดชำระ',
    vatType: 'ประเภทภาษี',
    includeVat: 'รวมภาษี',
    excludeVat: 'ไม่รวมภาษี',
    noVat: 'ไม่คิดภาษี',
    productName: 'ชื่อสินค้าหรือบริการที่',
    quantity: 'จำนวน',
    unitPrice: 'ราคา/หน่วย',
    discountPercent: 'ส่วนลด (%)',
    discountPercentLabel: 'ระบุเปอร์เซ็นต์ (0-100 เท่านั้น)',
    discountMaxError: 'ส่วนลดต้องไม่เกิน 100%',
    vatLabel: 'ภาษีมูลค่าเพิ่ม (VAT 7%)',
    noVAT: 'ไม่มี VAT',
    vatExclude: 'VAT นอก (+7%)',
    vatInclude: 'VAT ใน (รวมแล้ว)',
    termsAndNotes: 'เงื่อนไขหมายเหตุท้ายบิล',
    addMoreItems: 'เพิ่มรายการใหม่',
    
    // Settings Page
    settings: 'ตั้งค่า',
    companySettings: 'ตั้งค่าข้อมูลบริษัท',
    companyInfo: 'ข้อมูลบริษัท',
    bankAccount: 'บัญชีธนาคาร',
    template: 'เทมเพลต',
    uploadLogo: 'อัปโหลดโลโก้บริษัท',
    noLogo: 'ไม่มีโลโก้',
    selectImage: 'เลือกรูปภาพจากเครื่อง',
    deleteImage: 'ลบรูปภาพ',
    companySignature: 'ลายเซ็นบริษัท (แสดงในเอกสาร)',
    uploadMethod: 'อัปโหลดรูป',
    drawMethod: 'เซ็นด้วยเมาส์',
    noSignature: 'ไม่มีลายเซ็น',
    deleteSignature: 'ลบลายเซ็น',
    selectSignature: 'เลือกรูปลายเซ็น',
    signatureNote: 'ลายเซ็นจะแสดงพร้อมวันที่ลงนามอัตโนมัติในเอกสาร',
    companyNameTh: 'ชื่อบริษัท / ร้านค้า (ไทย)',
    companyNameEn: 'ชื่อบริษัท (English)',
    taxIdNumber: 'เลขประจำตัวผู้เสียภาษี',
    contactPhone: 'เบอร์โทรศัพท์ติดต่อ',
    companyAddress: 'ที่อยู่บริษัท',
    companyAddressEn: 'ที่อยู่บริษัท (English)',
    country: 'ประเทศ',
    postalCode: 'รหัสไปรษณีย์',
    bankInfo: 'ข้อมูลบัญชีรับเงิน (แสดงท้ายบิล)',
    selectBank: 'เลือกธนาคาร',
    customBank: 'เพิ่มธนาคารเอง',
    bankAccountName: 'ชื่อบัญชีรับเงิน',
    accountNumber: 'เลขที่บัญชี',
    specifyBankName: 'ระบุชื่อธนาคารของคุณ',
    uploadBankLogo: 'อัปโหลดรูปโลโก้ธนาคาร',
    selectTheme: 'เลือกสีธีม',
    selectLayout: 'เลือกรูปแบบ Layout',
    selectFont: 'เลือกฟอนต์',
    previewDocument: 'ตัวอย่างเอกสารแบบเต็มรูปแบบ',
    changeColor: 'เปลี่ยนสี:',
    saveAllSettings: 'บันทึกการตั้งค่าทั้งหมด',
    saving: 'กำลังบันทึก...',
    
    // Customers Page
    customers: 'ลูกค้า',
    manageCustomers: 'จัดการลูกค้า',
    addCustomer: 'เพิ่มลูกค้า',
    searchCustomers: 'ค้นหาลูกค้า...',
    loading: 'กำลังโหลด...',
    noCustomersFound: 'ไม่พบลูกค้าที่ค้นหา',
    noCustomersYet: 'ยังไม่มีข้อมูลลูกค้า',
    customerNameTh: 'ชื่อลูกค้า',
    customerNameEn: 'ชื่อลูกค้า (English)',
    customerAddressTh: 'ที่อยู่',
    customerAddressEn: 'ที่อยู่ (English)',
    editCustomer: 'แก้ไขลูกค้า',
    addNewCustomer: 'เพิ่มลูกค้าใหม่',
    required: '*',
    optional: '(ไม่บังคับ)',
    optionalEnglish: '(ไม่บังคับ - ใช้สำหรับออกบิลภาษาอังกฤษ)',
    manage: 'จัดการ',
    totalItems: 'ทั้งหมด',
    items: 'รายการ',
    
    // DO fields
    recipient: 'ผู้รับของ',
    deliveryDate: 'วันที่จัดส่ง',
    deliveryMethod: 'วิธีจัดส่ง',

    // Signatures
    preparerName: 'ชื่อผู้จัดทำ',
    approverName: 'ชื่อผู้อนุมัติ',
    signaturesSection: 'ลายเซ็น',
    preparerPlaceholder: 'ชื่อผู้จัดทำ / เตรียมเอกสาร',
    approverPlaceholder: 'ชื่อผู้อนุมัติ / ผู้มีอำนาจ',

    // Payment Info
    paymentInfo: 'ข้อมูลการชำระเงิน',
    bankName: 'ธนาคาร',
    accountName: 'ชื่อบัญชี',
    accountNumber: 'เลขที่บัญชี',

    // Discount Baht
    discountBaht: 'ส่วนลด (฿)',
    discountAmount: 'ส่วนลดเป็นจำนวนเงิน',

    // Item total
    itemTotal: 'รวม',

    // Status labels
    statusDraft: 'ร่าง',
    statusSent: 'ส่งแล้ว',
    statusApproved: 'อนุมัติ',
    statusConfirmed: 'ยืนยัน',
    statusDelivered: 'จัดส่งแล้ว',
    statusPending: 'ค้างชำระ',
    statusPaid: 'ชำระแล้ว',
    updateStatus: 'อัปเดตสถานะ',

    // Common
    home: 'หน้าหลัก',
    history: 'ประวัติ',
    dashboard: 'แดชบอร์ด',
    logout: 'ออกระบบ',
  },
  
  en: {
    // Document types
    quotation: 'Quotation',
    salesOrder: 'Sales Order',
    deliveryOrder: 'Delivery Order',
    invoice: 'Invoice',
    
    // Document fields
    documentNo: 'Document No.',
    date: 'Date',
    dueDate: 'Due Date',
    validUntil: 'Valid Until',
    
    // Customer info
    customer: 'Customer',
    customerName: 'Customer Name',
    address: 'Address',
    taxId: 'Tax ID',
    phone: 'Phone',
    email: 'Email',
    
    // Company info
    from: 'From',
    to: 'To',
    companyName: 'Company Name',
    
    // Items table
    items: 'Items',
    no: 'No.',
    itemName: 'Item',
    description: 'Description',
    qty: 'Qty',
    unit: 'Unit',
    price: 'Price',
    pricePerUnit: 'Price/Unit',
    amount: 'Amount',
    total: 'Total',
    
    // Pricing
    subtotal: 'Subtotal',
    discount: 'Discount',
    afterDiscount: 'After Discount',
    vat: 'VAT',
    vatPercent: 'VAT 7%',
    grandTotal: 'Grand Total',
    totalAmount: 'Total Amount',
    baht: 'THB',
    wht: 'WHT',
    withholdingTax: 'Withholding Tax',
    netPayable: 'Net Payable',
    
    // Signatures
    buyer: 'Buyer',
    seller: 'Seller',
    preparer: 'Preparer',
    authorized: 'Authorized Signature',
    signature: 'Signature',
    
    // Notes
    note: 'Note',
    terms: 'Terms & Conditions',
    termsAndConditions: 'Terms and Conditions',
    remarks: 'Remarks',
    
    // Actions
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',
    print: 'Print',
    preview: 'Preview',
    saveDocument: 'Save Document',
    createDocument: 'Create New Document',
    addItem: 'Add Item',
    deleteItem: 'Delete',
    addDays: 'Add Days',
    days: 'days',
    
    // Status
    draft: 'Draft',
    approved: 'Approved',
    sent: 'Sent',
    paid: 'Paid',
    
    // Form labels
    customerInfo: 'Customer Information',
    itemsList: 'Items List',
    discountAndVat: 'Discount & VAT',
    notesSection: 'Notes',
    autoGenerate: 'Auto Generate',
    issueDate: 'Issue Date',
    paymentDueDate: 'Payment Due Date',
    vatType: 'VAT Type',
    includeVat: 'Include VAT',
    excludeVat: 'Exclude VAT',
    noVat: 'No VAT',
    productName: 'Product/Service Name #',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    discountPercent: 'Discount (%)',
    discountPercentLabel: 'Enter percentage (0-100 only)',
    discountMaxError: 'Discount cannot exceed 100%',
    vatLabel: 'Value Added Tax (VAT 7%)',
    noVAT: 'No VAT',
    vatExclude: 'VAT Exclude (+7%)',
    vatInclude: 'VAT Include (Included)',
    termsAndNotes: 'Terms and Notes (Bottom of Invoice)',
    addMoreItems: 'Add New Item',
    
    // Settings Page
    settings: 'Settings',
    companySettings: 'Company Settings',
    companyInfo: 'Company Information',
    bankAccount: 'Bank Account',
    template: 'Template',
    uploadLogo: 'Upload Company Logo',
    noLogo: 'No Logo',
    selectImage: 'Select Image from Device',
    deleteImage: 'Delete Image',
    companySignature: 'Company Signature (Display in Documents)',
    uploadMethod: 'Upload Image',
    drawMethod: 'Draw with Mouse',
    noSignature: 'No Signature',
    deleteSignature: 'Delete Signature',
    selectSignature: 'Select Signature Image',
    signatureNote: 'Signature will be displayed with automatic signing date in documents',
    companyNameTh: 'Company Name (Thai)',
    companyNameEn: 'Company Name (English)',
    taxIdNumber: 'Tax ID Number',
    contactPhone: 'Contact Phone',
    companyAddress: 'Company Address',
    companyAddressEn: 'Company Address (English)',
    country: 'Country',
    postalCode: 'Postal Code',
    bankInfo: 'Bank Account Information (Display at Bottom of Invoice)',
    selectBank: 'Select Bank',
    customBank: 'Add Custom Bank',
    bankAccountName: 'Account Name',
    accountNumber: 'Account Number',
    specifyBankName: 'Specify Your Bank Name',
    uploadBankLogo: 'Upload Bank Logo',
    selectTheme: 'Select Theme Color',
    selectLayout: 'Select Layout Style',
    selectFont: 'Select Font',
    previewDocument: 'Full Document Preview',
    changeColor: 'Change Color:',
    saveAllSettings: 'Save All Settings',
    saving: 'Saving...',
    
    // Customers Page
    customers: 'Customers',
    manageCustomers: 'Manage Customers',
    addCustomer: 'Add Customer',
    searchCustomers: 'Search customers...',
    loading: 'Loading...',
    noCustomersFound: 'No customers found',
    noCustomersYet: 'No customers yet',
    customerNameTh: 'Customer Name',
    customerNameEn: 'Customer Name (English)',
    customerAddressTh: 'Address',
    customerAddressEn: 'Address (English)',
    editCustomer: 'Edit Customer',
    addNewCustomer: 'Add New Customer',
    required: '*',
    optional: '(Optional)',
    optionalEnglish: '(Optional - For English invoices only)',
    manage: 'Manage',
    totalItems: 'Total',
    items: 'items',
    
    // DO fields
    recipient: 'Recipient',
    deliveryDate: 'Delivery Date',
    deliveryMethod: 'Delivery Method',

    // Signatures
    preparerName: 'Preparer Name',
    approverName: 'Approver Name',
    signaturesSection: 'Signatures',
    preparerPlaceholder: 'Preparer / Document Creator Name',
    approverPlaceholder: 'Approver / Authorized Person Name',

    // Payment Info
    paymentInfo: 'Payment Information',
    bankName: 'Bank',
    accountName: 'Account Name',
    accountNumber: 'Account Number',

    // Discount Baht
    discountBaht: 'Discount (฿)',
    discountAmount: 'Discount as Fixed Amount',

    // Item total
    itemTotal: 'Total',

    // Status labels
    statusDraft: 'Draft',
    statusSent: 'Sent',
    statusApproved: 'Approved',
    statusConfirmed: 'Confirmed',
    statusDelivered: 'Delivered',
    statusPending: 'Outstanding',
    statusPaid: 'Paid',
    updateStatus: 'Update Status',

    // Common
    home: 'Home',
    history: 'History',
    dashboard: 'Dashboard',
    logout: 'Logout',
  }
};

// Helper function to get translation
export const t = (key, language = 'th') => {
  return translations[language]?.[key] || translations.th[key] || key;
};

// Helper function to format date as DD/MM/YYYY
export const formatDate = (dateString, language = 'th') => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = language === 'th' ? date.getFullYear() + 543 : date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Get document type name
export const getDocTypeName = (type, language = 'th') => {
  const typeMap = {
    QT: language === 'th' ? translations.th.quotation : translations.en.quotation,
    SO: language === 'th' ? translations.th.salesOrder : translations.en.salesOrder,
    DO: language === 'th' ? translations.th.deliveryOrder : translations.en.deliveryOrder,
    IV: language === 'th' ? translations.th.invoice : translations.en.invoice,
  };
  return typeMap[type] || type;
};
