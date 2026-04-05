import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Calendar, Clock, Trash2, PlusCircle, EyeOff, Save, GripVertical, Check } from 'lucide-react';
import { t, getDocTypeName } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

import { getApiBase } from '../utils/apiBase';

const API_URL = getApiBase();
const DRAFT_KEY = 'sabaibill_createDocument_draft';
const ITEM_TEMPLATES_KEY = 'sabaibill_item_templates';

// --- Smart Input Component (Autocomplete) ---
const SmartInput = ({ label, value, onChange, onSelect, type, placeholder, className, language = 'th' }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!value || !show) return;
    const timeoutId = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/search?type=${type}&q=${value}`);
        setSuggestions(res.data);
      } catch (e) { console.error(e); }
    }, 150); // Delay 150ms for faster response
    return () => clearTimeout(timeoutId);
  }, [value, type, show]);

  return (
    <div className="relative">
      {label && <label className="block text-sm font-bold text-gray-600 mb-1">{label}</label>}
      <input 
        type="text" value={value} placeholder={placeholder} className={className}
        onChange={e => { onChange(e.target.value); setShow(true); }}
        onBlur={() => setTimeout(() => setShow(false), 200)} // รอให้คลิกทัน
        onFocus={() => value && setShow(true)}
      />
      {show && suggestions.length > 0 && (
        <ul className="absolute z-50 bg-white border border-gray-300 w-full rounded-lg shadow-xl max-h-60 overflow-auto mt-1">
          {suggestions.map(item => (
            <li key={item.id} onClick={() => { onSelect(item); setShow(false); }} className="p-3 hover:bg-brand-light cursor-pointer border-b border-gray-100 last:border-0 rounded-lg">
              <div className="font-bold text-gray-800">
                {type === 'customer' 
                  ? (language === 'en' && item.nameEn ? item.nameEn : item.name)
                  : item.name}
              </div>
              {item.address && (
                <div className="text-xs text-gray-500 truncate">
                  {type === 'customer' 
                    ? (language === 'en' && item.addressEn ? item.addressEn : item.address)
                    : item.address}
                </div>
              )}
              {item.price !== undefined && <div className="text-xs text-green-600 font-bold">{language === 'th' ? 'ราคาล่าสุด' : 'Latest price'}: {item.price}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const CreateDocumentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const language = useLanguage();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [popularProducts, setPopularProducts] = useState([]);
  const [customerExists, setCustomerExists] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerList, setCustomerList] = useState([]);
  const [customerListLoading, setCustomerListLoading] = useState(false);
  const [lastAddedItemIndex, setLastAddedItemIndex] = useState(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState(null);
  const draftSaveTimeoutRef = useRef(null);
  const draftDiscardedThisSessionRef = useRef(false);
  const [itemTemplates, setItemTemplates] = useState(() => {
    try {
      const raw = localStorage.getItem(ITEM_TEMPLATES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  });
  
  // Helper: วันที่ปัจจุบัน
  const today = new Date().toISOString().split('T')[0];
  const addDays = (dateStr, days) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  // อ่าน type จาก URL query parameter
  const typeFromUrl = searchParams.get('type') || 'QT';

  const [formData, setFormData] = useState({
    type: typeFromUrl, // อ่านจาก URL หรือ default เป็น QT
    no: 'AUTO', // จะถูกสร้างที่ Backend
    customer: '',
    customerEn: '', // เพิ่ม field
    customerAddress: '',
    customerAddressEn: '', // เพิ่ม field
    customerTaxId: '',
    customerPhone: '',
    date: today,
    dueDate: addDays(today, 15), // Default 15 วัน
    vatType: 'exclude', // exclude, include, none
    discountType: 'percent', // percent หรือ amount
    discountValue: 0,
    items: [{ name: '', qty: 1, unit: '', price: 0 }],
    note: '',
    hidePrice: false,
    refNo: '',
    whtRate: 0,
    poNumber: '',
    deliveryDate: '',
    deliveryMethod: '',
    recipient: '',
    preparerName: '', // ส่งจาก settings ตอน submit
  });

  // ตรวจสอบว่ามีฉบับร่างใน localStorage (เมื่อไม่ได้มาจาก sourceDoc) — ไม่แสดงแถบถ้าผู้ใช้กดยกเลิกไปแล้วใน session นี้
  useEffect(() => {
    if (location.state?.sourceDoc) return;
    if (draftDiscardedThisSessionRef.current) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setShowDraftBanner(true);
    } catch (_) {}
  }, [location.state?.sourceDoc]);

  useEffect(() => {
    if (lastAddedItemIndex == null) return;
    const t = setTimeout(() => setLastAddedItemIndex(null), 400);
    return () => clearTimeout(t);
  }, [lastAddedItemIndex]);

  // บันทึกฉบับร่างลง localStorage (debounce 2 วินาที)
  useEffect(() => {
    if (location.state?.sourceDoc) return;
    if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current);
    draftSaveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        setLastDraftSavedAt(new Date());
      } catch (_) {}
      draftSaveTimeoutRef.current = null;
    }, 2000);
    return () => { if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current); };
  }, [formData, location.state?.sourceDoc]);

  // ตรวจสอบว่ามีการส่งข้อมูลมาจากหน้า Preview (แปลงบิล) หรือประวัติ (คัดลอกบิล)
  useEffect(() => {
    if (location.state?.sourceDoc) {
      const { sourceDoc, targetType, duplicate } = location.state;
      setFormData(prev => ({
        ...prev,
        type: targetType || sourceDoc.type || prev.type,
        customer: sourceDoc.customer,
        customerEn: sourceDoc.customerEn || '',
        customerAddress: sourceDoc.customerAddress,
        customerAddressEn: sourceDoc.customerAddressEn || '',
        customerTaxId: sourceDoc.customerTaxId,
        customerPhone: sourceDoc.customerPhone || '',
        items: sourceDoc.items?.map(i => ({
          name: i.name,
          qty: i.qty,
          unit: i.unit || '',
          price: i.price
        })) || prev.items,
        vatType: sourceDoc.vatType,
        discountType: sourceDoc.discountType,
        discountValue: sourceDoc.discountValue,
        whtRate: sourceDoc.whtRate ?? 0,
        refNo: duplicate ? '' : (sourceDoc.no || ''), // คัดลอก = ไม่อ้างอิง; แปลงบิล = อ้างอิงเอกสารเดิม
      }));
      if (sourceDoc.customer || sourceDoc.customerEn) {
        setCustomerExists(true);
      }
    }
  }, [location.state]);

  // ดึงข้อมูลบริษัทเพื่อเอาเงื่อนไขท้ายบิล (Note) มาใส่เป็น Default
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/settings`);
        // ตั้งค่า Note เริ่มต้นตามประเภทเอกสาร
        const settings = res.data;
        let defaultNote = '';
        if (formData.type === 'QT') defaultNote = settings.condQT;
        else if (formData.type === 'SO') defaultNote = settings.condSO;
        else if (formData.type === 'DO') defaultNote = settings.condDO;
        else if (formData.type === 'IV') defaultNote = settings.condIV;
        
        setFormData(prev => ({ ...prev, note: defaultNote || '' }));
      } catch (error) {
        console.error('Failed to fetch settings', error);
      }
    };
    fetchSettings();
  }, [formData.type]); // รันใหม่เมื่อเปลี่ยนประเภทเอกสาร

  // ดึงสินค้ายอดนิยม
  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/products/popular`);
        setPopularProducts(res.data);
      } catch (error) {
        console.error('Failed to fetch popular products', error);
      }
    };
    fetchPopularProducts();
  }, []);

  // สีหัวข้อตามประเภท
  const docName = getDocTypeName(formData.type, language);
  let headerColor = '';
  if (formData.type === 'QT') headerColor = 'bg-pastel-pink';
  else if (formData.type === 'SO') headerColor = 'bg-pastel-orange';
  else if (formData.type === 'DO') headerColor = 'bg-pastel-green';
  else if (formData.type === 'IV') headerColor = 'bg-pastel-blue';

  // คำนวณยอดเงิน Real-time (WHT หักจากฐานก่อน VAT)
  const calculateTotals = () => {
    const items = formData.items || [];
    const subtotal = items.reduce((sum, item) => sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0)), 0);
    let discount = 0;
    if (formData.discountType === 'percent') {
      discount = subtotal * ((parseFloat(formData.discountValue) || 0) / 100);
    } else {
      discount = parseFloat(formData.discountValue) || 0;
    }
    const afterDiscount = Math.max(0, subtotal - discount);
    const base = afterDiscount;
    let vat = 0;
    let total = base;
    if (formData.vatType === 'exclude') {
      vat = base * 0.07;
      total = base + vat;
    } else if (formData.vatType === 'include') {
      vat = base - (base / 1.07);
    }
    const whtRate = parseFloat(formData.whtRate) || 0;
    const whtAmount = whtRate > 0 ? base * (whtRate / 100) : 0;
    const netPayable = total - whtAmount;
    return { subtotal, discount, vat, total, whtRate, whtAmount, netPayable };
  };

  const { subtotal, discount, vat, total, whtRate, whtAmount, netPayable } = calculateTotals();

  const handleSubmit = async (e) => {
    // Validation ก่อนส่ง
    const customerName = (formData.customer && formData.customer.trim()) || (formData.customerEn && formData.customerEn.trim());
    if (!customerName) {
      alert(language === 'th' ? 'กรุณากรอกชื่อลูกค้า (อย่างน้อย 1 ชื่อ)' : 'Please enter customer name (at least one).');
      return;
    }
    const validItems = (formData.items || []).filter((i) => (i.name && String(i.name).trim()) && (Number(i.qty) > 0) && (Number(i.price) >= 0));
    if (validItems.length === 0) {
      alert(language === 'th' ? 'กรุณาเพิ่มอย่างน้อย 1 รายการสินค้า (ชื่อ ไม่ว่าง จำนวน > 0 ราคา ≥ 0)' : 'Please add at least one item with name, quantity > 0, and price ≥ 0.');
      return;
    }
    setLoading(true);
    try {
      const settingsRes = await axios.get(`${API_URL}/api/settings`);
      const preparerName = settingsRes.data?.preparerName || formData.preparerName || '';
      const payload = { ...formData, preparerName };
      const res = await axios.post(`${API_URL}/api/documents`, payload);
      try { localStorage.removeItem(DRAFT_KEY); } catch (_) {}
      setLastDraftSavedAt(null);
      setSaveSuccess(true);
      setTimeout(() => navigate(`/documents/${res.data.id}`), 700);
    } catch (error) {
      const errMsg = error.response?.data?.detail || error.response?.data?.message || error.message;
      alert((language === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + errMsg);
} finally {
    setLoading(false);
  }
  };

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setFormData(JSON.parse(raw));
    } catch (_) {}
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftBanner(false);
  };
  const discardDraft = () => {
    draftDiscardedThisSessionRef.current = true;
    setLastDraftSavedAt(null);
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftBanner(false);
  };

  const saveAsTemplate = () => {
    const name = window.prompt(language === 'th' ? 'ตั้งชื่อแม่แบบรายการ' : 'Template name');
    if (!name || !name.trim()) return;
    const list = formData.items.filter((i) => i.name && String(i.name).trim());
    if (list.length === 0) {
      alert(language === 'th' ? 'ไม่มีรายการที่บันทึกได้' : 'No items to save');
      return;
    }
    const newTpl = { id: Date.now(), name: name.trim(), items: list.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit || '', price: i.price })) };
    const next = [...itemTemplates, newTpl];
    setItemTemplates(next);
    try { localStorage.setItem(ITEM_TEMPLATES_KEY, JSON.stringify(next)); } catch (_) {}
    alert(language === 'th' ? 'บันทึกแม่แบบแล้ว' : 'Template saved');
  };
  const loadTemplate = (tpl) => {
    if (!tpl?.items?.length) return;
    setFormData((prev) => ({ ...prev, items: tpl.items.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit || '', price: i.price })) }));
  };

  const formatDraftTime = (d) => {
    if (!d) return '';
    const h = d.getHours();
    const m = d.getMinutes();
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${language === 'th' ? 'น.' : ''}`;
  };

  return (
    <div className="space-y-4 pb-24">
      {lastDraftSavedAt && !location.state?.sourceDoc && (
        <p className="text-xs text-gray-500 text-right">
          {language === 'th' ? 'บันทึกฉบับร่างอัตโนมัติเมื่อ ' : 'Draft auto-saved at '}{formatDraftTime(lastDraftSavedAt)}
        </p>
      )}
      {showDraftBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-amber-800 font-medium">
            {language === 'th' ? 'มีฉบับร่างที่บันทึกไว้ ต้องการโหลดหรือไม่?' : 'A saved draft was found. Load it?'}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={loadDraft} className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition">
              {language === 'th' ? 'โหลดร่าง' : 'Load draft'}
            </button>
            <button type="button" onClick={discardDraft} className="px-4 py-2 bg-white border border-amber-300 text-amber-800 font-bold rounded-xl hover:bg-amber-100 transition">
              {language === 'th' ? 'ยกเลิก' : 'Discard'}
            </button>
          </div>
        </div>
      )}

      {/* Modal เลือกจากรายชื่อลูกค้า */}
      {showCustomerPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="customer-picker-title">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col border-2 border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 id="customer-picker-title" className="text-xl font-bold text-gray-900">
                {language === 'th' ? 'เลือกลูกค้า' : 'Select customer'}
              </h2>
              <button type="button" onClick={() => setShowCustomerPicker(false)} className="min-h-touch min-w-touch p-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100" aria-label={language === 'th' ? 'ปิด' : 'Close'}>×</button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              {customerListLoading ? (
                <p className="text-gray-500 text-center py-4">{language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</p>
              ) : customerList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">{language === 'th' ? 'ไม่มีรายชื่อลูกค้า' : 'No customers yet'}</p>
              ) : (
                <ul className="space-y-2">
                  {customerList.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            customer: item.name || '',
                            customerEn: item.nameEn || '',
                            customerAddress: item.address || '',
                            customerAddressEn: item.addressEn || '',
                            customerTaxId: item.taxId || '',
                            customerPhone: item.phone || ''
                          });
                          setCustomerExists(true);
                          setShowCustomerPicker(false);
                        }}
                        className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-brand-primary hover:bg-pastel-pink/20 transition min-h-touch"
                      >
                        <span className="font-bold text-gray-900 block">{language === 'en' && item.nameEn ? item.nameEn : item.name}</span>
                        {item.address && <span className="text-sm text-gray-600 block truncate">{language === 'en' && item.addressEn ? item.addressEn : item.address}</span>}
                        {(item.taxId || item.phone) && <span className="text-xs text-gray-500 block mt-1">{item.taxId || ''} {item.phone ? (item.taxId ? ' · ' : '') + item.phone : ''}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">{language === 'th' ? 'สร้างเอกสารใหม่' : 'Create New Document'}</h1>
      </div>

      {/* Header Card — คำภาษาไทยใหญ่, อักษรย่อ (QT) เล็กสีเทา */}
      <div className={`${headerColor} text-white p-6 rounded-t-2xl shadow-md text-center md:text-left transition-colors duration-300`}>
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h2 className="text-3xl font-bold">
              {docName}
              <span className="text-sm font-normal opacity-80 ml-2">({formData.type})</span>
            </h2>
            <select 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="mt-2 md:mt-0 bg-white border-2 border-white/30 text-gray-900 font-bold rounded-xl p-2 outline-none focus:ring-2 focus:ring-white/50 shadow-sm"
            >
              <option value="QT" className="text-gray-800">{getDocTypeName('QT', language)}</option>
              <option value="SO" className="text-gray-800">{getDocTypeName('SO', language)}</option>
              <option value="DO" className="text-gray-800">{getDocTypeName('DO', language)}</option>
              <option value="IV" className="text-gray-800">{getDocTypeName('IV', language)}</option>
            </select>
          </div>

          <div className="flex flex-col lg:flex-row justify-between mt-4 text-lg md:text-xl font-medium gap-4">
            <div className="flex-1 bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-gray-800">
                <span className="text-sm block text-gray-500">{t('documentNo', language)}</span>
                <span className="font-bold text-gray-900">AUTO ({t('autoGenerate', language)})</span>
            </div>
            <div className="flex-1 bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-gray-800 flex items-center">
                <Calendar className="w-6 h-6 mr-2 flex-shrink-0 text-gray-500" />
                <div className="flex-1">
                    <span className="text-sm block text-gray-500">{t('issueDate', language)}</span>
                    <input type="date" className="w-full bg-transparent border-none p-0 text-gray-900 font-bold focus:ring-0 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
            </div>
            <div className="flex-[1.5] bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-gray-800 flex flex-col justify-center">
                <div className="flex items-center mb-2">
                    <Clock className="w-6 h-6 mr-2 flex-shrink-0 text-gray-500" />
                    <div className="flex-1">
                        <span className="text-sm block text-gray-500">{formData.type === 'QT' ? t('validUntil', language) : t('paymentDueDate', language)}</span>
                        <input type="date" className="w-full bg-transparent border-none p-0 text-gray-900 font-bold focus:ring-0 outline-none" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                    </div>
                </div>
                {/* ปุ่มบวกวัน */}
                <div className="flex flex-wrap gap-1 mt-1">
                   {[7, 15, 30].map(days => (
                     <button 
                       key={days} 
                       onClick={() => setFormData({...formData, dueDate: addDays(formData.date, days)})}
                       className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold transition border border-gray-300"
                     >
                       +{days} {t('days', language)}
                     </button>
                   ))}
                </div>
            </div>
          </div>
        </div>

        {/* 1. ข้อมูลลูกค้า (Customer Information) */}
        <div className="bg-white p-5 md:p-8 shadow-md border-x border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">1. {t('customer', language)}</h3>
          
          <div className="space-y-4">
            {/* ชื่อลูกค้า + ปุ่มเลือกจากรายชื่อ */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <label className="block text-base font-bold text-gray-700">{language === 'th' ? 'ชื่อลูกค้า' : 'Customer Name'}</label>
                <button
                  type="button"
                  onClick={async () => {
                    setShowCustomerPicker(true);
                    setCustomerListLoading(true);
                    try {
                      const res = await axios.get(`${API_URL}/api/customers`);
                      setCustomerList(res.data || []);
                    } catch (e) {
                      console.error(e);
                      setCustomerList([]);
                    } finally {
                      setCustomerListLoading(false);
                    }
                  }}
                  className="min-h-touch px-4 py-2 rounded-xl border-2 border-brand-primary bg-pastel-pink/30 text-gray-800 font-bold hover:bg-pastel-pink/50 transition touch-target text-sm"
                >
                  {language === 'th' ? 'เลือกจากรายชื่อลูกค้า' : 'Pick from customer list'}
                </button>
              </div>
              <SmartInput 
                type="customer"
                value={language === 'th' ? formData.customer : formData.customerEn}
                placeholder={language === 'th' ? 'พิมพ์ชื่อลูกค้า (ระบบจะจำให้อัตโนมัติ)...' : 'Type customer name (auto-save)...'}
                className="w-full p-4 text-xl border-2 border-gray-400 rounded-xl bg-gray-50 font-bold transition-colors duration-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-30"
                onChange={val => { 
                  const field = language === 'th' ? 'customer' : 'customerEn';
                  setFormData({...formData, [field]: val}); 
                  setCustomerExists(false); 
                }}
                onSelect={item => { 
                  setFormData({
                    ...formData, 
                    customer: item.name, 
                    customerEn: item.nameEn || '',
                    customerAddress: item.address || '', 
                    customerAddressEn: item.addressEn || '',
                    customerTaxId: item.taxId || '', 
                    customerPhone: item.phone || ''
                  });
                  setCustomerExists(true);
                }}
                language={language}
              />
            </div>

            {/* ปุ่มบันทึกลูกค้าใหม่ */}
            {((language === 'th' && formData.customer && formData.customer.trim().length > 2) || (language === 'en' && formData.customerEn && formData.customerEn.trim().length > 2)) && !customerExists && (
              <div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await axios.post(`${API_URL}/api/customers`, {
                        name: formData.customer || formData.customerEn,
                        nameEn: formData.customerEn,
                        address: formData.customerAddress,
                        addressEn: formData.customerAddressEn,
                        taxId: formData.customerTaxId,
                        phone: formData.customerPhone
                      });
                      setCustomerExists(true);
                      alert(language === 'th' ? '✅ บันทึกลูกค้าสำเร็จ! ระบบจะจำข้อมูลนี้ให้ครั้งหน้า' : '✅ Customer saved! System will remember this data.');
                    } catch (error) {
                      if (error.response?.status === 409) {
                        setCustomerExists(true);
                        alert(language === 'th' ? 'ℹ️ ลูกค้านี้มีในระบบแล้ว' : 'ℹ️ Customer already exists in system');
                      } else {
                        console.error('Save customer error:', error);
                      }
                    }
                  }}
                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-all flex items-center"
                >
                  <span className="mr-1">💾</span>
                  {language === 'th' ? 'บันทึกลูกค้านี้ไว้ในระบบ' : 'Save customer to system'}
                </button>
              </div>
            )}

            {/* เลขที่ภาษี (Tax ID) */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">{language === 'th' ? 'เลขประจำตัวผู้เสียภาษี (Tax ID)' : 'Tax ID (Tax Identification Number)'}</label>
              <input
                type="text"
                placeholder={language === 'th' ? 'เลข 13 หลัก (เว้นว่างได้)' : '13 digits (optional)'}
                className="w-full p-3 text-lg border-2 border-gray-400 rounded-xl bg-gray-50 transition-colors duration-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-30"
                value={formData.customerTaxId || ''}
                onChange={e => setFormData({...formData, customerTaxId: e.target.value})}
              />
            </div>

            {/* เบอร์โทรศัพท์ */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">{language === 'th' ? 'เบอร์โทรศัพท์' : 'Phone Number'}</label>
              <input
                type="tel"
                placeholder={language === 'th' ? 'เบอร์โทรลูกค้า (เว้นว่างได้)' : 'Customer phone (optional)'}
                className="w-full p-3 text-lg border-2 border-gray-400 rounded-xl bg-gray-50 transition-colors duration-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-30"
                value={formData.customerPhone || ''}
                onChange={e => setFormData({...formData, customerPhone: e.target.value})}
              />
            </div>

            {/* ที่อยู่ */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">{language === 'th' ? 'ที่อยู่ลูกค้า' : 'Customer Address'}</label>
              <textarea
                rows={2}
                placeholder={language === 'th' ? 'ที่อยู่ (เว้นว่างได้)' : 'Address (optional)'}
                className="w-full p-3 text-lg border-2 border-gray-400 rounded-xl bg-gray-50 transition-colors duration-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-30 resize-none"
                value={(language === 'th' ? formData.customerAddress : formData.customerAddressEn) || ''}
                onChange={e => setFormData({...formData, [language === 'th' ? 'customerAddress' : 'customerAddressEn']: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t border-gray-200 pt-4">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">{language === 'th' ? 'อ้างอิงเอกสารเดิม' : 'Reference Document'}</label>
              <input type="text" disabled className="w-full p-3 text-lg border-2 border-gray-400 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed" value={formData.refNo || '-'} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">{language === 'th' ? 'อ้างอิงเลขที่ PO จากลูกค้า (ถ้ามี)' : 'Customer PO Number (if any)'}</label>
              <input type="text" placeholder={language === 'th' ? 'เช่น PO-2026-001' : 'e.g. PO-2026-001'} className="w-full p-3 text-lg border-2 border-gray-400 rounded-xl bg-gray-50 transition-colors duration-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-30" value={formData.poNumber || ''} onChange={e => setFormData({...formData, poNumber: e.target.value})} />
            </div>
          </div>
        </div>

        {/* 2. รายการสินค้า */}
        <div className="bg-white p-5 md:p-8 shadow-md border-x border-b border-gray-200 mt-4 rounded-xl">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-xl font-bold text-gray-800">2. {t('items', language)}</h3>
            {formData.type === 'DO' && (
                <button onClick={() => setFormData({...formData, hidePrice: !formData.hidePrice})} className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition border-2 ${formData.hidePrice ? 'bg-red-100 text-red-700 border-red-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                  <EyeOff className="w-4 h-4 mr-2" /> {formData.hidePrice ? (language === 'th' ? 'ซ่อนราคาแล้ว' : 'Price Hidden') : (language === 'th' ? 'แสดงราคาปกติ' : 'Show Price')}
                </button>
            )}
          </div>

          {/* สินค้ายอดนิยม */}
          {popularProducts.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border-2 border-blue-200">
              <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <span className="text-2xl mr-2">⭐</span> {language === 'th' ? 'สินค้ายอดนิยม (กดเพื่อเพิ่ม)' : 'Popular Products (Click to Add)'}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {popularProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      const newItem = { 
                        name: product.name, 
                        qty: 1, 
                        unit: product.unit || '',
                        price: product.price 
                      };
                      setFormData({...formData, items: [...formData.items, newItem]});
                    }}
                    className="bg-white hover:bg-blue-50 border-2 border-blue-300 hover:border-blue-500 rounded-xl p-3 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="text-3xl mb-2">📦</div>
                    <div className="font-bold text-gray-800 text-sm mb-1 truncate">{product.name}</div>
                    <div className="text-xs text-gray-600">{product.unit || (language === 'th' ? 'ชิ้น' : 'pcs')}</div>
                    <div className="text-lg font-bold text-blue-600 mt-1">{formatCurrency(product.price)}</div>
                    <div className="text-xs text-gray-500 mt-1">{language === 'th' ? `ใช้ ${product.usageCount} ครั้ง` : `Used ${product.usageCount} times`}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* แม่แบบรายการ (Item templates) */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-700">{language === 'th' ? 'แม่แบบรายการ:' : 'Item template:'}</span>
            <select
              className="px-3 py-2 border border-gray-300 rounded-xl bg-white text-gray-800"
              value=""
              onChange={(e) => {
                const id = e.target.value;
                if (!id) return;
                const tpl = itemTemplates.find((t) => String(t.id) === id);
                if (tpl) loadTemplate(tpl);
                e.target.value = '';
              }}
            >
              <option value="">{language === 'th' ? '-- เลือกแม่แบบ --' : '-- Select template --'}</option>
              {itemTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.items?.length || 0})</option>
              ))}
            </select>
            <button
              type="button"
              onClick={saveAsTemplate}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition border border-gray-200"
            >
              {language === 'th' ? 'บันทึกเป็นแม่แบบ' : 'Save as template'}
            </button>
          </div>

          {formData.items.map((item, index) => (
            <div
              key={index}
              className={`bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 flex gap-3 items-start transition ${lastAddedItemIndex === index ? 'animate-slideDownFadeIn' : ''}`}
              draggable
              onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.classList.add('ring-2', 'ring-brand-primary'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-brand-primary'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-brand-primary');
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                if (fromIndex === index) return;
                const newItems = [...formData.items];
                const [removed] = newItems.splice(fromIndex, 1);
                newItems.splice(index, 0, removed);
                setFormData({ ...formData, items: newItems });
              }}
            >
              <div className="cursor-grab active:cursor-grabbing shrink-0 mt-2 text-gray-400 hover:text-gray-600" title={language === 'th' ? 'ลากเพื่อเรียงลำดับ' : 'Drag to reorder'} aria-hidden>
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
              {/* Smart Input สินค้า */}
              <div className="mb-3">
                <SmartInput 
                  type="product"
                  value={item.name}
                  placeholder={`${t('productName', language)} ${index + 1}`}
                  className="w-full p-3 text-xl border-2 border-gray-400 rounded-lg bg-gray-50 font-bold transition-colors duration-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-30"
                  onChange={val => { const items = [...formData.items]; items[index].name = val; setFormData({...formData, items}); }}
                  onSelect={prod => { const items = [...formData.items]; items[index].name = prod.name; items[index].price = prod.price; items[index].unit = prod.unit || ''; setFormData({...formData, items}); }}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[80px]">
                  <label className="block text-sm font-bold text-gray-600 mb-1">{t('quantity', language)}</label>
                  <input type="number" className="w-full p-3 text-lg border-2 border-gray-400 rounded-lg bg-gray-50 text-center font-bold text-blue-700 transition-colors duration-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-30" value={item.qty || ''} onChange={e => { const items = [...formData.items]; items[index].qty = parseFloat(e.target.value) || 0; setFormData({...formData, items}); }} />
                </div>
                <div className="flex-1 min-w-[80px]">
                  <label className="block text-sm font-bold text-gray-600 mb-1">{t('unit', language)}</label>
                  <input type="text" placeholder={language === 'th' ? 'ชิ้น, กล่อง...' : 'pcs, box...'} className="w-full p-3 text-lg border-2 border-gray-400 rounded-lg bg-gray-50 text-center font-bold text-gray-700 transition-colors duration-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-30" value={item.unit || ''} onChange={e => { const items = [...formData.items]; items[index].unit = e.target.value; setFormData({...formData, items}); }} />
                </div>
                <div className={`flex-1 min-w-[100px] ${formData.hidePrice ? 'opacity-50 pointer-events-none' : ''}`}>
                  <label className="block text-sm font-bold text-gray-600 mb-1">{t('unitPrice', language)}</label>
                  <input type="number" className="w-full p-3 text-lg border-2 border-gray-400 rounded-lg bg-gray-50 text-right font-bold text-blue-700 transition-colors duration-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-30" value={item.price || ''} onChange={e => { const items = [...formData.items]; items[index].price = parseFloat(e.target.value) || 0; setFormData({...formData, items}); }} />
                </div>
                {!formData.hidePrice && (
                  <div className="flex-1 min-w-[100px]">
                    <label className="block text-sm font-bold text-gray-600 mb-1">{t('itemTotal', language)}</label>
                    <div className="w-full p-3 text-lg border-2 border-green-200 rounded-lg text-right font-bold text-green-700 bg-green-50">
                      {((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0)).toLocaleString('th-TH', {minimumFractionDigits: 2})}
                    </div>
                  </div>
                )}
                <button onClick={() => { if(formData.items.length > 1) setFormData({...formData, items: formData.items.filter((_, i) => i !== index)}); }} className="mt-6 p-3 bg-red-100 text-red-600 rounded-xl h-14 w-14 flex items-center justify-center hover:bg-red-200 transition">
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const newItems = [...formData.items, { name: '', qty: 1, unit: '', price: 0 }];
              setFormData({ ...formData, items: newItems });
              setLastAddedItemIndex(newItems.length - 1);
            }}
            className="w-full py-5 bg-blue-50 text-blue-700 font-bold text-xl border-2 border-blue-200 border-dashed rounded-xl flex items-center justify-center hover:bg-blue-100 transition"
          >
            <PlusCircle className="w-6 h-6 mr-2" /> {t('addMoreItems', language)}
          </button>

          {/* Recipient - เฉพาะ DO */}
          {formData.type === 'DO' && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-base font-bold text-gray-700 mb-2">
                📦 {t('recipient', language)}
              </label>
              <input
                type="text"
                placeholder={language === 'th' ? 'ชื่อผู้รับของ (เว้นว่างได้)' : 'Recipient name (optional)'}
                className="w-full p-4 text-lg border-2 border-gray-400 rounded-xl bg-gray-50 transition-colors duration-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-30"
                value={formData.recipient || ''}
                onChange={e => setFormData({...formData, recipient: e.target.value})}
              />
            </div>
          )}
        </div>

        {/* 3. ส่วนลด / ภาษี และ เงื่อนไข — layout แยกชัด ไม่ซ้อน (โดยเฉพาะ SO) */}
        <div className={`bg-white p-5 md:p-8 shadow-md border-x border-b border-gray-200 mt-4 rounded-xl ${formData.hidePrice ? 'opacity-50 pointer-events-none' : ''}`}>
           <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">3. {t('discountAndVat', language)}</h3>
           
           {/* Mobile: คอลัมน์เดียว — Discount บน, VAT กลาง, สรุปยอดล่าง */}
           <div className="flex flex-col gap-6 mb-6 md:hidden">
               <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                 <label className="block text-xl font-bold text-red-700 mb-3 flex items-center">
                   <span className="text-3xl mr-2">🏷️</span>
                   {t('discount', language)}
                 </label>
                 <div className="flex gap-2 mb-3">
                   <button type="button" onClick={() => setFormData({...formData, discountType: 'percent', discountValue: 0})} className={`flex-1 py-2 px-4 text-lg font-bold rounded-xl border-2 transition ${formData.discountType === 'percent' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-300 hover:bg-red-50'}`}>% ({language === 'th' ? 'เปอร์เซ็นต์' : 'Percent'})</button>
                   <button type="button" onClick={() => setFormData({...formData, discountType: 'amount', discountValue: 0})} className={`flex-1 py-2 px-4 text-lg font-bold rounded-xl border-2 transition ${formData.discountType === 'amount' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-300 hover:bg-red-50'}`}>฿ ({language === 'th' ? 'จำนวนเงิน' : 'Fixed Amount'})</button>
                 </div>
                 {formData.discountValue > 0 && <div className="mb-2 text-lg font-bold text-red-700">{t('discount', language)}: {formData.discountValue}{formData.discountType === 'percent' ? '%' : ' ฿'}</div>}
                 <div className="flex items-center gap-3">
                    <input type="number" placeholder={formData.discountType === 'percent' ? t('discountPercentLabel', language) : (language === 'th' ? 'ระบุจำนวนเงิน (฿)' : 'Enter discount amount (THB)')} min="0" {...(formData.discountType === 'percent' ? { max: 100 } : {})} step="0.1" className="flex-1 p-4 text-xl border-2 border-red-300 rounded-xl text-right focus:border-red-500 font-bold text-red-700 bg-white" value={formData.discountValue || ''} onChange={e => { const value = parseFloat(e.target.value) || 0; if (value < 0) return; if (formData.discountType === 'percent' && value > 100) { alert(t('discountMaxError', language)); return; } setFormData({...formData, discountValue: value}); }} />
                    <span className="text-2xl font-bold text-red-700 w-12 text-center">{formData.discountType === 'percent' ? '%' : '฿'}</span>
                 </div>
                 <p className="text-sm text-gray-600 mt-2">{formData.discountType === 'percent' ? (language === 'th' ? 'กรอก 0-100 (เช่น 10 = ลด 10%)' : 'Enter 0-100 (e.g. 10 = 10% off)') : (language === 'th' ? 'กรอกจำนวนเงินที่ต้องการลด (฿)' : 'Enter the fixed discount amount (THB)')}</p>
               </div>
               <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">{t('vatLabel', language)}</label>
                  <div className="flex flex-col gap-2">
                    {[{id: 'none', label: t('noVAT', language)}, {id: 'exclude', label: t('vatExclude', language)}, {id: 'include', label: t('vatInclude', language)}].map(v => (
                      <button key={v.id} onClick={() => setFormData({...formData, vatType: v.id})} className={`py-3 px-4 text-base font-bold rounded-xl border-2 transition ${formData.vatType === v.id ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-600'}`}>{v.label}</button>
                    ))}
                  </div>
               </div>
               <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-200">
                 <label className="block text-lg font-bold text-amber-800 mb-2">{t('wht', language)} (%)</label>
                 <div className="flex flex-wrap gap-2 items-center">
                   {[0, 1, 3].map(p => (
                     <button key={p} type="button" onClick={() => setFormData({...formData, whtRate: p})} className={`py-2 px-4 text-base font-bold rounded-xl border-2 transition ${(formData.whtRate || 0) === p ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'}`}>{p}%</button>
                   ))}
                   <input type="number" min="0" max="100" step="0.5" placeholder={language === 'th' ? 'อื่นๆ' : 'Other'} className="w-20 p-2 border-2 border-amber-300 rounded-xl text-right font-bold text-amber-800" value={[0,1,3].includes(parseFloat(formData.whtRate)) ? '' : (formData.whtRate || '')} onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0 && v <= 100) setFormData({...formData, whtRate: v}); }} />
                 </div>
               </div>
               {/* บล็อกสรุปยอด — ล่างสุดของ section 3 บนมือถือ */}
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-right mt-2">
                 <div className="flex justify-between text-gray-600 mb-1"><span>{t('subtotal', language)}</span> <span className="font-bold">{formatCurrency(subtotal)}</span></div>
                 {discount > 0 && <div className="flex justify-between text-red-700 mb-1 font-bold"><span>{t('discount', language)}{formData.discountType === 'percent' ? ` ${formData.discountValue}%` : ''}</span> <span>-{formatCurrency(discount)}</span></div>}
                 {formData.vatType !== 'none' && <div className="flex justify-between text-gray-600 mb-1"><span>VAT 7%</span> <span>{formatCurrency(vat)}</span></div>}
                 {whtRate > 0 && <div className="flex justify-between text-amber-700 mb-1 font-bold"><span>{t('wht', language)} {whtRate}%</span> <span>-{formatCurrency(whtAmount)}</span></div>}
                 <div className="flex justify-between text-lg font-bold text-gray-700 mt-2 pt-2 border-t border-gray-300"><span>{t('grandTotal', language)}</span> <span>{formatCurrency(total)}</span></div>
                 {whtRate > 0 && <div className="flex justify-between text-xl font-black text-amber-800 mt-1"><span>{t('netPayable', language)}</span> <span>{formatCurrency(netPayable)}</span></div>}
               </div>
           </div>

           {/* Desktop: 2 คอลัมน์ — คอลัมน์ขวา stack แนวตั้ง VAT แล้วค่อยบล็อกสรุป (มี gap ชัด) */}
           <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
               <div className="bg-red-50 p-4 md:p-6 rounded-xl border-2 border-red-200">
                 <label className="block text-xl md:text-2xl font-bold text-red-700 mb-3 flex items-center">
                   <span className="text-3xl mr-2">🏷️</span>
                   {t('discount', language)}
                 </label>
                 <div className="flex gap-2 mb-3">
                   <button type="button" onClick={() => setFormData({...formData, discountType: 'percent', discountValue: 0})} className={`flex-1 py-2 px-4 text-lg font-bold rounded-xl border-2 transition ${formData.discountType === 'percent' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-300 hover:bg-red-50'}`}>% ({language === 'th' ? 'เปอร์เซ็นต์' : 'Percent'})</button>
                   <button type="button" onClick={() => setFormData({...formData, discountType: 'amount', discountValue: 0})} className={`flex-1 py-2 px-4 text-lg font-bold rounded-xl border-2 transition ${formData.discountType === 'amount' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-600 border-red-300 hover:bg-red-50'}`}>฿ ({language === 'th' ? 'จำนวนเงิน' : 'Fixed Amount'})</button>
                 </div>
                 {formData.discountValue > 0 && <div className="mb-2 text-lg font-bold text-red-700">{t('discount', language)}: {formData.discountValue}{formData.discountType === 'percent' ? '%' : ' ฿'}</div>}
                 <div className="flex items-center gap-3">
                    <input type="number" placeholder={formData.discountType === 'percent' ? t('discountPercentLabel', language) : (language === 'th' ? 'ระบุจำนวนเงิน (฿)' : 'Enter discount amount (THB)')} min="0" {...(formData.discountType === 'percent' ? { max: 100 } : {})} step="0.1" className="flex-1 p-4 text-xl md:text-2xl border-2 border-red-300 rounded-xl text-right focus:border-red-500 font-bold text-red-700 bg-white" value={formData.discountValue || ''} onChange={e => { const value = parseFloat(e.target.value) || 0; if (value < 0) return; if (formData.discountType === 'percent' && value > 100) { alert(t('discountMaxError', language)); return; } setFormData({...formData, discountValue: value}); }} />
                    <div className="flex items-center justify-center w-16"><span className="text-4xl font-bold text-red-700">{formData.discountType === 'percent' ? '%' : '฿'}</span></div>
                 </div>
                 <p className="text-sm text-gray-600 mt-2">{formData.discountType === 'percent' ? (language === 'th' ? 'กรอก 0-100 (เช่น 10 = ลด 10%)' : 'Enter 0-100 (e.g. 10 = 10% off)') : (language === 'th' ? 'กรอกจำนวนเงินที่ต้องการลด (฿)' : 'Enter the fixed discount amount (THB)')}</p>
               </div>
               <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-lg font-bold text-gray-700 mb-2">{t('vatLabel', language)}</label>
                    <div className="flex flex-col gap-2">
                      {[{id: 'none', label: t('noVAT', language)}, {id: 'exclude', label: t('vatExclude', language)}, {id: 'include', label: t('vatInclude', language)}].map(v => (
                        <button key={v.id} onClick={() => setFormData({...formData, vatType: v.id})} className={`py-3 px-4 text-base font-bold rounded-xl border-2 transition ${formData.vatType === v.id ? 'bg-blue-600 text-white border-blue-600 shadow' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-600'}`}>{v.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-200">
                    <label className="block text-lg font-bold text-amber-800 mb-2">{t('wht', language)} (%)</label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {[0, 1, 3].map(p => (
                        <button key={p} type="button" onClick={() => setFormData({...formData, whtRate: p})} className={`py-2 px-4 text-base font-bold rounded-xl border-2 transition ${(formData.whtRate || 0) === p ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'}`}>{p}%</button>
                      ))}
                      <input type="number" min="0" max="100" step="0.5" placeholder={language === 'th' ? 'อื่นๆ' : 'Other'} className="w-20 p-2 border-2 border-amber-300 rounded-xl text-right font-bold text-amber-800" value={[0,1,3].includes(parseFloat(formData.whtRate)) ? '' : (formData.whtRate || '')} onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0 && v <= 100) setFormData({...formData, whtRate: v}); }} />
                    </div>
                  </div>
                  <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-right flex-shrink-0">
                    <div className="flex justify-between text-gray-600 mb-1"><span>{t('subtotal', language)}</span> <span className="font-bold">{formatCurrency(subtotal)}</span></div>
                    {discount > 0 && <div className="flex justify-between text-red-700 mb-1 font-bold"><span>{t('discount', language)}{formData.discountType === 'percent' ? ` ${formData.discountValue}%` : ''}</span> <span>-{formatCurrency(discount)}</span></div>}
                    {formData.vatType !== 'none' && <div className="flex justify-between text-gray-600 mb-1"><span>VAT 7%</span> <span>{formatCurrency(vat)}</span></div>}
                    {whtRate > 0 && <div className="flex justify-between text-amber-700 mb-1 font-bold"><span>{t('wht', language)} {whtRate}%</span> <span>-{formatCurrency(whtAmount)}</span></div>}
                    <div className="flex justify-between text-lg font-bold text-gray-700 mt-2 pt-2 border-t border-gray-300"><span>{t('grandTotal', language)}</span> <span>{formatCurrency(total)}</span></div>
                    {whtRate > 0 && <div className="flex justify-between text-xl font-black text-amber-800 mt-1"><span>{t('netPayable', language)}</span> <span>{formatCurrency(netPayable)}</span></div>}
                  </div>
               </div>
           </div>

           <div>
              <label className="block text-lg font-bold text-gray-700 mb-2 flex justify-between">
                <span>{t('termsAndNotes', language)}</span>
              </label>
              <textarea rows="3" className="w-full p-4 text-lg border-2 border-gray-400 rounded-xl bg-gray-50 transition-colors duration-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-30 whitespace-pre-line" value={formData.note || ''} onChange={e => setFormData({...formData, note: e.target.value})} />
           </div>
        </div>

        {/* 4. ลายเซ็น — ชื่อผู้จัดทำตั้งใน ตั้งค่า แล้วใช้ในทุกเอกสาร */}
        <div className="bg-white p-5 md:p-8 shadow-md border-x border-b border-gray-200 mt-4 rounded-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">4. {t('signaturesSection', language)}</h3>
          <div className="md:hidden rounded-2xl bg-white border border-gray-200 p-4 shadow-sm flex items-center justify-between mt-0">
            <span className="text-sm text-gray-500">{t('grandTotal', language)}</span>
            <span className="text-xl font-black text-gray-900">{formatCurrency(total)}</span>
          </div>
        </div>

      {/* Sticky Save Bar — มุมล่างจอ, กดได้ตลอด (Senior-Friendly) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-gray-200 shadow-lg py-3 px-4 print:hidden safe-area-pb">
        <div className="max-w-3xl mx-auto">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`min-h-touch w-full flex items-center justify-center px-6 py-4 text-lg font-bold rounded-2xl shadow-lg transition touch-target ${saveSuccess ? 'bg-emerald-600 text-white' : 'bg-brand-primary text-white hover:bg-pink-500 disabled:bg-gray-400'}`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-5 h-5 mr-2 shrink-0 animate-[scale-in_0.3s_ease-out]" />
                {language === 'th' ? 'บันทึกแล้ว' : 'Saved'}
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2 shrink-0" />
                {loading ? (language === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (language === 'th' ? 'บันทึกเอกสาร' : 'Save Document')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDocumentPage;
