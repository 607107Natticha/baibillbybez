import React from 'react';
import { t, getDocTypeName as getDocTypeNameTranslated, formatDate } from '../utils/translations';
import { useCurrency } from '../context/CurrencyContext';
import { numberToThaiBahtText } from '../utils/thaiBahtText';
import { THEME_COLORS } from '../styles/theme';

// Mock Document Data - Language Aware
const getMockDocument = (lang) => ({
  type: 'IV',
  no: 'IV2024-001',
  date: new Date().toISOString(),
  customer: lang === 'th' ? 'บริษัท ตัวอย่าง จำกัด' : 'Sample Company Ltd.',
  customerAddress: lang === 'th' ? '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110' : '123 Sukhumvit Road, Khlong Toei, Bangkok 10110',
  items: [
    { id: 1, name: lang === 'th' ? 'สินค้าตัวอย่าง A' : 'Sample Product A', qty: 2, price: 1500 },
    { id: 2, name: lang === 'th' ? 'สินค้าตัวอย่าง B' : 'Sample Product B', qty: 1, price: 3000 },
    { id: 3, name: lang === 'th' ? 'สินค้าตัวอย่าง C' : 'Sample Product C', qty: 5, price: 500 },
  ],
  vatType: 'exclude',
  total: 8025,
});

const TemplatePreview = ({ theme = 'blue', layout = 'classic', settings = {}, language = 'th' }) => {
  const { formatCurrency } = useCurrency();
  const themeColors = THEME_COLORS[theme] || THEME_COLORS.blue;
  const logoSrc = settings?.logoImage || '/logo.png';
  const MOCK_DOCUMENT = getMockDocument(language);
  const subtotal = MOCK_DOCUMENT.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const fontFamily = settings.fontFamily || 'Sarabun';

  const getDocTypeName = (type) => {
    return getDocTypeNameTranslated(type, language);
  };

  // Classic Layout - เก่าแก่ มีเสน่ห์ (Elegant Traditional)
  const ClassicLayout = () => (
    <div className="p-8 border-8 border-double border-gray-800" style={{ maxWidth: '210mm', margin: '0 auto', fontFamily: `"${fontFamily}", serif`, backgroundColor: '#FFFEF7' }}>
      {/* Header with centered title */}
      <div className="text-center mb-6 pb-4 border-b-4 border-double border-gray-800">
        <img src={logoSrc} alt="Logo" className="w-24 h-24 object-contain mx-auto mb-3" />
        <h1 className="text-3xl font-bold mb-2 tracking-wide" style={{ color: '#1a1a1a', letterSpacing: '0.05em' }}>
          {getDocTypeName(MOCK_DOCUMENT.type)}
        </h1>
        <div className="text-sm text-gray-700">
          <span className="font-semibold">{t('documentNo', language)}:</span> {MOCK_DOCUMENT.no} | 
          <span className="font-semibold ml-2">{t('date', language)}:</span> {formatDate(MOCK_DOCUMENT.date, language)}
        </div>
      </div>

      {/* Company and Customer Info */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div className="border-2 border-gray-800 p-3">
          <h3 className="font-bold mb-2 text-center border-b border-gray-400 pb-1">{t('from', language)}</h3>
          <p className="font-bold text-gray-900">{language === 'en' && settings?.companyNameEn ? settings.companyNameEn : (settings?.companyName || (language === 'th' ? 'ชื่อบริษัท' : 'Company Name'))}</p>
          <p className="text-gray-700 text-xs leading-relaxed mt-1">
            {language === 'en' && settings?.addressEn ? settings.addressEn : (settings?.address || (language === 'th' ? '123 ถนนตัวอย่าง' : '123 Sample Street'))}<br/>
            {settings?.country || (language === 'th' ? 'ไทย' : 'Thailand')} {settings?.postalCode || '10110'}<br/>
            {language === 'th' ? 'โทร' : 'Tel'}: {settings?.phone || '02-123-4567'}<br/>
            {language === 'th' ? 'เลขผู้เสียภาษี' : 'Tax ID'}: {settings?.taxId || '1234567890123'}
          </p>
        </div>
        <div className="border-2 border-gray-800 p-3">
          <h3 className="font-bold mb-2 text-center border-b border-gray-400 pb-1">{t('to', language)}</h3>
          <p className="font-bold text-gray-900">{MOCK_DOCUMENT.customer}</p>
          <p className="text-gray-700 text-xs leading-relaxed mt-1">{MOCK_DOCUMENT.customerAddress}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-6 text-sm border-2 border-gray-800">
        <thead>
          <tr className="bg-gray-200 border-b-2 border-gray-800">
            <th className="text-center py-2 px-2 font-bold border-r border-gray-800">{t('no', language)}</th>
            <th className="text-left py-2 px-3 font-bold border-r border-gray-800">{t('itemName', language)}</th>
            <th className="text-center py-2 px-2 font-bold border-r border-gray-800 w-20">{t('qty', language)}</th>
            <th className="text-right py-2 px-3 font-bold border-r border-gray-800 w-24">{t('price', language)}</th>
            <th className="text-right py-2 px-3 font-bold w-28">{t('amount', language)}</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_DOCUMENT.items.map((item, index) => (
            <tr key={item.id} className="border-b border-gray-800">
              <td className="py-2 px-2 text-center border-r border-gray-800">{index + 1}</td>
              <td className="py-2 px-3 border-r border-gray-800">{item.name}</td>
              <td className="py-2 px-2 text-center border-r border-gray-800">{item.qty}</td>
              <td className="py-2 px-3 text-right border-r border-gray-800">{formatCurrency(item.price)}</td>
              <td className="py-2 px-3 text-right font-semibold">{formatCurrency(item.qty * item.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Section */}
      <div className="flex justify-end mb-6">
        <div className="w-64 text-sm border-2 border-gray-800 p-3">
          <div className="flex justify-between py-1 border-b border-gray-400">
            <span className="font-semibold">{t('subtotal', language)}</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {MOCK_DOCUMENT.vatType === 'exclude' && (
            <div className="flex justify-between py-1 border-b border-gray-400">
              <span className="font-semibold">VAT 7%</span>
              <span>{formatCurrency(subtotal * 0.07)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 mt-2 font-bold text-lg">
            <span>{t('grandTotal', language)}</span>
            <span>
              {formatCurrency(MOCK_DOCUMENT.total)}
            </span>
          </div>
          {language === 'th' && (
            <p className="text-sm text-gray-700 mt-1 font-medium">({numberToThaiBahtText(MOCK_DOCUMENT.total)})</p>
          )}
        </div>
      </div>
      {/* Payment Info - IV only */}
      {MOCK_DOCUMENT.type === 'IV' && (settings?.bankAccountNumber || settings?.bankAccountName) && (
        <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: themeColors.light, backgroundColor: themeColors.light }}>
          <p className="font-bold mb-2" style={{ color: themeColors.primary }}> {t('paymentInfo', language)}</p>
          <div className="text-sm text-gray-700 space-y-1">
            {settings.bankName && <p><span className="font-semibold">{t('bankName', language)}:</span> {settings.bankName === 'custom' ? settings.customBankName : settings.bankName}</p>}
            {settings.bankAccountName && <p><span className="font-semibold">{t('accountName', language)}:</span> {settings.bankAccountName}</p>}
            {settings.bankAccountNumber && <p><span className="font-semibold">{t('accountNumber', language)}:</span> <span className="font-bold text-lg">{settings.bankAccountNumber}</span></p>}
          </div>
        </div>
      )}

      <div className="flex justify-end text-sm">
        <div className="text-center">
          <div className="h-20 flex items-end justify-center mb-2">
            {settings?.signatureImage && (
              <img src={settings.signatureImage} alt="Signature" className="max-w-[120px] max-h-[60px] object-contain" />
            )}
          </div>
          <div className="border-b-2 border-gray-400 w-3/4 mx-auto mb-1"></div>
          <p className="text-xs text-gray-600 font-semibold">{t('seller', language)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatDate(new Date(), language)}</p>
        </div>
      </div>
    </div>
  );

  // Modern Layout - ทันสมัย (Contemporary Gradient)
  const ModernLayout = () => (
    <div className="bg-gradient-to-br from-gray-50 to-white p-8" style={{ maxWidth: '210mm', margin: '0 auto', fontFamily: `"${fontFamily}", sans-serif` }}>
      {/* Gradient Header */}
      <div className="rounded-2xl p-6 mb-6 text-white shadow-2xl" style={{ background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)` }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-white rounded-xl p-2 shadow-lg">
              <img src={logoSrc} alt="Logo" className="w-14 h-14 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">{getDocTypeName(MOCK_DOCUMENT.type)}</h1>
              <p className="text-sm opacity-90">📄 {MOCK_DOCUMENT.no}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{language === 'en' && settings?.companyNameEn ? settings.companyNameEn : (settings?.companyName || (language === 'th' ? 'ชื่อบริษัท' : 'Company Name'))}</p>
            <p className="text-sm opacity-90">📅 {formatDate(MOCK_DOCUMENT.date, language)}</p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-lg border-l-4" style={{ borderColor: themeColors.primary }}>
          <p className="font-bold mb-2 text-sm flex items-center" style={{ color: themeColors.primary }}>
            <span className="mr-2">🏢</span> {t('from', language)}
          </p>
          <p className="font-bold text-gray-900">{language === 'en' && settings?.companyNameEn ? settings.companyNameEn : (settings?.companyName || (language === 'th' ? 'ชื่อบริษัท' : 'Company Name'))}</p>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{language === 'en' && settings?.addressEn ? settings.addressEn : (settings?.address || (language === 'th' ? '123 ถนนตัวอย่าง' : '123 Sample Street'))}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg border-l-4" style={{ borderColor: themeColors.secondary }}>
          <p className="font-bold mb-2 text-sm flex items-center" style={{ color: themeColors.secondary }}>
            <span className="mr-2">👤</span> {t('to', language)}
          </p>
          <p className="font-bold text-gray-900">{MOCK_DOCUMENT.customer}</p>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{MOCK_DOCUMENT.customerAddress}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white" style={{ background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)` }}>
              <th className="text-center py-3 px-3 font-bold">#</th>
              <th className="text-left py-3 px-3 font-bold">{t('itemName', language)}</th>
              <th className="text-center py-3 px-3 font-bold">{t('qty', language)}</th>
              <th className="text-right py-3 px-3 font-bold">{t('price', language)}</th>
              <th className="text-right py-3 px-3 font-bold">{t('total', language)}</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_DOCUMENT.items.map((item, index) => (
              <tr key={item.id} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition`}>
                <td className="py-3 px-3 text-center text-gray-500 font-semibold">{index + 1}</td>
                <td className="py-3 px-3 font-medium text-gray-900">{item.name}</td>
                <td className="py-3 px-3 text-center text-gray-700">{item.qty}</td>
                <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(item.price)}</td>
                <td className="py-3 px-3 text-right font-bold" style={{ color: themeColors.primary }}>{formatCurrency(item.qty * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total Card */}
      <div className="flex justify-end mb-6">
        <div className="bg-white rounded-xl shadow-lg p-5 w-72">
          <div className="flex justify-between py-2 text-sm border-b border-gray-200">
            <span className="text-gray-600">{t('subtotal', language)}</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          {MOCK_DOCUMENT.vatType === 'exclude' && (
            <div className="flex justify-between py-2 text-sm border-b border-gray-200">
              <span className="text-gray-600">VAT 7%</span>
              <span className="font-semibold">{formatCurrency(subtotal * 0.07)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 mt-2 text-lg font-bold" style={{ color: themeColors.primary }}>
            <span>{t('grandTotal', language)}</span>
            <span>{formatCurrency(MOCK_DOCUMENT.total)}</span>
          </div>
          {language === 'th' && (
            <p className="text-sm text-gray-700 mt-1 font-medium">({numberToThaiBahtText(MOCK_DOCUMENT.total)})</p>
          )}
        </div>
      </div>
      {/* Payment Info - IV only */}
      {MOCK_DOCUMENT.type === 'IV' && (settings?.bankAccountNumber || settings?.bankAccountName) && (
        <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: themeColors.light, backgroundColor: themeColors.light }}>
          <p className="font-bold mb-2" style={{ color: themeColors.primary }}> {t('paymentInfo', language)}</p>
          <div className="text-sm text-gray-700 space-y-1">
            {settings.bankName && <p><span className="font-semibold">{t('bankName', language)}:</span> {settings.bankName === 'custom' ? settings.customBankName : settings.bankName}</p>}
            {settings.bankAccountName && <p><span className="font-semibold">{t('accountName', language)}:</span> {settings.bankAccountName}</p>}
            {settings.bankAccountNumber && <p><span className="font-semibold">{t('accountNumber', language)}:</span> <span className="font-bold text-lg">{settings.bankAccountNumber}</span></p>}
          </div>
        </div>
      )}

      <div className="flex justify-end text-sm">
        <div className="text-center">
          <div className="h-20 flex items-end justify-center mb-2">
            {settings?.signatureImage && (
              <img src={settings.signatureImage} alt="Signature" className="max-w-[120px] max-h-[60px] object-contain" />
            )}
          </div>
          <div className="border-b-2 border-gray-400 w-3/4 mx-auto mb-1"></div>
          <p className="text-xs text-gray-600 font-semibold">{t('seller', language)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatDate(new Date(), language)}</p>
        </div>
      </div>
    </div>
  );

  // Minimal Layout - เรียบง่าย (Clean Minimalist)
  const MinimalLayout = () => (
    <div className="p-12" style={{ maxWidth: '210mm', margin: '0 auto', fontFamily: `"${fontFamily}", sans-serif`, fontWeight: 300 }}>
      {/* Header - ไม่มี border */}
      <div className="mb-12">
        <img src={logoSrc} alt="Logo" className="w-20 h-20 object-contain mb-6" />
        <h1 className="text-4xl font-light mb-3" style={{ color: '#1a1a1a', letterSpacing: '0.02em' }}>
          {getDocTypeName(MOCK_DOCUMENT.type)}
        </h1>
        <p className="text-lg text-gray-500 font-light">{MOCK_DOCUMENT.no}</p>
      </div>

      {/* Info Section - ใช้ white space */}
      <div className="mb-12">
        <div className="grid grid-cols-2 gap-12 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{t('from', language)}</p>
            <p className="text-lg font-normal text-gray-900 mb-1">{language === 'en' && settings?.companyNameEn ? settings.companyNameEn : (settings?.companyName || (language === 'th' ? 'ชื่อบริษัท' : 'Company Name'))}</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {language === 'en' && settings?.addressEn ? settings.addressEn : (settings?.address || (language === 'th' ? '123 ถนนตัวอย่าง' : '123 Sample Street'))}<br/>
              {settings?.phone || '02-123-4567'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{t('to', language)}</p>
            <p className="text-lg font-normal text-gray-900 mb-1">{MOCK_DOCUMENT.customer}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{MOCK_DOCUMENT.customerAddress}</p>
          </div>
        </div>
      </div>

      {/* Items Table - เส้นบาง 1px */}
      <div className="mb-12">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-4 font-normal text-gray-500 uppercase tracking-wider text-xs">{t('itemName', language)}</th>
              <th className="text-center py-4 font-normal text-gray-500 uppercase tracking-wider text-xs w-20">{t('qty', language)}</th>
              <th className="text-right py-4 font-normal text-gray-500 uppercase tracking-wider text-xs w-24">{t('price', language)}</th>
              <th className="text-right py-4 font-normal text-gray-500 uppercase tracking-wider text-xs w-28">{t('total', language)}</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_DOCUMENT.items.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-4 text-gray-900">{item.name}</td>
                <td className="py-4 text-center text-gray-600">{item.qty}</td>
                <td className="py-4 text-right text-gray-600">{formatCurrency(item.price)}</td>
                <td className="py-4 text-right font-normal text-gray-900">{formatCurrency(item.qty * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total - อยู่ขวามือ */}
      <div className="flex justify-end mb-12">
        <div className="w-80 text-base">
          <div className="flex justify-between py-3 text-gray-600">
            <span>{t('subtotal', language)}</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {MOCK_DOCUMENT.vatType === 'exclude' && (
            <div className="flex justify-between py-3 text-gray-600">
              <span>VAT 7%</span>
              <span>{formatCurrency(subtotal * 0.07)}</span>
            </div>
          )}
          <div className="flex justify-between pt-4 mt-4 border-t border-gray-300 text-xl font-normal text-gray-900">
            <span>{t('grandTotal', language)}</span>
            <span>
              {formatCurrency(MOCK_DOCUMENT.total)}
            </span>
          </div>
          {language === 'th' && (
            <p className="text-sm text-gray-600 mt-2">({numberToThaiBahtText(MOCK_DOCUMENT.total)})</p>
          )}
        </div>
      </div>
      {/* Payment Info - IV only */}
      {MOCK_DOCUMENT.type === 'IV' && (settings?.bankAccountNumber || settings?.bankAccountName) && (
        <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: themeColors.light, backgroundColor: themeColors.light }}>
          <p className="font-bold mb-2" style={{ color: themeColors.primary }}> {t('paymentInfo', language)}</p>
          <div className="text-sm text-gray-700 space-y-1">
            {settings.bankName && <p><span className="font-semibold">{t('bankName', language)}:</span> {settings.bankName === 'custom' ? settings.customBankName : settings.bankName}</p>}
            {settings.bankAccountName && <p><span className="font-semibold">{t('accountName', language)}:</span> {settings.bankAccountName}</p>}
            {settings.bankAccountNumber && <p><span className="font-semibold">{t('accountNumber', language)}:</span> <span className="font-bold text-lg">{settings.bankAccountNumber}</span></p>}
          </div>
        </div>
      )}

      <div className="flex justify-end text-sm">
        <div className="text-center">
          <div className="h-20 flex items-end justify-center mb-2">
            {settings?.signatureImage && (
              <img src={settings.signatureImage} alt="Signature" className="max-w-[120px] max-h-[60px] object-contain" />
            )}
          </div>
          <div className="border-b-2 border-gray-300 w-3/4 mx-auto mb-1"></div>
          <p className="text-xs text-gray-500 font-light">{t('seller', language)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatDate(new Date(), language)}</p>
        </div>
      </div>
    </div>
  );

  // Compact Layout - กระชับ (Dense & Efficient)
  const CompactLayout = () => (
    <div className="p-4 bg-white" style={{ maxWidth: '210mm', margin: '0 auto', fontFamily: `"${fontFamily}", sans-serif`, fontSize: '11px' }}>
      {/* Header - แน่น */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b-2" style={{ borderColor: themeColors.primary }}>
        <div className="flex items-center gap-2">
          <img src={logoSrc} alt="Logo" className="w-10 h-10 object-contain" />
          <div>
            <h2 className="text-base font-bold leading-tight" style={{ color: themeColors.primary }}>
              {language === 'en' && settings?.companyNameEn ? settings.companyNameEn : (settings?.companyName || (language === 'th' ? 'ชื่อบริษัท' : 'Company Name'))}
            </h2>
            <p className="text-xs text-gray-600">{language === 'en' && settings?.addressEn ? settings.addressEn : (settings?.address || (language === 'th' ? '123 ถนนตัวอย่าง' : '123 Sample Street'))}</p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-lg font-bold" style={{ color: themeColors.primary }}>
            {getDocTypeName(MOCK_DOCUMENT.type)}
          </h3>
          <p className="text-xs text-gray-600">{MOCK_DOCUMENT.no} | {formatDate(MOCK_DOCUMENT.date, language)}</p>
        </div>
      </div>

      {/* Customer - 1 บรรทัด */}
      <div className="mb-2 py-1 px-2 bg-gray-50 rounded">
        <span className="font-semibold">{t('customer', language)}:</span> {MOCK_DOCUMENT.customer} | <span className="text-gray-600">{MOCK_DOCUMENT.customerAddress}</span>
      </div>

      {/* Items Table - แน่นมาก */}
      <table className="w-full text-xs mb-2 border border-gray-300">
        <thead className="bg-gray-100">
          <tr style={{ borderBottom: `2px solid ${themeColors.primary}` }}>
            <th className="py-1 px-2 text-left font-bold" style={{ color: themeColors.primary }}>#</th>
            <th className="py-1 px-2 text-left font-bold" style={{ color: themeColors.primary }}>{t('itemName', language)}</th>
            <th className="py-1 px-2 text-center font-bold w-12" style={{ color: themeColors.primary }}>{t('qty', language)}</th>
            <th className="py-1 px-2 text-right font-bold w-20" style={{ color: themeColors.primary }}>{t('price', language)}</th>
            <th className="py-1 px-2 text-right font-bold w-24" style={{ color: themeColors.primary }}>{t('total', language)}</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_DOCUMENT.items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="py-1 px-2 text-gray-500">{idx + 1}</td>
              <td className="py-1 px-2 font-medium">{item.name}</td>
              <td className="py-1 px-2 text-center">{item.qty}</td>
              <td className="py-1 px-2 text-right">{formatCurrency(item.price)}</td>
              <td className="py-1 px-2 text-right font-bold">{formatCurrency(item.qty * item.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total - กระชับ */}
      <div className="flex justify-end">
        <div className="w-56 border border-gray-300 p-2 bg-gray-50">
          <div className="flex justify-between text-xs py-0.5">
            <span>{t('subtotal', language)}:</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          {MOCK_DOCUMENT.vatType === 'exclude' && (
            <div className="flex justify-between text-xs py-0.5">
              <span>VAT 7%:</span>
              <span className="font-semibold">{formatCurrency(subtotal * 0.07)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm py-1 border-t border-gray-400 mt-1 font-bold" style={{ color: themeColors.primary }}>
            <span>{t('grandTotal', language)}:</span>
            <span>{formatCurrency(MOCK_DOCUMENT.total)}</span>
          </div>
          {language === 'th' && (
            <p className="text-xs text-gray-600 mt-1">({numberToThaiBahtText(MOCK_DOCUMENT.total)})</p>
          )}
        </div>
      </div>
      {/* Payment Info - IV only */}
      {MOCK_DOCUMENT.type === 'IV' && (settings?.bankAccountNumber || settings?.bankAccountName) && (
        <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: themeColors.light, backgroundColor: themeColors.light }}>
          <p className="font-bold mb-2" style={{ color: themeColors.primary }}> {t('paymentInfo', language)}</p>
          <div className="text-sm text-gray-700 space-y-1">
            {settings.bankName && <p><span className="font-semibold">{t('bankName', language)}:</span> {settings.bankName === 'custom' ? settings.customBankName : settings.bankName}</p>}
            {settings.bankAccountName && <p><span className="font-semibold">{t('accountName', language)}:</span> {settings.bankAccountName}</p>}
            {settings.bankAccountNumber && <p><span className="font-semibold">{t('accountNumber', language)}:</span> <span className="font-bold text-lg">{settings.bankAccountNumber}</span></p>}
          </div>
        </div>
      )}

      <div className="flex justify-end mt-4 text-xs">
        <div className="text-center">
          <div className="h-16 flex items-end justify-center mb-2">
            {settings?.signatureImage && (
              <img src={settings.signatureImage} alt="Signature" className="max-w-[100px] max-h-[50px] object-contain" />
            )}
          </div>
          <div className="border-b border-gray-300 w-3/4 mx-auto mb-1"></div>
          <p className="text-gray-500 text-xs">{t('seller', language)}</p>
          <p className="text-xs text-gray-400 mt-1">{formatDate(new Date(), language)}</p>
        </div>
      </div>
    </div>
  );

  // Professional Layout - หรูหรา มีกรอบ
  const ProfessionalLayout = () => (
    <div className="p-8 border-4" style={{ borderColor: themeColors.primary }}>
      <div className="border-2 border-gray-200 p-6">
        <div className="text-center mb-6 pb-4 border-b-2" style={{ borderColor: themeColors.primary }}>
          <img src={logoSrc} alt="Logo" className="w-24 h-24 object-contain mx-auto mb-3" />
          <h1 className="text-3xl font-bold mb-2" style={{ color: themeColors.primary }}>
            {language === 'en' && settings?.companyNameEn ? settings.companyNameEn : (settings?.companyName || (language === 'th' ? 'ชื่อบริษัท' : 'Company Name'))}
          </h1>
          <p className="text-sm text-gray-600">{language === 'en' ? (settings?.companyName || 'ชื่อบริษัท') : (settings?.companyNameEn || 'Company Name')}</p>
          <p className="text-xs text-gray-500 mt-2">{language === 'en' && settings?.addressEn ? settings.addressEn : (settings?.address || (language === 'th' ? 'ที่อยู่บริษัท' : 'Company Address'))}</p>
        </div>

        <div className="mb-6">
          <div className="text-center py-3 mb-4" style={{ backgroundColor: themeColors.light }}>
            <h2 className="text-2xl font-bold" style={{ color: themeColors.primary }}>
              {getDocTypeName(MOCK_DOCUMENT.type)}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-1">{t('documentNo', language)}:</p>
              <p className="text-gray-700">{MOCK_DOCUMENT.no}</p>
            </div>
            <div>
              <p className="font-semibold mb-1">{t('date', language)}:</p>
              <p className="text-gray-700">{formatDate(MOCK_DOCUMENT.date, language)}</p>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg">
          <p className="font-bold mb-2" style={{ color: themeColors.primary }}>{t('customerInfo', language)}</p>
          <p className="font-semibold text-gray-800">{MOCK_DOCUMENT.customer}</p>
          <p className="text-sm text-gray-600">{MOCK_DOCUMENT.customerAddress}</p>
        </div>

        <table className="w-full mb-6 border-2 border-gray-300">
          <thead>
            <tr style={{ backgroundColor: themeColors.primary, color: 'white' }}>
              <th className="p-3 text-left font-bold">{t('description', language)}</th>
              <th className="p-3 text-center font-bold w-24">{t('quantity', language)}</th>
              <th className="p-3 text-right font-bold w-32">{t('unitPrice', language)}</th>
              <th className="p-3 text-right font-bold w-32">{t('amount', language)}</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_DOCUMENT.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-300">
                <td className="p-3">{item.name}</td>
                <td className="p-3 text-center">{item.qty}</td>
                <td className="p-3 text-right">{formatCurrency(item.price)}</td>
                <td className="p-3 text-right font-semibold">{formatCurrency(item.qty * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-80 border-2 border-gray-300">
            <div className="flex justify-between p-3 border-b border-gray-300">
              <span className="font-semibold">{t('subtotal', language)}</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between p-3 border-b border-gray-300">
              <span className="font-semibold">{language === 'th' ? 'ภาษีมูลค่าเพิ่ม 7%' : 'VAT 7%'}</span>
              <span className="font-semibold">{formatCurrency(subtotal * 0.07)}</span>
            </div>
            <div className="flex justify-between p-3 font-bold text-lg" style={{ backgroundColor: themeColors.light, color: themeColors.primary }}>
              <span>{t('grandTotal', language)}</span>
              <span>{formatCurrency(MOCK_DOCUMENT.total)}</span>
            </div>
            {language === 'th' && (
              <p className="px-3 pb-2 text-sm text-gray-700 font-medium">({numberToThaiBahtText(MOCK_DOCUMENT.total)})</p>
            )}
          </div>
        </div>
        {/* Payment Info - IV only */}
        {MOCK_DOCUMENT.type === 'IV' && (settings?.bankAccountNumber || settings?.bankAccountName) && (
          <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: themeColors.light, backgroundColor: themeColors.light }}>
            <p className="font-bold mb-2" style={{ color: themeColors.primary }}> {t('paymentInfo', language)}</p>
            <div className="text-sm text-gray-700 space-y-1">
              {settings.bankName && <p><span className="font-semibold">{t('bankName', language)}:</span> {settings.bankName === 'custom' ? settings.customBankName : settings.bankName}</p>}
              {settings.bankAccountName && <p><span className="font-semibold">{t('accountName', language)}:</span> {settings.bankAccountName}</p>}
              {settings.bankAccountNumber && <p><span className="font-semibold">{t('accountNumber', language)}:</span> <span className="font-bold text-lg">{settings.bankAccountNumber}</span></p>}
            </div>
          </div>
        )}

        <div className="flex justify-end mt-8">
          <div className="text-center">
            <div className="h-24 flex items-end justify-center mb-2">
              {settings?.signatureImage && (
                <img src={settings.signatureImage} alt="Signature" className="max-w-[140px] max-h-[70px] object-contain" />
              )}
            </div>
            <div className="border-b-2 border-gray-400 w-3/4 mx-auto mb-2"></div>
            <p className="font-semibold text-gray-700">{t('seller', language)}</p>
            <p className="text-xs text-gray-500 mt-1">{formatDate(new Date(), language)}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {layout === 'classic' && <ClassicLayout />}
      {layout === 'modern' && <ModernLayout />}
      {layout === 'minimal' && <MinimalLayout />}
      {layout === 'compact' && <CompactLayout />}
      {layout === 'professional' && <ProfessionalLayout />}
    </div>
  );
};

export default TemplatePreview;
