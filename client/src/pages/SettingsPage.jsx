import { useState, useEffect } from 'react';
import axios from 'axios';
import { Cog6ToothIcon, CheckIcon, CreditCardIcon, DocumentTextIcon, PaintBrushIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import TemplatePreview from '../components/TemplatePreview';
import SignaturePad from '../components/SignaturePad';
import { t } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { getApiBase } from '../utils/apiBase';

const API_URL = getApiBase();

// Theme Configuration
const getThemes = (lang) => [
  { key: 'blue', name: lang === 'th' ? 'น้ำเงินเข้ม' : 'Dark Blue', bg: 'bg-blue-600', border: 'border-blue-600', text: 'text-blue-600', hex: '#1E40AF' },
  { key: 'green', name: lang === 'th' ? 'เขียวเข้ม' : 'Dark Green', bg: 'bg-green-700', border: 'border-green-700', text: 'text-green-700', hex: '#047857' },
  { key: 'pink', name: lang === 'th' ? 'ชมพู' : 'Pink', bg: 'bg-pink-600', border: 'border-pink-600', text: 'text-pink-600', hex: '#DB2777' },
  { key: 'black', name: lang === 'th' ? 'ขาวดำ' : 'Black & White', bg: 'bg-gray-800', border: 'border-gray-800', text: 'text-gray-800', hex: '#1F2937' },
  { key: 'red', name: lang === 'th' ? 'แดง' : 'Red', bg: 'bg-red-600', border: 'border-red-600', text: 'text-red-600', hex: '#DC2626' },
  { key: 'yellow', name: lang === 'th' ? 'เหลือง' : 'Yellow', bg: 'bg-yellow-600', border: 'border-yellow-600', text: 'text-yellow-600', hex: '#D97706' },
];

// Layout Configuration
const getLayouts = (lang) => [
  { key: 'classic', name: lang === 'th' ? 'คลาสสิก' : 'Classic', description: lang === 'th' ? 'โลโก้ซ้ายบน ข้อมูลลูกค้าขวาบน ตารางเต็มความกว้าง' : 'Logo top-left, customer info top-right, full-width table' },
  { key: 'modern', name: lang === 'th' ? 'ทันสมัย' : 'Modern', description: lang === 'th' ? 'Header สีเต็ม ข้อมูลแบ่ง 2 คอลัมน์ ตารางมี zebra stripe' : 'Full-color header, 2-column layout, zebra stripe table' },
  { key: 'minimal', name: lang === 'th' ? 'เรียบง่าย' : 'Minimal', description: lang === 'th' ? 'ไม่มี border หนา Typography ใหญ่ชัด เน้นความสะอาดตา' : 'No thick borders, large typography, clean look' },
  { key: 'compact', name: lang === 'th' ? 'กระชับ' : 'Compact', description: lang === 'th' ? 'ฟอนต์เล็ก พอดี A4 เหมาะพิมพ์ ประหยัดพื้นที่' : 'Small font, fits A4, print-friendly, space-saving' },
  { key: 'professional', name: lang === 'th' ? 'หรูหรา' : 'Professional', description: lang === 'th' ? 'มีกรอบ มี shadow เน้นความเป็นทางการ สวยงาม' : 'Borders with shadow, formal and elegant' },
];

const SettingsPage = () => {
  const language = useLanguage();
  const { displayCurrency, setDisplayCurrency, currencySettings } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company'); // 'company', 'bank', 'template'
  const [settings, setSettings] = useState({
    companyName: '',
    companyNameEn: '',
    address: '',
    addressEn: '',
    country: 'ไทย',
    postalCode: '',
    taxId: '',
    phone: '',
    logoImage: null,
    bankName: 'kbank',
    customBankName: '',
    customBankLogo: null,
    bankAccountName: '',
    bankAccountNumber: '',
    condQT: '',
    condSO: '',
    condDO: '',
    condIV: '',
    templateTheme: 'blue',
    templateLayout: 'classic',
    preparerName: '',
    paymentQrImage: null,
    defaultCurrency: 'THB',
    currencySymbol: '฿',
    secondaryCurrency: '',
    exchangeRateToSecondary: null,
  });

  const getBankConfig = (lang) => ({
    kbank: { name: lang === 'th' ? 'ธนาคารกสิกรไทย' : 'Kasikornbank', color: 'bg-[#00A950]', iconText: 'K' },
    scb: { name: lang === 'th' ? 'ธนาคารไทยพาณิชย์' : 'Siam Commercial Bank', color: 'bg-[#4E2A84]', iconText: 'SCB' },
    bbl: { name: lang === 'th' ? 'ธนาคารกรุงเทพ' : 'Bangkok Bank', color: 'bg-[#1E4598]', iconText: 'BBL' },
    ktb: { name: lang === 'th' ? 'ธนาคารกรุงไทย' : 'Krung Thai Bank', color: 'bg-[#00AEEF]', iconText: 'KTB' },
    custom: { name: lang === 'th' ? 'เพิ่มธนาคารเอง' : 'Add Custom Bank', color: 'bg-gray-700', iconText: '+' },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/settings`);
        if (res.data) setSettings(res.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleImageUpload = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'logo') setSettings({ ...settings, logoImage: reader.result });
        if (target === 'bank') setSettings({ ...settings, customBankLogo: reader.result });
        if (target === 'signature') setSettings({ ...settings, signatureImage: reader.result });
        if (target === 'qr') setSettings({ ...settings, paymentQrImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/settings`, settings);
      alert(language === 'th' ? 'บันทึกข้อมูลเรียบร้อย' : 'Settings saved successfully');
    } catch (error) {
      alert((language === 'th' ? 'เกิดข้อผิดพลาด: ' : 'Error: ') + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <Cog6ToothIcon className="w-8 h-8 mr-3 text-brand-primary" /> {t('companySettings', language)}
      </h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveTab('company')}
            className={`min-h-touch px-4 py-3 rounded-2xl font-bold text-base flex items-center transition touch-target ${
              activeTab === 'company' 
                ? 'bg-brand-primary text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" /> {t('companyInfo', language)}
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`min-h-touch px-4 py-3 rounded-2xl font-bold text-base flex items-center transition touch-target ${
              activeTab === 'bank' 
                ? 'bg-brand-primary text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <CreditCardIcon className="w-5 h-5 mr-2" /> {t('bankAccount', language)}
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`min-h-touch px-4 py-3 rounded-2xl font-bold text-base flex items-center transition touch-target ${
              activeTab === 'template' 
                ? 'bg-brand-primary text-white shadow-lg' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <PaintBrushIcon className="w-5 h-5 mr-2" /> {t('template', language)}
          </button>
      </div>

        {/* Company Tab */}
        {activeTab === 'company' && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-8">
            <div className="bg-brand-primary text-white px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold">{t('companyInfo', language)}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-blue-200 bg-blue-50 p-6 rounded-xl text-center mb-6 relative">
                 <label className="block text-lg font-bold text-gray-700 mb-4">{t('uploadLogo', language)}</label>
                 {settings.logoImage ? (
                     <div className="flex flex-col items-center">
                        <img src={settings.logoImage} alt="Logo" className="w-32 h-32 object-contain bg-white border border-gray-300 rounded-lg shadow-sm mb-4" />
                        <button onClick={() => setSettings({...settings, logoImage: null})} className="text-red-500 font-bold underline">{t('deleteImage', language)}</button>
                     </div>
                 ) : (
                     <div className="w-24 h-24 bg-white border border-gray-300 rounded-xl mx-auto flex items-center justify-center text-gray-400 font-bold mb-4 shadow-sm">{t('noLogo', language)}</div>
                 )}
                 <div className="mt-4">
                    <input type="file" accept="image/*" id="logo-upload" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
                    <label htmlFor="logo-upload" className="cursor-pointer min-h-touch inline-flex items-center bg-brand-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-pink-500 transition touch-target">{t('selectImage', language)}</label>
                 </div>
              </div>

              {/* Signature Section */}
              <div className="border-2 border-green-200 bg-green-50 p-6 rounded-xl mb-6">
                 <label className="block text-xl font-bold text-gray-700 mb-4 flex items-center">
                   <span className="text-2xl mr-2">✍️</span>
                   {t('companySignature', language)}
                 </label>
                 
                 {/* แท็บเลือกวิธี */}
                 <div className="flex gap-2 mb-4">
                   <button
                     onClick={() => setSettings({...settings, signatureMethod: 'upload'})}
                     className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition border-2 ${
                       (settings.signatureMethod || 'upload') === 'upload'
                         ? 'bg-green-600 text-white border-green-600 shadow-lg'
                         : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                     }`}
                   >
                     📎 {t('uploadMethod', language)}
                   </button>
                   <button
                     onClick={() => setSettings({...settings, signatureMethod: 'draw'})}
                     className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition border-2 ${
                       settings.signatureMethod === 'draw'
                         ? 'bg-green-600 text-white border-green-600 shadow-lg'
                         : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                     }`}
                   >
                     ✍️ {t('drawMethod', language)}
                   </button>
                 </div>

                 {/* อัปโหลดรูป */}
                 {(settings.signatureMethod || 'upload') === 'upload' && (
                   <div className="text-center">
                     {settings.signatureImage ? (
                       <div className="flex flex-col items-center">
                         <img src={settings.signatureImage} alt="Signature" className="w-64 h-32 object-contain bg-white border-2 border-gray-300 rounded-lg shadow-sm mb-4" />
                         <button onClick={() => setSettings({...settings, signatureImage: null})} className="text-red-600 font-bold underline text-lg">{t('deleteSignature', language)}</button>
                       </div>
                     ) : (
                       <div className="w-64 h-32 bg-white border-2 border-dashed border-gray-300 rounded-xl mx-auto flex items-center justify-center text-gray-400 font-bold mb-4">{t('noSignature', language)}</div>
                     )}
                     <div className="mt-4">
                       <input type="file" accept="image/*" id="signature-upload" className="hidden" onChange={(e) => handleImageUpload(e, 'signature')} />
                       <label htmlFor="signature-upload" className="cursor-pointer bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition inline-block shadow-lg">
                         📎 {t('selectSignature', language)}
                       </label>
                     </div>
                   </div>
                 )}

                 {/* เซ็นด้วยเมาส์ */}
                 {settings.signatureMethod === 'draw' && (
                   <SignaturePad 
                     onSave={(dataURL) => setSettings({...settings, signatureImage: dataURL})} 
                     initialSignature={settings.signatureImage}
                   />
                 )}

                 <p className="text-sm text-gray-600 mt-4 text-center">
                   {t('signatureNote', language)}
                 </p>

                 <div className="mt-4 pt-4 border-t border-gray-200">
                   <label className="block text-lg font-bold text-gray-700 mb-2">✍️ {t('preparerName', language)}</label>
                   <input
                     type="text"
                     placeholder={t('preparerPlaceholder', language)}
                     className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl"
                     value={settings.preparerName || ''}
                     onChange={e => setSettings({ ...settings, preparerName: e.target.value })}
                   />
                   <p className="text-sm text-gray-600 mt-1">{language === 'th' ? 'ชื่อผู้จัดทำจะแสดงในใบเสนอราคาและเอกสารทั้งหมด' : 'Preparer name will appear on quotations and all documents.'}</p>
                 </div>

                 <div className="border-t border-gray-200 pt-6 mt-6">
                   <h4 className="text-lg font-bold text-gray-800 mb-3">{language === 'th' ? '💱 สกุลเงิน' : '💱 Currency'}</h4>
                   <p className="text-sm text-gray-600 mb-4">{language === 'th' ? 'ตั้งค่าสกุลเงินหลักและสกุลรอง (เช่น USD) สำหรับลูกค้าต่างชาติ ใช้ปุ่มสลับสกุลเงินบนแถบเมนูเพื่อเปลี่ยนการแสดงผล' : 'Set primary and secondary currency (e.g. USD) for international clients. Use the currency toggle in the menu bar to switch display.'}</p>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">{language === 'th' ? 'สกุลเงินหลัก' : 'Primary currency'}</label>
                       <select className="w-full p-3 border-2 border-gray-300 rounded-xl" value={settings.defaultCurrency || 'THB'} onChange={e => setSettings({ ...settings, defaultCurrency: e.target.value, currencySymbol: e.target.value === 'THB' ? '฿' : e.target.value === 'USD' ? '$' : e.target.value === 'EUR' ? '€' : '฿' })}>
                         <option value="THB">THB (฿ บาท)</option>
                         <option value="USD">USD ($)</option>
                         <option value="EUR">EUR (€)</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-gray-700 mb-1">{language === 'th' ? 'สกุลรอง (สำหรับ Toggle)' : 'Secondary currency (for toggle)'}</label>
                       <select className="w-full p-3 border-2 border-gray-300 rounded-xl" value={settings.secondaryCurrency || ''} onChange={e => setSettings({ ...settings, secondaryCurrency: e.target.value || null })}>
                         <option value="">—</option>
                         <option value="USD">USD ($)</option>
                         <option value="EUR">EUR (€)</option>
                         <option value="THB">THB (฿)</option>
                       </select>
                     </div>
                     {(settings.secondaryCurrency === 'USD' || settings.secondaryCurrency === 'EUR' || settings.secondaryCurrency === 'THB') && (
                       <div className="md:col-span-2">
                         <label className="block text-sm font-bold text-gray-700 mb-1">{language === 'th' ? 'อัตราแลกเปลี่ยน (1 สกุลรอง = กี่บาท)' : 'Exchange rate (1 secondary = ? THB)'}</label>
                         <input type="number" min="0" step="0.01" className="w-full p-3 border-2 border-gray-300 rounded-xl" placeholder="35" value={settings.exchangeRateToSecondary ?? ''} onChange={e => setSettings({ ...settings, exchangeRateToSecondary: e.target.value ? parseFloat(e.target.value) : null })} />
                       </div>
                     )}
                   </div>
                 </div>
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">{t('companyNameTh', language)}</label>
                <input type="text" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.companyName || ''} onChange={e => setSettings({...settings, companyName: e.target.value})} />
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">{t('companyNameEn', language)} <span className="text-sm text-gray-500">{t('optionalEnglish', language)}</span></label>
                <input type="text" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.companyNameEn || ''} onChange={e => setSettings({...settings, companyNameEn: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">{t('taxIdNumber', language)}</label>
                  <input type="text" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.taxId || ''} onChange={e => setSettings({...settings, taxId: e.target.value})} />
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">{t('contactPhone', language)}</label>
                  <input type="text" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.phone || ''} onChange={e => setSettings({...settings, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">{t('email', language)}</label>
                <input type="email" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" placeholder="company@example.com" value={settings.email || ''} onChange={e => setSettings({...settings, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">{t('companyAddress', language)}</label>
                <textarea rows="2" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})} />
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">{t('companyAddressEn', language)} <span className="text-sm text-gray-500">{t('optionalEnglish', language)}</span></label>
                <textarea rows="2" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.addressEn || ''} onChange={e => setSettings({...settings, addressEn: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">{t('country', language)}</label>
                  <select className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.country || 'ไทย'} onChange={e => setSettings({...settings, country: e.target.value})}>
                    <option value="ไทย">🇹🇭 {language === 'th' ? 'ไทย' : 'Thailand'}</option>
                    <option value="United States">🇺🇸 United States</option>
                    <option value="United Kingdom">🇬🇧 United Kingdom</option>
                    <option value="Singapore">🇸🇬 Singapore</option>
                    <option value="Malaysia">🇲🇾 Malaysia</option>
                    <option value="Japan">🇯🇵 {language === 'th' ? 'ญี่ปุ่น' : 'Japan'}</option>
                    <option value="China">🇨🇳 {language === 'th' ? 'จีน' : 'China'}</option>
                    <option value="Vietnam">🇻🇳 {language === 'th' ? 'เวียดนาม' : 'Vietnam'}</option>
                    <option value="Indonesia">🇮🇩 Indonesia</option>
                    <option value="Philippines">🇵🇭 Philippines</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 mb-2">{t('postalCode', language)}</label>
                  <input type="text" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.postalCode || ''} onChange={e => setSettings({...settings, postalCode: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Tab */}
        {activeTab === 'bank' && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-8">
            <div className="bg-green-600 text-white px-6 py-4">
              <h3 className="text-xl font-bold flex items-center"><CreditCardIcon className="w-6 h-6 mr-2" /> {t('bankInfo', language)}</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-lg font-bold text-gray-700 mb-2">{t('selectBank', language)}</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.keys(getBankConfig(language)).map(key => {
                    const bank = getBankConfig(language)[key];
                    return (
                    <button 
                      key={key}
                      onClick={() => setSettings({...settings, bankName: key})}
                      className={`p-3 border-2 rounded-xl font-bold flex flex-col items-center justify-center transition ${settings.bankName === key ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-200' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className={`w-12 h-12 ${bank.color} text-white rounded-full flex items-center justify-center text-xl font-black mb-2 shadow-sm`}>{bank.iconText}</div>
                      <span className="text-sm text-gray-700 text-center mt-1">{bank.name}</span>
                    </button>
                  );})}
                </div>
              </div>

              {settings.bankName === 'custom' && (
                <div className="md:col-span-2 bg-gray-50 border-2 border-dashed border-gray-300 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-white border border-gray-300 flex items-center justify-center flex-shrink-0">
                        {settings.customBankLogo ? <img src={settings.customBankLogo} alt="Bank Logo" className="w-full h-full object-cover" /> : <CreditCardIcon className="text-gray-400" />}
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-bold text-gray-600 mb-1">{t('specifyBankName', language)}</label>
                        <input type="text" placeholder={language === 'th' ? 'เช่น ธนาคารออมสิน...' : 'e.g. Savings Bank...'} className="w-full p-2 border border-gray-300 rounded-lg mb-2" value={settings.customBankName || ''} onChange={e => setSettings({...settings, customBankName: e.target.value})} />
                        <input type="file" accept="image/*" id="bank-upload" className="hidden" onChange={(e) => handleImageUpload(e, 'bank')} />
                        <label htmlFor="bank-upload" className="cursor-pointer text-sm bg-gray-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-900 inline-block">{t('uploadBankLogo', language)}</label>
                    </div>
                </div>
              )}

              <div><label className="block text-lg font-bold text-gray-700 mb-2">{t('bankAccountName', language)}</label><input type="text" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl" value={settings.bankAccountName || ''} onChange={e => setSettings({...settings, bankAccountName: e.target.value})} /></div>
              <div><label className="block text-lg font-bold text-gray-700 mb-2">{t('accountNumber', language)}</label><input type="text" className="w-full p-3 text-lg border-2 border-gray-300 rounded-xl tracking-wider font-bold text-blue-700" value={settings.bankAccountNumber || ''} onChange={e => setSettings({...settings, bankAccountNumber: e.target.value})} /></div>

              <div className="md:col-span-2 border-t border-gray-200 pt-6 mt-4">
                <label className="block text-lg font-bold text-gray-700 mb-2">
                  {language === 'th' ? '📱 QR Code สำหรับรับชำระเงิน' : '📱 Payment QR Code'}
                </label>
                <p className="text-sm text-gray-600 mb-2">
                  {language === 'th' ? 'รูป QR Code จะแสดงท้ายใบแจ้งหนี้และใบเสนอราคา (อัปโหลดรูปภาพ QR Code)' : 'QR image will appear at the end of Invoice and Quotation documents.'}
                </p>
                {settings.paymentQrImage ? (
                  <div className="flex flex-col items-center">
                    <img src={settings.paymentQrImage} alt="Payment QR" className="w-40 h-40 object-contain bg-white border-2 border-gray-300 rounded-lg shadow-sm mb-3" />
                    <button type="button" onClick={() => setSettings({ ...settings, paymentQrImage: null })} className="text-red-600 font-bold underline">
                      {language === 'th' ? 'ลบรูป' : 'Remove image'}
                    </button>
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 text-sm mb-3">
                    {language === 'th' ? 'ยังไม่มีรูป QR' : 'No QR image'}
                  </div>
                )}
                <div className="mt-2">
                  <input type="file" accept="image/*" id="qr-upload" className="hidden" onChange={(e) => handleImageUpload(e, 'qr')} />
                  <label htmlFor="qr-upload" className="cursor-pointer bg-brand-primary text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition inline-block">
                    {language === 'th' ? '📎 เลือกรูป QR Code' : '📎 Select QR image'}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Tab */}
        {activeTab === 'template' && (
          <div className="space-y-8">
            {/* Theme Colors */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-purple-600 text-white px-6 py-4">
                <h3 className="text-xl font-bold flex items-center"><PaintBrushIcon className="w-6 h-6 mr-2" /> {t('selectTheme', language)}</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {getThemes(language).map(theme => (
                    <button
                      key={theme.key}
                      onClick={() => setSettings({...settings, templateTheme: theme.key})}
                      className={`p-4 border-2 rounded-xl transition ${
                        settings.templateTheme === theme.key 
                          ? `border-gray-800 ring-2 ring-offset-2 ring-gray-400` 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg ${theme.bg} shadow-md`}></div>
                        <div className="text-left">
                          <div className="font-bold text-gray-800">{theme.name}</div>
                          <div className="text-xs text-gray-500">{theme.hex}</div>
                        </div>
                      </div>
                      {settings.templateTheme === theme.key && (
                        <div className="absolute top-2 right-2">
                          <CheckIcon className={`w-5 h-5 ${theme.text}`} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Layout Options */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-indigo-600 text-white px-6 py-4">
                <h3 className="text-xl font-bold flex items-center"><Squares2X2Icon className="w-6 h-6 mr-2" /> {t('selectLayout', language)}</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getLayouts(language).map(layout => (
                    <button
                      key={layout.key}
                      onClick={() => setSettings({...settings, templateLayout: layout.key})}
                      className={`p-4 border-2 rounded-xl text-left transition relative ${
                        settings.templateLayout === layout.key 
                          ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-bold text-lg text-gray-800 mb-2">{layout.name}</div>
                      <div className="text-sm text-gray-600">{layout.description}</div>
                      {settings.templateLayout === layout.key && (
                        <div className="absolute top-3 right-3">
                          <CheckIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  {language === 'th' ? 'รูปแบบนี้จะใช้กับบิลจริงทุกประเภท (QT/SO/DO/IV) เมื่อดูและพิมพ์เอกสาร' : 'This layout is used for all real documents (QT/SO/DO/IV) when viewing and printing.'}
                </p>
              </div>
            </div>

            {/* Font Family Options */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
              <div className="bg-green-600 text-white px-6 py-4">
                <h3 className="text-xl font-bold flex items-center">
                  <span className="text-2xl mr-2">🔤</span> {t('selectFont', language)}
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'Sarabun', name: 'Sarabun', description: 'อ่านง่าย เหมาะสำหรับภาษาไทย (แนะนำ)', sample: 'ตัวอย่าง Sample 1234567890' },
                    { key: 'Noto Sans Thai', name: 'Noto Sans Thai', description: 'มาตรฐานสากล รองรับหลายภาษา', sample: 'ตัวอย่าง Sample 1234567890' }
                  ].map(font => (
                    <button
                      key={font.key}
                      onClick={() => setSettings({...settings, fontFamily: font.key})}
                      className={`p-4 border-2 rounded-xl text-left transition relative ${
                        settings.fontFamily === font.key 
                          ? 'border-green-600 bg-green-50 ring-2 ring-green-200' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-bold text-lg text-gray-800 mb-1" style={{ fontFamily: font.key }}>{font.name}</div>
                      <div className="text-sm text-gray-600 mb-2">{font.description}</div>
                      <div className="text-xl text-gray-700 p-2 bg-white rounded border border-gray-200" style={{ fontFamily: font.key }}>
                        {font.sample}
                      </div>
                      {settings.fontFamily === font.key && (
                        <div className="absolute top-3 right-3">
                          <CheckIcon className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Full Document Preview */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-700">{t('previewDocument', language)}</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 font-medium">{t('changeColor', language)}</span>
                  {getThemes(language).map(theme => (
                    <button
                      key={theme.key}
                      onClick={() => setSettings({...settings, templateTheme: theme.key})}
                      className={`w-8 h-8 rounded-lg ${theme.bg} shadow-md hover:scale-110 transition-transform ${
                        settings.templateTheme === theme.key ? 'ring-2 ring-offset-2 ring-gray-800' : ''
                      }`}
                      title={theme.name}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Layout: <span className="font-bold">{getLayouts(language).find(l => l.key === settings.templateLayout)?.name}</span> | 
                Theme: <span className="font-bold">{getThemes(language).find(t => t.key === settings.templateTheme)?.name}</span>
                {currencySettings?.secondaryCurrency && (
                  <>
                    {' | '}
                    <span className="font-medium">{language === 'th' ? 'สกุลเงินตัวอย่าง:' : 'Preview currency:'}</span>{' '}
                    <button
                      type="button"
                      onClick={() => setDisplayCurrency(displayCurrency === 'primary' ? 'secondary' : 'primary')}
                      className="px-3 py-1 rounded-lg bg-white border-2 border-gray-300 hover:border-gray-500 font-bold text-gray-700 transition"
                    >
                      {displayCurrency === 'primary' ? (currencySettings?.currencySymbol || '฿') : currencySettings?.secondaryCurrency}
                    </button>
                  </>
                )}
              </p>
              <TemplatePreview 
                theme={settings.templateTheme} 
                layout={settings.templateLayout}
                settings={settings}
                language={language}
              />
            </div>
          </div>
        )}

      <button 
        onClick={handleSave}
        disabled={loading}
        className="w-full min-h-touch py-4 bg-brand-primary text-white font-bold text-xl rounded-2xl hover:bg-pink-500 transition shadow-lg flex items-center justify-center disabled:bg-gray-400 mt-8 touch-target"
      >
        <CheckIcon className="mr-2 w-6 h-6" /> {loading ? t('saving', language) : t('saveAllSettings', language)}
      </button>
    </>
  );
};

export default SettingsPage;
