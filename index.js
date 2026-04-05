import React, { useState, useEffect } from 'react';
import { 
  Home, FileText, Users, Settings, PlusCircle, Printer, Save, 
  ArrowRight, CheckCircle, Clock, Trash2, Share2, MessageCircle, 
  Link as LinkIcon, LogIn, Eye, Download, Mail, Building, CreditCard,
  Edit, EyeOff, Truck, Calendar, History
} from 'lucide-react';

// --- INITIAL STATES & MOCK DATA ---
const initialSettings = {
  companyName: 'บริษัท รักดีการค้า จำกัด (สำนักงานใหญ่)',
  address: '123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
  taxId: '0105555555555',
  phone: '02-123-4567, 081-999-9999',
  logoText: 'RD',
  logoImage: null,
  bankName: 'kbank',
  customBankName: '',
  customBankLogo: null,
  bankAccountName: 'บจก. รักดีการค้า',
  bankAccountNumber: '123-4-56789-0',
  condQT: '1. ขนาดยืนยันราคาภายใน 30 วัน นับจากวันที่เสนอราคา\n2. การรับประกันสินค้า 1 ปี นับจากวันส่งมอบ',
  condSO: '1. กรุณาชำระเงินมัดจำ 50% เพื่อยืนยันการสั่งซื้อ\n2. กำหนดส่งสินค้าภายใน 7-15 วันทำการ',
  condDO: '1. ได้รับสินค้าในสภาพสมบูรณ์เรียบร้อยแล้ว\n2. โปรดตรวจสอบสินค้าทันทีที่ได้รับ',
  condIV: '1. กรณีชำระเงินล่าช้าเกินกำหนด คิดดอกเบี้ย 1.5% ต่อเดือน\n2. สินค้าซื้อแล้วไม่รับเปลี่ยนหรือคืนในทุกกรณี'
};

const bankConfig = {
  kbank: { name: 'ธนาคารกสิกรไทย', color: 'bg-[#00A950]', iconText: 'K' },
  scb: { name: 'ธนาคารไทยพาณิชย์', color: 'bg-[#4E2A84]', iconText: 'SCB' },
  bbl: { name: 'ธนาคารกรุงเทพ', color: 'bg-[#1E4598]', iconText: 'BBL' },
  ktb: { name: 'ธนาคารกรุงไทย', color: 'bg-[#00AEEF]', iconText: 'KTB' },
  custom: { name: 'เพิ่มธนาคารเอง', color: 'bg-gray-700', iconText: '+' },
};

const initialDocs = [
  { id: 1, type: 'QT', no: 'QT-6903-0001', date: '2026-03-01', customer: 'ร้าน สมใจการค้า', customerAddress: 'เชียงใหม่', customerTaxId: '0505555555555', items: [{id:1, name:'สินค้า A', qty:10, price: 850}], vatType:'none', discountType:'amount', discountValue:0, whtRate:0, note: 'เงื่อนไข QT', total: 8500, status: 'รออนุมัติ', refNo: '' },
  { id: 2, type: 'SO', no: 'SO-6903-0001', date: '2026-03-02', customer: 'ร้าน สมใจการค้า', customerAddress: 'เชียงใหม่', customerTaxId: '0505555555555', items: [{id:1, name:'สินค้า A', qty:10, price: 850}], vatType:'none', discountType:'amount', discountValue:0, whtRate:0, note: 'เงื่อนไข SO', total: 8500, status: 'เตรียมจัดส่ง', refNo: 'QT-6903-0001' },
];

// --- Helper Functions สำหรับจัดการวันที่ ---
const formatThaiDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const addDays = (dateStr, days) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('sabaibill_docs');
    return saved ? JSON.parse(saved) : initialDocs;
  });
  const [editingDoc, setEditingDoc] = useState(null);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('sabaibill_settings');
    return saved ? JSON.parse(saved) : initialSettings;
  });
  const [showModal, setShowModal] = useState({ show: false, message: '', type: 'success' }); 

  useEffect(() => { localStorage.setItem('sabaibill_docs', JSON.stringify(documents)); }, [documents]);
  useEffect(() => { localStorage.setItem('sabaibill_settings', JSON.stringify(settings)); }, [settings]);

  // --- LOGIC FUNCTIONS ---
  
  const generateDocNumber = (type) => {
    const d = new Date();
    const year = (d.getFullYear() + 543).toString().slice(-2);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `${type}-${year}${month}-`;
    const existingDocs = documents.filter(doc => doc.no.startsWith(prefix));
    const nextSeq = (existingDocs.length + 1).toString().padStart(4, '0');
    return `${prefix}${nextSeq}`;
  };

  const calculateTotal = (doc) => {
    if (!doc || !doc.items) return { subtotal: 0, discountAmt: 0, baseAmount: 0, vatAmt: 0, whtAmt: 0, grandTotal: 0, netPayable: 0 };
    const subtotal = doc.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    let discountAmt = doc.discountType === 'percent' ? subtotal * ((parseFloat(doc.discountValue) || 0) / 100) : (parseFloat(doc.discountValue) || 0);
    const totalAfterDiscount = subtotal - discountAmt;

    let vatAmt = 0; let baseAmount = totalAfterDiscount; let grandTotal = totalAfterDiscount;
    if (doc.vatType === 'exclude') {
      vatAmt = totalAfterDiscount * 0.07;
      grandTotal = totalAfterDiscount + vatAmt;
    } else if (doc.vatType === 'include') {
      baseAmount = totalAfterDiscount / 1.07;
      vatAmt = totalAfterDiscount - baseAmount;
    }

    const whtAmt = baseAmount * ((parseFloat(doc.whtRate) || 0) / 100);
    return { subtotal, discountAmt, baseAmount, vatAmt, whtAmt, grandTotal, netPayable: grandTotal - whtAmt };
  };

  const getDocumentHistory = (currentDoc) => {
    if (!currentDoc) return [];
    let chain = [];
    
    let curr = currentDoc;
    while (curr && curr.refNo) {
       const parent = documents.find(d => d.no === curr.refNo);
       if (parent) { chain.unshift(parent); curr = parent; }
       else break;
    }
    
    if (!chain.find(d => d.no === currentDoc.no)) {
        chain.push(currentDoc);
    }
    
    curr = currentDoc;
    const child = documents.find(d => d.refNo === curr.no);
    if (child && !chain.find(d => d.no === child.no)) {
        chain.push(child);
        const grandChild = documents.find(d => d.refNo === child.no);
        if (grandChild && !chain.find(d => d.no === grandChild.no)) {
            chain.push(grandChild);
        }
    }
    
    return chain;
  };

  const handleCreateNew = (type = 'QT', sourceDoc = null) => {
    const autoNo = generateDocNumber(type);
    
    const today = new Date();
    const autoDate = today.toISOString().split('T')[0];
    
    const dDate = new Date(); dDate.setDate(today.getDate() + 15);
    const autoDueDate = dDate.toISOString().split('T')[0];

    let defaultNote = '';
    if (type === 'QT') defaultNote = settings.condQT;
    else if (type === 'SO') defaultNote = settings.condSO;
    else if (type === 'DO') defaultNote = settings.condDO;
    else if (type === 'IV') defaultNote = settings.condIV;

    let newDoc = {
      id: Date.now(),
      type: type,
      no: autoNo,
      date: autoDate,
      dueDate: autoDueDate, 
      customer: '', customerAddress: '', customerTaxId: '',
      items: [{ id: 1, name: '', qty: 1, price: 0 }],
      vatType: 'none', discountType: 'amount', discountValue: 0, whtRate: 0,
      note: defaultNote,
      refNo: '', 
      poNumber: '',
      hidePrice: type === 'DO', 
      deliveryDate: autoDate, 
      deliveryMethod: '',     
      status: 'ร่าง'
    };

    if (sourceDoc) {
      newDoc = {
        ...newDoc,
        customer: sourceDoc.customer, customerAddress: sourceDoc.customerAddress, customerTaxId: sourceDoc.customerTaxId,
        items: [...sourceDoc.items],
        vatType: sourceDoc.vatType, discountType: sourceDoc.discountType, discountValue: sourceDoc.discountValue, whtRate: sourceDoc.whtRate,
        refNo: sourceDoc.no, 
        poNumber: sourceDoc.poNumber || '', 
        deliveryDate: sourceDoc.deliveryDate || autoDate,
        deliveryMethod: sourceDoc.deliveryMethod || '',
      };
    }
    setEditingDoc(newDoc);
    setCurrentTab('editor');
  };

  const handleSaveDocument = (status = 'รอดำเนินการ') => {
    const exists = documents.find(d => d.id === editingDoc.id);
    const { grandTotal } = calculateTotal(editingDoc);
    
    let finalStatus = status;
    if (status === 'รอดำเนินการ') {
        if (editingDoc.type === 'QT') finalStatus = 'รออนุมัติ';
        if (editingDoc.type === 'SO') finalStatus = 'เตรียมจัดส่ง';
        if (editingDoc.type === 'DO') finalStatus = 'รอเปิดบิล';
        if (editingDoc.type === 'IV') finalStatus = 'รอชำระเงิน';
    }

    const docToSave = { ...editingDoc, total: grandTotal, status: finalStatus };

    if (exists) setDocuments(documents.map(d => d.id === editingDoc.id ? docToSave : d));
    else setDocuments([docToSave, ...documents]);
    
    return docToSave;
  };

  // --- COMPONENTS ---

  const LoginScreen = () => (
    <div className="min-h-screen bg-blue-600 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md text-center transform transition-all">
        <div className="mb-6 mx-auto flex items-center justify-center">
          {/* เปลี่ยน src="/logo.png" เป็นชื่อไฟล์ของคุณ */}
          <img src="/logo.png" alt="App Logo" className="w-32 h-32 object-contain" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">สบายบิล</h1>
        <p className="text-xl text-gray-500 mb-8">ระบบเปิดบิลสำหรับมืออาชีพ</p>
        
        <div className="space-y-6 text-left">
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">เบอร์โทรศัพท์มือถือ</label>
            <input type="tel" defaultValue="0812345678" className="w-full p-4 text-2xl border-2 border-gray-300 rounded-xl focus:border-blue-500 text-center tracking-widest bg-gray-50" />
          </div>
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2">รหัสผ่าน PIN 6 หลัก</label>
            <input type="password" defaultValue="123456" maxLength="6" className="w-full p-4 text-3xl border-2 border-gray-300 rounded-xl focus:border-blue-500 text-center tracking-[1em] bg-gray-50" />
          </div>
          <button onClick={() => setIsLoggedIn(true)} className="w-full py-4 bg-blue-600 text-white font-bold text-2xl rounded-xl hover:bg-blue-700 transition shadow-lg mt-4 flex items-center justify-center">
            เข้าสู่ระบบ <LogIn className="ml-3 w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );

  const SettingsScreen = () => {
    const handleImageUpload = (e, target) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (target === 'logo') setSettings({...settings, logoImage: reader.result});
                if (target === 'bank') setSettings({...settings, customBankLogo: reader.result});
            };
            reader.readAsDataURL(file);
        }
    };

    return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Settings className="w-8 h-8 mr-3 text-blue-600" /> ตั้งค่าข้อมูลบริษัท (ใส่ครั้งเดียวจบ)
      </h2>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-8">
        <div className="bg-blue-600 text-white px-6 py-4">
          <h3 className="text-xl font-bold">1. โลโก้ และ ข้อมูลหัวกระดาษ</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-blue-200 bg-blue-50 p-6 rounded-xl text-center mb-6 relative">
             <label className="block text-lg font-bold text-gray-700 mb-4">อัปโหลดโลโก้บริษัท</label>
             {settings.logoImage ? (
                 <div className="flex flex-col items-center">
                    <img src={settings.logoImage} alt="Logo" className="w-32 h-32 object-contain bg-white border border-gray-300 rounded-lg shadow-sm mb-4" />
                    <button onClick={() => setSettings({...settings, logoImage: null})} className="text-red-500 font-bold underline">ลบรูปภาพ</button>
                 </div>
             ) : (
                 <div className="w-24 h-24 bg-white border border-gray-300 rounded-xl mx-auto flex items-center justify-center text-gray-400 font-bold mb-4 shadow-sm">ไม่มีโลโก้</div>
             )}
             <div className="mt-4">
                <input type="file" accept="image/*" id="logo-upload" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
                <label htmlFor="logo-upload" className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition inline-block">เลือกรูปภาพจากเครื่อง</label>
             </div>
          </div>
          <div><label className="block text-lg font-bold text-gray-700 mb-2">ชื่อบริษัท / ร้านค้า</label><input type="text" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.companyName} onChange={e => setSettings({...settings, companyName: e.target.value})} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-lg font-bold text-gray-700 mb-2">เลขประจำตัวผู้เสียภาษี</label><input type="text" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.taxId} onChange={e => setSettings({...settings, taxId: e.target.value})} /></div>
            <div><label className="block text-lg font-bold text-gray-700 mb-2">เบอร์โทรศัพท์ติดต่อ</label><input type="text" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} /></div>
          </div>
          <div><label className="block text-lg font-bold text-gray-700 mb-2">ที่อยู่บริษัท</label><textarea rows="2" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-8">
        <div className="bg-green-600 text-white px-6 py-4">
          <h3 className="text-xl font-bold flex items-center"><CreditCard className="w-6 h-6 mr-2" /> 2. ข้อมูลบัญชีรับเงิน (แสดงท้ายบิล)</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-lg font-bold text-gray-700 mb-2">เลือกธนาคาร</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.keys(bankConfig).map(key => (
                <button 
                  key={key}
                  onClick={() => setSettings({...settings, bankName: key})}
                  className={`p-3 border-2 rounded-xl font-bold flex flex-col items-center justify-center transition ${settings.bankName === key ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-200' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className={`w-12 h-12 ${bankConfig[key].color} text-white rounded-full flex items-center justify-center text-xl font-black mb-2 shadow-sm`}>{bankConfig[key].iconText}</div>
                  <span className="text-sm text-gray-700 text-center mt-1">{bankConfig[key].name}</span>
                </button>
              ))}
            </div>
          </div>

          {settings.bankName === 'custom' && (
            <div className="md:col-span-2 bg-gray-50 border-2 border-dashed border-gray-300 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white border border-gray-300 flex items-center justify-center flex-shrink-0">
                    {settings.customBankLogo ? <img src={settings.customBankLogo} alt="Bank Logo" className="w-full h-full object-cover" /> : <CreditCard className="text-gray-400" />}
                </div>
                <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-gray-600 mb-1">ระบุชื่อธนาคารของคุณ</label>
                    <input type="text" placeholder="เช่น ธนาคารออมสิน..." className="w-full p-2 border border-gray-300 rounded-lg mb-2" value={settings.customBankName} onChange={e => setSettings({...settings, customBankName: e.target.value})} />
                    <input type="file" accept="image/*" id="bank-upload" className="hidden" onChange={(e) => handleImageUpload(e, 'bank')} />
                    <label htmlFor="bank-upload" className="cursor-pointer text-sm bg-gray-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-900 inline-block">อัปโหลดรูปโลโก้ธนาคาร</label>
                </div>
            </div>
          )}

          <div><label className="block text-lg font-bold text-gray-700 mb-2">ชื่อบัญชีรับเงิน</label><input type="text" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.bankAccountName} onChange={e => setSettings({...settings, bankAccountName: e.target.value})} /></div>
          <div><label className="block text-lg font-bold text-gray-700 mb-2">เลขที่บัญชี</label><input type="text" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl tracking-wider font-bold text-blue-700" value={settings.bankAccountNumber} onChange={e => setSettings({...settings, bankAccountNumber: e.target.value})} /></div>
        </div>
      </div>

      <button 
        onClick={() => {
          setShowModal({ show: true, message: 'บันทึกการตั้งค่าบริษัทเรียบร้อย', type: 'success' });
          setTimeout(() => { setShowModal({show: false}); setCurrentTab('dashboard'); }, 1500);
        }}
        className="w-full py-4 bg-blue-600 text-white font-bold text-2xl rounded-xl hover:bg-blue-700 transition shadow-lg flex items-center justify-center"
      >
        <Save className="mr-2 w-6 h-6" /> บันทึกการตั้งค่าทั้งหมด
      </button>
    </div>
  )};

  const DocumentPreview = () => {
    if (!editingDoc) return null;
    const { subtotal, discountAmt, baseAmount, vatAmt, whtAmt, grandTotal, netPayable } = calculateTotal(editingDoc);
    const bank = bankConfig[settings.bankName];
    
    let docTitle = ''; let headerColor = '';
    if (editingDoc.type === 'QT') { docTitle = 'ใบเสนอราคา (Quotation)'; headerColor = 'text-blue-900'; }
    else if (editingDoc.type === 'SO') { docTitle = 'ใบสั่งขาย (Sales Order)'; headerColor = 'text-orange-600'; }
    else if (editingDoc.type === 'DO') { docTitle = 'ใบส่งของ (Delivery Order)'; headerColor = 'text-green-700'; }
    else if (editingDoc.type === 'IV') { docTitle = 'ใบแจ้งหนี้ / ใบเสร็จรับเงิน (Invoice / Receipt)'; headerColor = 'text-purple-800'; }

    const docHistory = getDocumentHistory(editingDoc);

    return (
      <div className="bg-gray-200 min-h-screen p-4 md:p-8 pb-32">
        <style>{`
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 0; size: auto; }
          }
        `}</style>
        <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center print:hidden">
          <button onClick={() => setCurrentTab('editor')} className="flex items-center px-4 py-2 bg-white text-gray-700 font-bold rounded-lg shadow hover:bg-gray-50">
            <Edit className="w-5 h-5 mr-2" /> กลับไปแก้ไข
          </button>
          <div className="text-gray-600 font-bold flex items-center">
            <Eye className="w-5 h-5 mr-2" /> ตัวอย่างก่อนส่งจริง (Preview)
          </div>
        </div>

        {docHistory.length > 1 && (
            <div className="max-w-[210mm] mx-auto mb-4 bg-white border border-gray-300 p-4 rounded-xl shadow-sm animate-fade-in-up print:hidden">
                <div className="text-sm font-bold text-gray-500 mb-3 flex items-center"><History className="w-4 h-4 mr-1"/> ประวัติเส้นทางเอกสาร (กดเพื่อดูบิลเก่าได้):</div>
                <div className="flex flex-wrap items-center gap-2">
                    {docHistory.map((doc, idx) => (
                        <React.Fragment key={doc.no}>
                            <div 
                                onClick={() => { if(doc.no !== editingDoc.no) setEditingDoc(doc); }}
                                className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center transition ${doc.no === editingDoc.no ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 cursor-pointer border border-gray-200'}`}
                            >
                                <FileText className="w-4 h-4 mr-1"/> {doc.no}
                            </div>
                            {idx < docHistory.length - 1 && <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        )}

        {['QT', 'SO', 'DO'].includes(editingDoc.type) && (
          <div className="max-w-[210mm] mx-auto mb-6 bg-indigo-50 border-2 border-indigo-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in-up print:hidden">
            <div className="text-indigo-800 font-bold flex items-center text-lg">
              <ArrowRight className="w-8 h-8 mr-3 text-indigo-600 flex-shrink-0" /> 
              <span>ตกลงเรียบร้อยใช่ไหม?<br/><span className="text-sm font-normal">ดึงข้อมูลใบนี้ไปเปิดบิลขั้นต่อไปได้เลย ระบบจะคัดลอกให้ทั้งหมด!</span></span>
            </div>
            
            {editingDoc.type === 'QT' && (
                <button onClick={() => handleCreateNew('SO', editingDoc)} className="w-full md:w-auto px-6 py-4 bg-orange-500 text-white font-bold text-xl rounded-xl shadow-lg hover:bg-orange-600 whitespace-nowrap">
                แปลงเป็น "ใบสั่งขาย (SO)"
                </button>
            )}
            
            {editingDoc.type === 'SO' && (
                <button onClick={() => handleCreateNew('DO', editingDoc)} className="w-full md:w-auto px-6 py-4 bg-green-600 text-white font-bold text-xl rounded-xl shadow-lg hover:bg-green-700 whitespace-nowrap">
                เตรียมส่งของ "สร้างใบส่งของ (DO)"
                </button>
            )}

            {editingDoc.type === 'DO' && (
                <button onClick={() => handleCreateNew('IV', editingDoc)} className="w-full md:w-auto px-6 py-4 bg-purple-600 text-white font-bold text-xl rounded-xl shadow-lg hover:bg-purple-700 whitespace-nowrap">
                เก็บเงิน! "สร้างใบแจ้งหนี้ (IV)"
                </button>
            )}
          </div>
        )}

        <div className="w-full overflow-x-auto pb-8">
          <div className="min-w-[800px] max-w-[210mm] mx-auto bg-white p-8 md:p-12 shadow-2xl rounded-sm text-gray-800" style={{ minHeight: '297mm' }}>
            
            <div className="flex justify-between items-start border-b-2 border-gray-300 pb-6 mb-6">
              <div className="flex items-center">
                {settings.logoImage ? (
                  <img src={settings.logoImage} alt="Company Logo" className="w-24 h-24 object-contain mr-4" />
                ) : (
                  <div className="w-20 h-20 bg-blue-800 text-white font-black text-3xl flex items-center justify-center rounded-xl mr-4 shadow-md">{settings.logoText}</div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{settings.companyName}</h1>
                  <p className="text-sm mt-1 text-gray-600">{settings.address}</p>
                  <p className="text-sm mt-1 text-gray-600">โทร: {settings.phone} | เลขผู้เสียภาษี: {settings.taxId}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className={`text-2xl font-black mb-2 ${headerColor}`}>{docTitle}</h2>
                <p className="text-sm"><span className="font-bold">เลขที่:</span> {editingDoc.no}</p>
                <p className="text-sm"><span className="font-bold">วันที่:</span> {formatThaiDate(editingDoc.date)}</p>
                {editingDoc.dueDate && <p className="text-sm mt-1 text-red-600"><span className="font-bold">{editingDoc.type === 'QT' ? 'ยืนราคาถึง:' : 'กำหนดชำระ:'}</span> {formatThaiDate(editingDoc.dueDate)}</p>}
                {editingDoc.poNumber && <p className="text-sm mt-1 text-blue-700"><span className="font-bold">อ้างอิง PO:</span> {editingDoc.poNumber}</p>}
                {editingDoc.refNo && <p className="text-sm text-gray-500"><span className="font-bold">อ้างอิงเอกสาร:</span> {editingDoc.refNo}</p>}
              </div>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-[2] bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-sm font-bold text-gray-700 mb-1">ลูกค้า (Customer):</p>
                  <p className="font-bold text-lg">{editingDoc.customer || '-'}</p>
                  <p className="text-sm mt-1 text-gray-700">{editingDoc.customerAddress || '-'}</p>
                  <p className="text-sm mt-1 text-gray-700">เลขผู้เสียภาษี: {editingDoc.customerTaxId || '-'}</p>
                </div>
                
                {editingDoc.type === 'DO' && (
                    <div className="flex-1 bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm font-bold text-green-800 mb-1">ข้อมูลการจัดส่ง (Delivery Info):</p>
                      <p className="text-sm mt-1"><span className="font-bold">วันที่จัดส่ง:</span> {formatThaiDate(editingDoc.deliveryDate) || '-'}</p>
                      <p className="text-sm mt-1"><span className="font-bold">วิธีจัดส่ง / ทะเบียนรถ:</span></p>
                      <p className="font-bold">{editingDoc.deliveryMethod || '-'}</p>
                    </div>
                )}
            </div>

            <table className="w-full mb-6 text-sm">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="p-3 text-center w-12 rounded-tl-lg">ลำดับ</th>
                  <th className="p-3 text-left">รายการสินค้า / บริการ</th>
                  <th className="p-3 text-center w-24">จำนวน</th>
                  {editingDoc.hidePrice ? (
                    <th className="p-3 w-32 rounded-tr-lg"></th>
                  ) : (
                    <>
                      <th className="p-3 text-right w-32">ราคา/หน่วย</th>
                      <th className="p-3 text-right w-32 rounded-tr-lg">จำนวนเงิน</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {editingDoc.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="p-3 text-center text-gray-600">{idx + 1}</td>
                    <td className="p-3 font-medium text-gray-800">{item.name || '-'}</td>
                    <td className="p-3 text-center font-bold">{item.qty}</td>
                    {editingDoc.hidePrice ? (
                      <td className="p-3"></td>
                    ) : (
                      <>
                        <td className="p-3 text-right text-gray-600">{item.price.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                        <td className="p-3 text-right font-bold text-gray-800">{(item.qty * item.price).toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col md:flex-row gap-6 mb-8 mt-12">
              <div className="flex-[2] flex flex-col gap-4">
                <div className="text-sm text-gray-600">
                  <p className="font-bold text-gray-800 mb-1">หมายเหตุ / เงื่อนไข:</p>
                  <div className="whitespace-pre-line text-xs leading-relaxed">{editingDoc.note || '-ไม่มีหมายเหตุ-'}</div>
                </div>
                
                {editingDoc.type !== 'DO' && (
                <div className="border border-gray-300 rounded-xl p-4 flex items-center shadow-sm max-w-sm mt-4">
                  {settings.bankName === 'custom' ? (
                      <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-300 mr-4 flex-shrink-0 bg-white flex items-center justify-center">
                          {settings.customBankLogo ? <img src={settings.customBankLogo} alt="Bank" className="w-full h-full object-cover" /> : <CreditCard className="text-gray-400" />}
                      </div>
                  ) : (
                      <div className={`w-14 h-14 ${bankConfig[settings.bankName].color} text-white rounded-full flex items-center justify-center text-xl font-black mr-4 flex-shrink-0`}>{bankConfig[settings.bankName].iconText}</div>
                  )}
                  
                  <div>
                    <p className="text-sm font-bold text-gray-500 mb-1">โอนเงินเข้าบัญชี</p>
                    <p className="font-bold text-lg text-gray-800">{settings.bankName === 'custom' ? settings.customBankName : bankConfig[settings.bankName].name}</p>
                    <p className="text-sm">ชื่อบัญชี: <span className="font-bold">{settings.bankAccountName}</span></p>
                    <p className="text-xl font-black text-blue-700 tracking-wider mt-1">{settings.bankAccountNumber}</p>
                  </div>
                </div>
                )}
              </div>

              {!editingDoc.hidePrice && (
              <div className="flex-1 border border-gray-300 rounded-xl p-4 bg-gray-50 flex flex-col justify-end space-y-2 text-sm ml-auto min-w-[250px]">
                <div className="flex justify-between"><span className="text-gray-600">รวมเป็นเงิน:</span> <span className="font-bold">{subtotal.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span></div>
                {discountAmt > 0 && <div className="flex justify-between text-red-600"><span>ส่วนลด:</span> <span className="font-bold">-{discountAmt.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span></div>}
                {editingDoc.vatType === 'include' && <div className="flex justify-between text-gray-500 text-xs"><span>(มูลค่าก่อนภาษี:</span> <span>{baseAmount.toLocaleString('th-TH', {minimumFractionDigits: 2})})</span></div>}
                {editingDoc.vatType !== 'none' && <div className="flex justify-between text-gray-600"><span>ภาษีมูลค่าเพิ่ม 7%:</span> <span className="font-bold">{vatAmt.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span></div>}
                <div className="flex justify-between items-center border-t border-gray-300 pt-2 pb-1">
                  <span className="font-bold text-gray-800 text-base">ยอดรวมทั้งสิ้น:</span>
                  <span className="font-black text-xl text-blue-800">{grandTotal.toLocaleString('th-TH', {minimumFractionDigits: 2})} ฿</span>
                </div>
                {whtAmt > 0 && <div className="flex justify-between text-purple-700 border-t border-purple-200 pt-2 text-xs"><span>หัก ณ ที่จ่าย ({editingDoc.whtRate}%):</span> <span className="font-bold">-{whtAmt.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span></div>}
                {whtAmt > 0 && <div className="flex justify-between items-center bg-purple-100 p-2 rounded text-purple-900 mt-1">
                  <span className="font-bold text-sm">ยอดสุทธิที่ต้องชำระ:</span>
                  <span className="font-black text-lg">{netPayable.toLocaleString('th-TH', {minimumFractionDigits: 2})} ฿</span>
                </div>}
              </div>
              )}
               {editingDoc.hidePrice && <div className="flex-1"></div>}
            </div>

            <div className="grid grid-cols-2 gap-12 mt-16 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="border-b-2 border-gray-400 border-dashed mx-8 mb-2 h-8"></div>
                <p className="text-sm font-bold text-gray-600">{editingDoc.type === 'DO' ? 'ผู้รับสินค้า' : 'ผู้รับเอกสาร / ผู้สั่งซื้อ'}</p>
                <p className="text-xs text-gray-400 mt-1">วันที่ _______/_______/_______</p>
              </div>
              <div className="text-center">
                <div className="border-b-2 border-gray-400 border-dashed mx-8 mb-2 h-8"></div>
                <p className="text-sm font-bold text-gray-600">{editingDoc.type === 'DO' ? 'ผู้ส่งสินค้า' : 'ผู้อนุมัติ / ผู้มีอำนาจลงนาม'}</p>
                <p className="text-xs text-gray-400 mt-1">ในนาม {settings.companyName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-gray-200 p-4 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.15)] z-50 print:hidden">
          <div className="max-w-5xl mx-auto flex flex-wrap gap-3 justify-center md:justify-end items-center">
            <button onClick={() => { handleSaveDocument(); setShowModal({ show: true, type: 'email', message: '' }); }} className="flex-1 md:flex-none flex justify-center items-center px-6 py-4 text-lg font-bold text-white bg-gray-800 rounded-xl hover:bg-gray-900 transition">
              <Mail className="w-6 h-6 mr-2" /> <span className="hidden sm:inline">ส่ง Email</span>
            </button>
            <button onClick={() => { handleSaveDocument(); window.print(); }} className="flex-1 md:flex-none flex justify-center items-center px-6 py-4 text-lg font-bold text-blue-700 bg-blue-100 border-2 border-blue-300 rounded-xl hover:bg-blue-200 transition">
              <Printer className="w-6 h-6 mr-2" /> <span className="hidden sm:inline">พิมพ์ / PDF</span>
            </button>
            <button onClick={() => { handleSaveDocument(); setShowModal({ show: true, type: 'share', message: '' }); }} className="w-full md:w-auto flex-none flex justify-center items-center px-10 py-4 text-xl font-bold text-white bg-[#00B900] rounded-xl hover:bg-[#009900] transition shadow-xl transform hover:scale-105">
              <Share2 className="w-6 h-6 mr-2" /> แชร์ไป LINE
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DocumentEditor = () => {
    if (!editingDoc) return null;
    let docName = ''; let headerColor = '';
    
    if (editingDoc.type === 'QT') { docName = 'ใบเสนอราคา (Quotation)'; headerColor = 'bg-blue-600'; }
    else if (editingDoc.type === 'SO') { docName = 'ใบสั่งขาย (Sales Order)'; headerColor = 'bg-orange-500'; }
    else if (editingDoc.type === 'DO') { docName = 'ใบส่งของ (Delivery Order)'; headerColor = 'bg-green-600'; }
    else if (editingDoc.type === 'IV') { docName = 'ใบแจ้งหนี้ (Invoice)'; headerColor = 'bg-purple-600'; }

    return (
      <div className="p-2 md:p-8 max-w-4xl mx-auto pb-48">
        <div className={`${headerColor} text-white p-6 rounded-t-2xl shadow-md text-center md:text-left`}>
          <h2 className="text-3xl font-bold">{docName}</h2>
          <div className="flex flex-col lg:flex-row justify-between mt-4 text-lg md:text-xl font-medium gap-4">
            <div className="flex-1 bg-white bg-opacity-20 p-3 rounded-xl border border-white border-opacity-30">
                <span className="text-sm block opacity-80">เลขที่เอกสาร</span>
                <span className="font-bold">{editingDoc.no}</span>
            </div>
            <div className="flex-1 bg-white bg-opacity-20 p-3 rounded-xl border border-white border-opacity-30 flex items-center">
                <Calendar className="w-6 h-6 mr-2 opacity-80 flex-shrink-0" />
                <div className="flex-1">
                    <span className="text-sm block opacity-80">วันที่ออกเอกสาร</span>
                    <input type="date" className="w-full bg-transparent border-none p-0 text-white font-bold focus:ring-0 outline-none" value={editingDoc.date} onChange={e => {
                      const newDate = e.target.value;
                      const updatedDoc = {...editingDoc, date: newDate};
                      if (updatedDoc.dueDate && updatedDoc.dueDate <= newDate) {
                        updatedDoc.dueDate = addDays(newDate, 1);
                      }
                      setEditingDoc(updatedDoc);
                    }} />
                </div>
            </div>
            <div className="flex-[1.5] bg-white bg-opacity-20 p-3 rounded-xl border border-white border-opacity-30 flex flex-col justify-center">
                <div className="flex items-center mb-2">
                    <Clock className="w-6 h-6 mr-2 opacity-80 flex-shrink-0" />
                    <div className="flex-1">
                        <span className="text-sm block opacity-80">{editingDoc.type === 'QT' ? 'ยืนราคาถึงวันที่' : 'วันครบกำหนดชำระ'}</span>
                        <input type="date" min={addDays(editingDoc.date, 1)} className="w-full bg-transparent border-none p-0 text-white font-bold focus:ring-0 outline-none" value={editingDoc.dueDate || ''} onChange={e => setEditingDoc({...editingDoc, dueDate: e.target.value})} />
                    </div>
                </div>
                <div className="flex flex-wrap gap-1">
                   {[7, 10, 15, 20, 25, 30].map(days => (
                     <button 
                       key={days} 
                       onClick={() => setEditingDoc({...editingDoc, dueDate: addDays(editingDoc.date, days)})}
                       className="text-xs bg-white bg-opacity-20 hover:bg-opacity-40 text-white px-2 py-1 rounded font-bold transition flex-1 sm:flex-none"
                     >
                       +{days}
                     </button>
                   ))}
                </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 md:p-8 shadow-md border-x border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">1. ลูกค้า</h3>
          <input type="text" placeholder="พิมพ์ชื่อลูกค้า..." className="w-full p-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 mb-4 font-bold" value={editingDoc.customer} onChange={e => setEditingDoc({...editingDoc, customer: e.target.value})} />
          <textarea rows="2" placeholder="ที่อยู่ลูกค้า (เว้นว่างได้)" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl bg-gray-50 focus:border-blue-500 mb-4 resize-none" value={editingDoc.customerAddress || ''} onChange={e => setEditingDoc({...editingDoc, customerAddress: e.target.value})} />
          <input type="text" placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก (เว้นว่างได้)" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl bg-gray-50 focus:border-blue-500" value={editingDoc.customerTaxId || ''} onChange={e => setEditingDoc({...editingDoc, customerTaxId: e.target.value})} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t border-gray-200 pt-4">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">อ้างอิงเลขที่ PO จากลูกค้า (ถ้ามี)</label>
              <input type="text" placeholder="เช่น PO-2026-001" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl bg-gray-50 focus:border-blue-500" value={editingDoc.poNumber || ''} onChange={e => setEditingDoc({...editingDoc, poNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">อ้างอิงเอกสารเดิม</label>
              <input type="text" disabled placeholder="ระบบจะดึงมาให้อัตโนมัติ" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl bg-gray-200 text-gray-500 cursor-not-allowed" value={editingDoc.refNo || '-'} />
            </div>
          </div>
        </div>

        {editingDoc.type === 'DO' && (
            <div className="bg-green-50 p-5 md:p-8 shadow-md border-x border-b border-green-200 mt-4 rounded-xl">
              <h3 className="text-xl font-bold text-green-800 mb-4 border-b border-green-200 pb-2 flex items-center"><Truck className="w-6 h-6 mr-2"/> ข้อมูลการจัดส่งสินค้า</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-green-700 mb-1">วันที่จัดส่ง</label>
                    <input type="date" className="w-full p-3 text-lg border-2 border-green-300 rounded-xl bg-white focus:border-green-500" value={editingDoc.deliveryDate || ''} onChange={e => setEditingDoc({...editingDoc, deliveryDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-green-700 mb-1">วิธีจัดส่ง / ทะเบียนรถ / ชื่อคนขับ</label>
                    <input type="text" placeholder="เช่น กระบะ 1กข-1234 (นายสมชาย)" className="w-full p-3 text-lg border-2 border-green-300 rounded-xl bg-white focus:border-green-500" value={editingDoc.deliveryMethod || ''} onChange={e => setEditingDoc({...editingDoc, deliveryMethod: e.target.value})} />
                  </div>
              </div>
            </div>
        )}

        <div className="bg-white p-5 md:p-8 shadow-md border-x border-b border-gray-200 mt-4 rounded-xl">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-xl font-bold text-gray-800">2. สินค้า / บริการ</h3>
            
            {editingDoc.type === 'DO' && (
                <button onClick={() => setEditingDoc({...editingDoc, hidePrice: !editingDoc.hidePrice})} className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition border-2 ${editingDoc.hidePrice ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                  <EyeOff className="w-4 h-4 mr-2" /> {editingDoc.hidePrice ? 'ซ่อนราคาในใบ A4 แล้ว' : 'แสดงราคาปกติ'}
                </button>
            )}
          </div>
          
          {editingDoc.items.map((item, index) => (
            <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
              <input type="text" placeholder={`ชื่อสินค้ารายการที่ ${index + 1}`} className="w-full p-3 text-xl border-2 border-gray-300 rounded-lg focus:border-blue-500 mb-3 font-bold" value={item.name} onChange={e => { const items = [...editingDoc.items]; items[index].name = e.target.value; setEditingDoc({...editingDoc, items}); }} />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-600 mb-1">จำนวน</label>
                  <input type="number" className="w-full p-3 text-lg border-2 border-gray-300 rounded-lg text-center font-bold text-blue-700" value={item.qty || ''} onChange={e => { const items = [...editingDoc.items]; items[index].qty = parseFloat(e.target.value) || 0; setEditingDoc({...editingDoc, items}); }} />
                </div>
                <div className={`flex-1 ${editingDoc.hidePrice ? 'opacity-50 pointer-events-none' : ''}`}>
                  <label className="block text-sm font-bold text-gray-600 mb-1">ราคาต่อหน่วย</label>
                  <input type="number" className="w-full p-3 text-lg border-2 border-gray-300 rounded-lg text-right font-bold text-blue-700" value={item.price || ''} onChange={e => { const items = [...editingDoc.items]; items[index].price = parseFloat(e.target.value) || 0; setEditingDoc({...editingDoc, items}); }} />
                </div>
                <button onClick={() => { if(editingDoc.items.length > 1) setEditingDoc({...editingDoc, items: editingDoc.items.filter((_, i) => i !== index)}); }} className="mt-6 p-3 bg-red-100 text-red-600 rounded-lg h-[52px] w-[52px] flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => setEditingDoc({...editingDoc, items: [...editingDoc.items, { id: Date.now(), name: '', qty: 1, price: 0 }]})} className="w-full py-4 bg-blue-50 text-blue-700 font-bold text-xl border-2 border-blue-200 border-dashed rounded-xl flex items-center justify-center hover:bg-blue-100">
            <PlusCircle className="w-6 h-6 mr-2" /> เพิ่มรายการใหม่
          </button>
        </div>

        <div className={`bg-white p-5 md:p-8 shadow-md border-x border-b border-gray-200 mt-4 rounded-xl ${editingDoc.hidePrice ? 'opacity-50 pointer-events-none' : ''}`}>
           <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">3. ส่วนลด / ภาษี และ เงื่อนไข</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
               <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                 <label className="block text-lg font-bold text-red-700 mb-2">ส่วนลด (ถ้ามี)</label>
                 <div className="flex gap-2">
                    <input type="number" placeholder="ระบุตัวเลข..." className="flex-1 p-3 text-lg border-2 border-red-300 rounded-lg text-right focus:border-red-500 font-bold text-red-700" value={editingDoc.discountValue || ''} onChange={e => setEditingDoc({...editingDoc, discountValue: e.target.value})} />
                    <div className="flex rounded-lg border-2 border-red-300 overflow-hidden bg-white">
                        <button onClick={() => setEditingDoc({...editingDoc, discountType: 'amount'})} className={`px-4 font-bold transition ${editingDoc.discountType === 'amount' ? 'bg-red-600 text-white' : 'text-gray-500'}`}>บาท</button>
                        <button onClick={() => setEditingDoc({...editingDoc, discountType: 'percent'})} className={`px-4 font-bold transition ${editingDoc.discountType === 'percent' ? 'bg-red-600 text-white' : 'text-gray-500'}`}>%</button>
                    </div>
                 </div>
               </div>

               <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">ภาษีมูลค่าเพิ่ม (VAT 7%)</label>
                  <div className="flex flex-col gap-2">
                    {[{id: 'none', label: 'ไม่มี VAT'}, {id: 'exclude', label: 'VAT นอก (+7%)'}, {id: 'include', label: 'VAT ใน (รวมแล้ว)'}].map(v => (
                      <button key={v.id} onClick={() => setEditingDoc({...editingDoc, vatType: v.id})} className={`py-3 px-4 text-base font-bold rounded-xl border-2 transition ${editingDoc.vatType === v.id ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-600'}`}>{v.label}</button>
                    ))}
                  </div>
               </div>
           </div>

           <div>
              <label className="block text-lg font-bold text-gray-700 mb-2 flex justify-between">
                <span>เงื่อนไขหมายเหตุท้ายบิล</span>
                <span className="text-sm font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded-full">ดึงอัตโนมัติจากตั้งค่า</span>
              </label>
              <textarea rows="3" className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl bg-gray-50 focus:border-blue-500 whitespace-pre-line" value={editingDoc.note || ''} onChange={e => setEditingDoc({...editingDoc, note: e.target.value})} />
           </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] z-50">
          <div className="max-w-4xl mx-auto flex gap-4">
            <button onClick={() => setCurrentTab('dashboard')} className="px-6 py-4 text-xl font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">ยกเลิก</button>
            <button onClick={() => setCurrentTab('preview')} className="flex-1 px-8 py-4 text-2xl font-black text-white bg-indigo-600 rounded-xl shadow-lg flex justify-center items-center hover:bg-indigo-700 animate-pulse">
              <Eye className="w-8 h-8 mr-2" /> ดูตัวอย่างบิล / ดูประวัติเอกสาร
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => (
    <div className="p-4 md:p-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">แดชบอร์ด - {settings.companyName}</h2>
      </div>
      
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div onClick={() => handleCreateNew('QT')} className="bg-blue-600 p-4 md:p-6 rounded-2xl border-2 border-blue-700 cursor-pointer active:scale-95 transition-transform flex flex-col justify-center items-center text-white shadow-lg h-28 md:h-32 text-center">
          <PlusCircle className="w-8 h-8 md:w-10 md:h-10 mb-2" />
          <h3 className="text-lg md:text-xl font-bold">1. ใบเสนอราคา</h3>
        </div>
        <div onClick={() => handleCreateNew('SO')} className="bg-orange-500 p-4 md:p-6 rounded-2xl border-2 border-orange-600 cursor-pointer active:scale-95 transition-transform flex flex-col justify-center items-center text-white shadow-lg h-28 md:h-32 text-center">
          <PlusCircle className="w-8 h-8 md:w-10 md:h-10 mb-2" />
          <h3 className="text-lg md:text-xl font-bold">2. ใบสั่งขาย (SO)</h3>
        </div>
        <div onClick={() => handleCreateNew('DO')} className="bg-green-600 p-4 md:p-6 rounded-2xl border-2 border-green-700 cursor-pointer active:scale-95 transition-transform flex flex-col justify-center items-center text-white shadow-lg h-28 md:h-32 text-center">
          <PlusCircle className="w-8 h-8 md:w-10 md:h-10 mb-2" />
          <h3 className="text-lg md:text-xl font-bold">3. ใบส่งของ (DO)</h3>
        </div>
        <div onClick={() => handleCreateNew('IV')} className="bg-purple-600 p-4 md:p-6 rounded-2xl border-2 border-purple-700 cursor-pointer active:scale-95 transition-transform flex flex-col justify-center items-center text-white shadow-lg h-28 md:h-32 text-center">
          <PlusCircle className="w-8 h-8 md:w-10 md:h-10 mb-2" />
          <h3 className="text-lg md:text-xl font-bold">4. ใบแจ้งหนี้ (IV)</h3>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4 text-gray-800">เอกสารที่สร้างล่าสุด (ทั้งหมด)</h3>
      {documents.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border-2 border-dashed border-gray-300 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-xl">ยังไม่มีเอกสาร กดปุ่มสร้างบิลด้านบนได้เลยครับ</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col divide-y divide-gray-200">
          {documents.map(doc => {
              let badgeColor = ''; let typeName = '';
              if (doc.type === 'QT') { badgeColor = 'bg-blue-100 text-blue-800'; typeName = 'เสนอราคา'; }
              if (doc.type === 'SO') { badgeColor = 'bg-orange-100 text-orange-800'; typeName = 'สั่งขาย'; }
              if (doc.type === 'DO') { badgeColor = 'bg-green-100 text-green-800'; typeName = 'ส่งของ'; }
              if (doc.type === 'IV') { badgeColor = 'bg-purple-100 text-purple-800'; typeName = 'แจ้งหนี้'; }

              return (
                <div key={doc.id} className="p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => { setEditingDoc(doc); setCurrentTab('preview'); }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${badgeColor}`}>{typeName}</span>
                        <span className="text-lg font-bold text-gray-800">{doc.no}</span>
                    </div>
                    <div className="text-gray-600 font-medium text-sm md:text-base truncate w-48 md:w-auto">{doc.customer || 'ลูกค้าไม่ระบุชื่อ'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg md:text-xl font-black text-gray-900">{doc.hidePrice ? '-' : `${doc.total.toLocaleString('th-TH')} ฿`}</div>
                    <div className="text-xs md:text-sm text-gray-500 flex items-center justify-end mt-1"><Eye className="w-4 h-4 mr-1"/> ดู / แปลงบิล</div>
                  </div>
                </div>
              );
          })}
        </div>
      )}
    </div>
  );

  if (!isLoggedIn) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-24 md:pb-20">
      <nav className="bg-white shadow-md border-b-4 border-blue-600 sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
              {/* เปลี่ยน src="/logo.png" เป็นชื่อไฟล์ของคุณ */}
              <img src="/logo.png" alt="Logo" className="h-10 w-10 md:h-12 md:w-12 mr-2 md:mr-3 object-contain" />
              <span className="text-2xl font-black text-gray-900 tracking-tight">สบายบิล</span>
            </div>
            <div className="flex items-center space-x-2 md:space-x-8">
              <button onClick={() => setCurrentTab('dashboard')} className={`flex flex-col items-center p-2 border-b-4 ${currentTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}><Home className="h-6 w-6" /><span className="text-sm font-bold mt-1">หน้าหลัก</span></button>
              <button onClick={() => setCurrentTab('settings')} className={`flex flex-col items-center p-2 border-b-4 ${currentTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}><Settings className="h-6 w-6" /><span className="text-sm font-bold mt-1">ตั้งค่า</span></button>
              <button onClick={() => setIsLoggedIn(false)} className="flex flex-col items-center p-2 border-b-4 border-transparent text-red-500"><LogIn className="h-6 w-6" /><span className="text-sm font-bold mt-1">ออกระบบ</span></button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto mt-4 md:mt-6">
        {currentTab === 'dashboard' && <Dashboard />}
        {currentTab === 'editor' && <DocumentEditor />}
        {currentTab === 'preview' && <DocumentPreview />}
        {currentTab === 'settings' && <SettingsScreen />}
      </main>

      {showModal.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-60 backdrop-blur-sm p-4">
          {showModal.type === 'success' && (
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-sm animate-fade-in-up">
              <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800">{showModal.message}</h3>
            </div>
          )}
          {showModal.type === 'pdf' && (
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-sm">
              <Download className="w-16 h-16 text-blue-500 mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">กำลังบันทึก PDF</h3>
              <p className="text-gray-500 text-lg">ไฟล์จะถูกบันทึกลงในเครื่องของคุณ</p>
            </div>
          )}
          {showModal.type === 'email' && (
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-md">
              <div className="bg-gray-800 text-white p-4 rounded-full mb-4"><Mail className="w-10 h-10" /></div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">ส่งเอกสารผ่าน Email</h3>
              <input type="email" placeholder="ระบุอีเมลลูกค้า..." className="w-full p-4 text-xl border-2 border-gray-300 rounded-xl mb-4 text-center font-medium" />
              <div className="w-full flex gap-3 mt-2">
                <button onClick={() => setShowModal({show: false})} className="flex-1 py-4 text-gray-500 font-bold text-lg bg-gray-100 rounded-xl">ยกเลิก</button>
                <button onClick={() => { setShowModal({show: true, message: 'ส่ง Email เรียบร้อย!', type: 'success'}); setTimeout(()=>setShowModal({show: false}), 1500); }} className="flex-[2] py-4 bg-gray-800 text-white font-bold text-xl rounded-xl shadow-lg">ส่งเลย</button>
              </div>
            </div>
          )}
          {showModal.type === 'share' && (
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-md">
              <div className="bg-[#00B900] text-white p-4 rounded-full mb-4 shadow-lg"><MessageCircle className="w-12 h-12" /></div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">พร้อมแชร์ให้ลูกค้า!</h3>
              <div className="w-full bg-gray-100 p-4 rounded-xl flex items-center mb-6 border-2 border-dashed border-gray-300 mt-4">
                <LinkIcon className="text-gray-500 mr-2 w-6 h-6" />
                <div className="flex-1 truncate text-blue-600 font-medium">https://sabaibill.com/view/{editingDoc?.no.toLowerCase()}</div>
              </div>
              <div className="w-full flex flex-col gap-3">
                <button onClick={() => setShowModal({show: false})} className="w-full py-4 bg-[#00B900] text-white font-bold text-xl rounded-xl shadow-lg">คัดลอกลิงก์และเปิดแอป LINE</button>
                <button onClick={() => setShowModal({show: false})} className="w-full py-4 text-gray-500 font-bold text-lg hover:bg-gray-100 rounded-xl">ปิดหน้าต่างนี้</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}