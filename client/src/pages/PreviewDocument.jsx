import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, History, FileText, Globe, Share2, Mail, Download, Printer } from 'lucide-react';
import { t, getDocTypeName as getDocTypeNameTranslated } from '../utils/translations';
import { useCurrency } from '../context/CurrencyContext';
import { numberToThaiBahtText } from '../utils/thaiBahtText';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { THEME_COLORS } from '../styles/theme';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PreviewDocument = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);
  const [document, setDocument] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'th');
  const { formatCurrency, displayCurrency, setDisplayCurrency, currencySettings } = useCurrency();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        
        // Fetch document and settings in parallel
        const [docRes, settingsRes] = await Promise.all([
          axios.get(`${API_URL}/api/documents/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/api/settings`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        setDocument(docRes.data);
        setSettings(settingsRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        const lang = localStorage.getItem('language') || 'th';
        alert(lang === 'th' ? 'ไม่สามารถดึงข้อมูลเอกสารได้' : 'Failed to fetch document');
        navigate('/dashboard');
      }
    };

    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    const onBeforePrint = () => applyPrintScale();
    const onAfterPrint = () => clearPrintScale();
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  // #region agent log — ต้องอยู่ก่อน early return เพื่อไม่ให้ลำดับ Hooks เปลี่ยน
  useEffect(() => {
    const t = setTimeout(() => {
      if (!printRef.current) return;
      const el = printRef.current;
      const table = el.querySelector('table');
      const footer = el.querySelector('.bg-gray-900');
      fetch('http://127.0.0.1:7616/ingest/e40bc125-5b09-4e57-b5e4-59ae8cbc556f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'5f9f11'},body:JSON.stringify({sessionId:'5f9f11',location:'PreviewDocument.jsx:measure',message:'Container and viewport',data:{containerWidth:el.clientWidth,viewportWidth:typeof window!=='undefined'?window.innerWidth:0,tableScrollWidth:table?table.scrollWidth:null,tableClientWidth:table?table.clientWidth:null,footerScrollWidth:footer?footer.scrollWidth:null,footerClientWidth:footer?footer.clientWidth:null},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    }, 300);
    return () => clearTimeout(t);
  }, [document, settings]);
  // #endregion

  const applyPrintScale = () => {
    if (!printRef.current) return;
    const contentHeight = printRef.current.scrollHeight;
    const singlePageHeightPx = 1122; // 297mm at 96dpi
    // Use zoom so full content scales (no clipping); min 0.45 so text stays readable
    const scale = contentHeight > singlePageHeightPx
      ? Math.max(0.45, singlePageHeightPx / contentHeight)
      : 1;
    printRef.current.style.setProperty('--print-zoom', String(scale));
    printRef.current.classList.add('print-fit-one-page');
  };

  const clearPrintScale = () => {
    if (printRef.current) {
      printRef.current.style.removeProperty('--print-zoom');
      printRef.current.classList.remove('print-fit-one-page');
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'th' ? 'en' : 'th';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  if (loading) return <div className="p-4 text-center">{language === 'th' ? 'กำลังโหลดข้อมูล...' : 'Loading...'}</div>;
  if (!document) return <div className="p-4 text-center">{language === 'th' ? 'ไม่พบเอกสาร' : 'Document not found'}</div>;

  // คำนวณ Subtotal (ยอดรวมก่อนภาษี/ส่วนลด)
  const subtotal = document.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const discountAmount = document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : (document.discountValue || 0);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const hasWht = document.whtRate > 0;
  const whtAmount = hasWht && document.netPayable != null ? document.total - document.netPayable : 0;
  const amountForThaiText = (document.netPayable != null ? document.netPayable : document.total) || 0;

  const theme = THEME_COLORS[settings?.templateTheme] || THEME_COLORS.blue;
  const layout = settings?.templateLayout || 'classic';
  const logoSrc = settings?.logoImage || '/logo.png';

  const handleConvert = (targetType) => {
    navigate('/create-document', { state: { sourceDoc: document, targetType } });
  };

  // Soft UI status tags: pastel colors
  const STATUS_CONFIG = {
    'ร่าง': { color: 'bg-gray-100 text-gray-600', label: { th: 'ร่าง', en: 'Draft' } },
    'ส่งแล้ว': { color: 'bg-blue-50 text-blue-800', label: { th: 'ส่งแล้ว', en: 'Sent' } },
    'อนุมัติ': { color: 'bg-green-50 text-green-800', label: { th: 'อนุมัติ', en: 'Approved' } },
    'ยืนยัน': { color: 'bg-orange-50 text-orange-800', label: { th: 'ยืนยัน', en: 'Confirmed' } },
    'จัดส่งแล้ว': { color: 'bg-purple-50 text-purple-800', label: { th: 'จัดส่งแล้ว', en: 'Delivered' } },
    'ค้างชำระ': { color: 'bg-amber-50 text-amber-800', label: { th: 'รอชำระ', en: 'Pending' } },
    'ชำระแล้ว': { color: 'bg-emerald-50 text-emerald-800', label: { th: 'จ่ายแล้ว', en: 'Paid' } },
    'ยกเลิก': { color: 'bg-gray-100 text-gray-500', label: { th: 'ยกเลิก', en: 'Cancelled' } },
  };

  const STATUS_FLOW = {
    QT: ['ร่าง', 'ส่งแล้ว', 'อนุมัติ'],
    SO: ['ร่าง', 'ยืนยัน'],
    DO: ['ร่าง', 'จัดส่งแล้ว'],
    IV: ['ร่าง', 'ค้างชำระ', 'ชำระแล้ว'],
  };

  const qtSalesOrderChild = document?.type === 'QT'
    ? document.children?.find((d) => d.type === 'SO')
    : null;

  const handleStatusUpdate = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/documents/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocument(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      alert(language === 'th' ? 'ไม่สามารถอัปเดตสถานะได้' : 'Failed to update status');
    }
  };

  const getDocTypeName = (type) => {
    return getDocTypeNameTranslated(type, language);
  };

  // Share Functions
  const handleShareLine = () => {
    const url = window.location.href;
    const text = `${getDocTypeName(document.type)} ${document.no}`;
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text + ' ' + url)}`;
    window.open(lineUrl, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `${getDocTypeName(document.type)} ${document.no}`;
    const body = `${language === 'th' ? 'กรุณาตรวจสอบเอกสาร' : 'Please check the document'}: ${window.location.href}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handlePrint = () => {
    applyPrintScale();
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      if (!printRef.current) {
        alert(language === 'th' ? 'ไม่พบเอกสารที่จะสร้าง PDF' : 'Document not found');
        return;
      }

      const contentHeight = printRef.current.scrollHeight;
      const contentWidth = printRef.current.offsetWidth || 794;
      const a4Wpx = 794;
      const a4Hpx = 1122;
      // Scale in clone so at 2x capture we get one A4; min 0.35 for readability
      let scaleToFit = Math.min(1, a4Hpx / (2 * Math.max(contentHeight, 1)), a4Wpx / (2 * Math.max(contentWidth, 1)));
      scaleToFit = Math.max(0.35, scaleToFit);
      const pixelScale = 2;

      const canvas = await html2canvas(printRef.current, {
        scale: pixelScale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc, clonedEl) => {
          clonedDoc.querySelectorAll('[class*="print:hidden"]').forEach(el => {
            el.style.display = 'none';
          });
          if (clonedEl) {
            clonedEl.style.transform = `scale(${scaleToFit})`;
            clonedEl.style.transformOrigin = 'top left';
            clonedEl.style.overflow = 'hidden';
          }
        }
      });

      const imgWpx = canvas.width;
      const imgHpx = canvas.height;
      const pxToMm = 25.4 / 96;
      const imgWmm = imgWpx * pxToMm;
      const imgHmm = imgHpx * pxToMm;
      const margin = 5;
      const pageW = 210 - 2 * margin;
      const pageH = 297 - 2 * margin;
      const scale = Math.min(pageW / imgWmm, pageH / imgHmm);
      const wmm = imgWmm * scale;
      const hmm = imgHmm * scale;
      const x = margin + (pageW - wmm) / 2;
      const y = margin + (pageH - hmm) / 2;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, wmm, hmm);
      pdf.save(`${document.type}-${document.no}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(language === 'th' ? 'ไม่สามารถสร้าง PDF ได้: ' + error.message : 'Failed to generate PDF: ' + error.message);
    }
  };

  // Classic Layout
  const ClassicLayout = () => (
    <div className="p-6 print:p-0" style={{ fontFamily: `"${settings?.fontFamily || 'Sarabun'}", sans-serif` }}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <img src={logoSrc} alt="Logo" className="w-24 h-24 object-contain mb-4" />
          <h2 className="text-3xl font-bold mb-2" style={{ color: theme.primary }}>
            {getDocTypeName(document.type)}
          </h2>
          <div className="text-gray-600">
            <p>{t('documentNo', language)}: <span className="font-semibold text-black">{document.no}</span></p>
            <p>{t('date', language)}: {new Date(document.date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}</p>
            {document.type === 'QT' && document.dueDate && (
              <p>{language === 'th' ? 'วันที่ยืนยันราคา' : 'Price valid until'}: {new Date(document.dueDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-xl font-bold text-gray-800">{settings?.companyName || 'ชื่อบริษัท'}</h3>
          <p className="text-gray-600 text-sm mt-2">
            {language === 'en' && settings?.addressEn ? settings.addressEn : settings?.address}<br/>
            {settings?.country} {settings?.postalCode}<br/>
            {t('phone', language)}: {settings?.phone}<br/>
            {settings?.email && <>{t('email', language)}: {settings.email}<br/></>}
            {t('taxId', language)}: {settings?.taxId}
          </p>
        </div>
      </div>

      <div className="mb-6 border-t-2 border-b-2 py-3" style={{ borderColor: theme.light }}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-bold text-gray-700">{t('customer', language)}:</span>
            <span className="ml-2 text-gray-800">
              {language === 'en' && document.customerEn ? document.customerEn : (document.customer || '-')}
            </span>
          </div>
          <div>
            <span className="font-bold text-gray-700">{t('address', language)}:</span>
            <span className="ml-2 text-gray-800">
              {language === 'en' && document.customerAddressEn ? document.customerAddressEn : (document.customerAddress || '-')}
            </span>
          </div>
          <div>
            <span className="font-bold text-gray-700">{language === 'th' ? 'เลขประจำตัวผู้เสียภาษี' : 'Tax ID'}:</span>
            <span className="ml-2 text-gray-800">{document.customerTaxId || '-'}</span>
          </div>
          <div>
            <span className="font-bold text-gray-700">{language === 'th' ? 'เบอร์โทร' : 'Phone'}:</span>
            <span className="ml-2 text-gray-800">{document.customerPhone || '-'}</span>
          </div>
          {document.type === 'DO' && document.recipient && (
            <div>
              <span className="font-bold text-gray-700">{t('recipient', language)}:</span>
              <span className="ml-2 text-gray-800">{document.recipient}</span>
            </div>
          )}
          {document.type === 'DO' && document.deliveryDate && (
            <div>
              <span className="font-bold text-gray-700">{t('deliveryDate', language)}:</span>
              <span className="ml-2 text-gray-800">{new Date(document.deliveryDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto w-full min-w-0 print:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
      <table className="w-full mb-6 min-w-[28rem]">
        <thead>
          <tr style={{ backgroundColor: theme.light }}>
            <th className="text-left py-2 px-2 font-bold" style={{ color: theme.primary }}>{t('no', language)}</th>
            <th className="text-left py-3 px-2 font-bold w-1/2" style={{ color: theme.primary }}>{t('itemName', language)}</th>
            <th className="text-center py-3 px-2 font-bold" style={{ color: theme.primary }}>{t('qty', language)}</th>
            <th className="text-center py-3 px-2 font-bold" style={{ color: theme.primary }}>{t('unit', language)}</th>
            <th className="text-right py-3 px-2 font-bold" style={{ color: theme.primary }}>{t('pricePerUnit', language)}</th>
            <th className="text-right py-3 px-2 font-bold" style={{ color: theme.primary }}>{t('amount', language)}</th>
          </tr>
        </thead>
        <tbody>
          {document.items.map((item, index) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-3 px-2 text-gray-500">{index + 1}</td>
              <td className="py-3 px-2 font-medium text-gray-800">{item.name}</td>
              <td className="py-3 px-2 text-center">{item.qty}</td>
              <td className="py-3 px-2 text-center text-gray-600">{item.unit || 'ชิ้น'}</td>
              <td className="py-3 px-2 text-right">{item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              <td className="py-3 px-2 text-right">{(item.qty * item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="flex justify-end">
        <div className="w-72">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">{t('subtotal', language)}</span>
            <span className="font-medium">{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          {document.discountValue > 0 && (
            <div className="flex justify-between mb-2 text-red-600">
              <span>
                {t('discount', language)} 
                {document.discountType === 'percent' ? ` (${document.discountValue}%)` : ''}
              </span>
              <span>-{(document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          {document.discountValue > 0 && (
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">{t('afterDiscount', language)}</span>
              <span className="font-medium">{(subtotal - (document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          {document.vatType === 'exclude' && (
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">VAT 7%</span>
              <span className="font-medium">{((subtotal - (document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue)) * 0.07).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          {hasWht && (
            <div className="flex justify-between mb-2 text-amber-700">
              <span className="font-medium">{t('wht', language)} {document.whtRate}%</span>
              <span className="font-medium">-{whtAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 mt-2" style={{ borderTop: `2px solid ${theme.primary}` }}>
            <span className="text-lg font-bold" style={{ color: theme.primary }}>{t('grandTotal', language)}</span>
            <span className="text-lg font-bold" style={{ color: theme.primary }}>
              {formatCurrency(document.total)}
            </span>
          </div>
          {hasWht && document.netPayable != null && (
            <div className="flex justify-between pt-2 mt-1 font-bold text-amber-800">
              <span>{t('netPayable', language)}</span>
              <span>{formatCurrency(document.netPayable)}</span>
            </div>
          )}
          {language === 'th' && (
            <p className="text-sm text-gray-700 mt-2 pt-1 font-medium">({numberToThaiBahtText(amountForThaiText)})</p>
          )}
        </div>
      </div>

      {/* Payment Info - IV/SO/QT */}
      {(document.type === 'IV' || document.type === 'SO' || document.type === 'QT') && (settings?.bankAccountNumber || settings?.bankAccountName) && (
          <div className="mt-6 mb-6 p-4 rounded-lg border-2" style={{ borderColor: theme.light, backgroundColor: theme.light }}>
          <p className="font-bold mb-3" style={{ color: theme.primary }}>🏦 {t('paymentInfo', language)}</p>
          <div className="flex items-start gap-4">
            {settings.customBankLogo && settings.bankName === 'custom' && (
              <img src={settings.customBankLogo} alt="Bank Logo" className="w-16 h-16 object-contain" />
            )}
            <div className="text-sm text-gray-700 space-y-1 flex-1">
              {settings.bankName && <p><span className="font-semibold">{t('bankName', language)}:</span> {settings.bankName === 'custom' ? settings.customBankName : settings.bankName}</p>}
              {settings.bankAccountName && <p><span className="font-semibold">{t('accountName', language)}:</span> {settings.bankAccountName}</p>}
              {settings.bankAccountNumber && <p><span className="font-semibold">{t('accountNumber', language)}:</span> <span className="font-bold text-lg">{settings.bankAccountNumber}</span></p>}
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      {settings?.[`cond${document.type}`] && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-semibold mb-2 text-gray-700">{t('termsAndConditions', language)}</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{settings[`cond${document.type}`]}</p>
        </div>
      )}

      {/* Signature - Preparer Only */}
      <div className="mt-8 flex justify-end" style={{ paddingRight: '15%' }}>
        <div className="inline-block text-center">
          <div className="h-16 flex items-end justify-center mb-1">
            {settings?.signatureImage && (
              <img src={settings.signatureImage} alt="Signature" className="max-w-[140px] max-h-[70px] object-contain" />
            )}
          </div>
          <div className="border-b-2 border-gray-400 w-64 mx-auto mb-1"></div>
          <p className="text-sm text-gray-600">{document.preparerName || t('preparer', language)}</p>
          <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
        </div>
      </div>

      {/* Payment QR - IV/QT */}
      {(document.type === 'IV' || document.type === 'QT') && settings?.paymentQrImage && (
        <div className="mt-6 text-center">
          <p className="text-sm font-semibold text-gray-700 mb-2">{language === 'th' ? 'สแกนเพื่อชำระเงิน' : 'Scan to pay'}</p>
          <img src={settings.paymentQrImage} alt="Payment QR" className="w-32 h-32 mx-auto object-contain border border-gray-200 rounded-lg" />
        </div>
      )}

      {/* Footer — responsive: wrap ไม่ซ้อน */}
      <div className="mt-4 pt-3 border-t-2 bg-gray-900 text-white -mx-6 px-6 py-2 print:bg-gray-900" style={{ borderColor: theme.primary }}>
        <div className="flex flex-wrap gap-y-2 gap-x-4 justify-between items-start sm:items-center text-sm">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <span>📧</span>
            <span className="truncate">{settings?.email || 'contact@company.com'}</span>
          </div>
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <span>📞</span>
            <span>{settings?.phone || '+66-XX-XXX-XXXX'}</span>
          </div>
          <div className="flex items-center gap-2 min-w-0 basis-full sm:basis-auto">
            <span>📍</span>
            <span className="text-xs break-words">
              {language === 'en' && settings?.addressEn ? settings.addressEn : (settings?.address || '123 Sample St., Bangkok')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Modern Layout
  const ModernLayout = () => (
    <div className="p-6 print:p-0" style={{ fontFamily: `"${settings?.fontFamily || 'Sarabun'}", sans-serif` }}>
      <div className="py-4 px-6 -mx-6 -mt-6 mb-6 text-white" style={{ backgroundColor: theme.primary }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src={logoSrc} alt="Logo" className="w-16 h-16 object-contain bg-white rounded-lg p-1" />
            <div>
              <h2 className="text-2xl font-bold">{getDocTypeName(document.type)}</h2>
              <p className="text-sm opacity-90">{document.no}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold">{settings?.companyName || 'ชื่อบริษัท'}</p>
            <p className="text-sm opacity-90">{new Date(document.date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
            {document.type === 'QT' && document.dueDate && (
              <p className="text-sm opacity-90 mt-1">{language === 'th' ? 'วันที่ยืนยันราคา' : 'Price valid until'}: {new Date(document.dueDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="p-3 rounded-lg" style={{ backgroundColor: theme.light }}>
          <p className="font-bold mb-2" style={{ color: theme.primary }}>{t('from', language)}</p>
          <p className="text-sm text-gray-700">{language === 'en' && settings?.companyNameEn ? settings.companyNameEn : settings?.companyName}</p>
          <p className="text-sm text-gray-600">{language === 'en' && settings?.addressEn ? settings.addressEn : settings?.address}</p>
          <p className="text-sm text-gray-600">{settings?.phone}</p>
          {settings?.email && <p className="text-sm text-gray-600">{settings.email}</p>}
        </div>
        <div className="p-4 rounded-lg bg-gray-50">
          <p className="font-bold mb-2 text-gray-700">{t('to', language)}</p>
          <p className="text-sm text-gray-700">{language === 'en' && document.customerEn ? document.customerEn : (document.customer || '-')}</p>
          <p className="text-sm text-gray-600">{language === 'en' && document.customerAddressEn ? document.customerAddressEn : (document.customerAddress || '-')}</p>
          <p className="text-sm text-gray-600 mt-1">{language === 'th' ? 'เลขประจำตัวผู้เสียภาษี' : 'Tax ID'}: {document.customerTaxId || '-'}</p>
          <p className="text-sm text-gray-600">{language === 'th' ? 'เบอร์โทร' : 'Phone'}: {document.customerPhone || '-'}</p>
        </div>
      </div>

      <div className="overflow-x-auto w-full min-w-0 print:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
      <table className="w-full mb-6 min-w-[28rem]">
        <thead>
          <tr style={{ backgroundColor: theme.primary, color: 'white' }}>
            <th className="text-left py-2 px-3 rounded-l-lg">{t('no', language)}</th>
            <th className="text-left py-3 px-3 w-1/2">{t('itemName', language)}</th>
            <th className="text-center py-3 px-3">{t('qty', language)}</th>
            <th className="text-center py-3 px-3">{t('unit', language)}</th>
            <th className="text-right py-3 px-3">{t('price', language)}</th>
            <th className="text-right py-3 px-3 rounded-r-lg">{t('total', language)}</th>
          </tr>
        </thead>
        <tbody>
          {document.items.map((item, index) => (
            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="py-3 px-3 text-gray-500">{index + 1}</td>
              <td className="py-3 px-3 font-medium text-gray-800">{item.name}</td>
              <td className="py-3 px-3 text-center">{item.qty}</td>
              <td className="py-3 px-3 text-center text-gray-600">{item.unit || 'ชิ้น'}</td>
              <td className="py-3 px-3 text-right">{item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              <td className="py-3 px-3 text-right">{(item.qty * item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="flex justify-end">
        <div className="w-72 p-4 rounded-lg" style={{ backgroundColor: theme.light }}>
          <div className="flex justify-between mb-2">
            <span className="text-gray-700">{t('subtotal', language)}</span>
            <span className="font-medium">{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          {document.discountValue > 0 && (
            <div className="flex justify-between mb-2 text-red-600">
              <span>
                {t('discount', language)} 
                {document.discountType === 'percent' ? ` (${document.discountValue}%)` : ''}
              </span>
              <span>-{(document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          {document.discountValue > 0 && (
            <div className="flex justify-between mb-2">
              <span className="text-gray-700">{t('afterDiscount', language)}</span>
              <span className="font-medium">{(subtotal - (document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          {document.vatType === 'exclude' && (
            <div className="flex justify-between mb-2">
              <span className="text-gray-700">VAT 7%</span>
              <span className="font-medium">{((subtotal - (document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue)) * 0.07).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          {hasWht && (
            <div className="flex justify-between mb-2 text-amber-700">
              <span className="font-medium">{t('wht', language)} {document.whtRate}%</span>
              <span className="font-medium">-{whtAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t-2" style={{ borderColor: theme.primary }}>
            <span className="text-lg font-bold" style={{ color: theme.primary }}>{t('grandTotal', language)}</span>
            <span className="text-lg font-bold" style={{ color: theme.primary }}>
              {formatCurrency(document.total)}
            </span>
          </div>
          {hasWht && document.netPayable != null && (
            <div className="flex justify-between pt-2 mt-1 font-bold text-amber-800">
              <span>{t('netPayable', language)}</span>
              <span>{formatCurrency(document.netPayable)}</span>
            </div>
          )}
          {language === 'th' && (
            <p className="text-sm text-gray-700 mt-2 pt-1 font-medium">({numberToThaiBahtText(amountForThaiText)})</p>
          )}
        </div>
      </div>

      {/* Payment Info - IV/SO/QT */}
      {(document.type === 'IV' || document.type === 'SO' || document.type === 'QT') && (settings?.bankAccountNumber || settings?.bankAccountName) && (
        <div className="mt-6 mb-6 p-4 rounded-xl" style={{ backgroundColor: theme.light }}>
          <p className="font-bold mb-2 text-sm" style={{ color: theme.primary }}>🏦 {t('paymentInfo', language)}</p>
          <div className="flex items-start gap-4">
            {settings.customBankLogo && settings.bankName === 'custom' && (
              <img src={settings.customBankLogo} alt="Bank Logo" className="w-16 h-16 object-contain" />
            )}
            <div className="text-sm text-gray-700 space-y-1 flex-1">
              {settings.bankName && <p><span className="font-semibold">{t('bankName', language)}:</span> {settings.bankName === 'custom' ? settings.customBankName : settings.bankName}</p>}
              {settings.bankAccountName && <p><span className="font-semibold">{t('accountName', language)}:</span> {settings.bankAccountName}</p>}
              {settings.bankAccountNumber && <p><span className="font-semibold">{t('accountNumber', language)}:</span> <span className="font-bold text-lg">{settings.bankAccountNumber}</span></p>}
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      {settings?.[`cond${document.type}`] && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-semibold mb-2 text-gray-700">{t('termsAndConditions', language)}</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{settings[`cond${document.type}`]}</p>
        </div>
      )}

      {/* Signature - Preparer Only */}
      <div className="mt-8 flex justify-end" style={{ paddingRight: '15%' }}>
        <div className="inline-block text-center">
          <div className="h-16 flex items-end justify-center mb-1">
            {settings?.signatureImage && (
              <img src={settings.signatureImage} alt="Signature" className="max-w-[140px] max-h-[70px] object-contain" />
            )}
          </div>
          <div className="border-b-2 w-64 mx-auto mb-1" style={{ borderColor: theme.secondary }}></div>
          <p className="text-sm text-gray-600">{document.preparerName || t('preparer', language)}</p>
          <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
        </div>
      </div>

      {/* Payment QR - IV/QT */}
      {(document.type === 'IV' || document.type === 'QT') && settings?.paymentQrImage && (
        <div className="mt-6 text-center">
          <p className="text-sm font-semibold text-gray-700 mb-2">{language === 'th' ? 'สแกนเพื่อชำระเงิน' : 'Scan to pay'}</p>
          <img src={settings.paymentQrImage} alt="Payment QR" className="w-32 h-32 mx-auto object-contain border border-gray-200 rounded-lg" />
        </div>
      )}

      {/* Footer — responsive */}
      <div className="mt-4 pt-3 border-t-2 bg-gray-900 text-white -mx-6 px-6 py-2 print:bg-gray-900" style={{ borderColor: theme.primary }}>
        <div className="flex flex-wrap gap-y-2 gap-x-4 justify-between items-start sm:items-center text-sm">
          <div className="flex items-center gap-2 min-w-0 shrink-0"><span>📧</span><span className="truncate">{settings?.email || 'contact@company.com'}</span></div>
          <div className="flex items-center gap-2 min-w-0 shrink-0"><span>📞</span><span>{settings?.phone || '+66-XX-XXX-XXXX'}</span></div>
          <div className="flex items-center gap-2 min-w-0 basis-full sm:basis-auto"><span>📍</span><span className="text-xs break-words">{language === 'en' && settings?.addressEn ? settings.addressEn : (settings?.address || '123 Sample St., Bangkok')}</span></div>
        </div>
      </div>
    </div>
  );

  // Minimal Layout
  const MinimalLayout = () => (
    <div className="p-6 print:p-0" style={{ fontFamily: `"${settings?.fontFamily || 'Sarabun'}", sans-serif` }}>
      <div className="flex items-start space-x-4 mb-6">
        <img src={logoSrc} alt="Logo" className="w-16 h-16 object-contain" />
        <div>
          <h1 className="text-2xl font-light tracking-wide text-gray-800">{settings?.companyName}</h1>
          <p className="text-sm text-gray-500">{settings?.companyNameEn}</p>
        </div>
      </div>

      <div className="border-l-2 pl-6 mb-6" style={{ borderColor: theme.primary }}>
        <h2 className="text-3xl font-light mb-2" style={{ color: theme.primary }}>
          {getDocTypeName(document.type)}
        </h2>
        <p className="text-gray-500 text-sm">{document.no} | {new Date(document.date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
        {document.type === 'QT' && document.dueDate && (
          <p className="text-gray-500 text-sm mt-1">{language === 'th' ? 'วันที่ยืนยันราคา' : 'Price valid until'}: {new Date(document.dueDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
        <div>
          <p className="text-gray-400 mb-1">{t('from', language)}</p>
          <p className="font-medium text-gray-800">{settings?.companyName}</p>
          <p className="text-gray-600">{language === 'en' && settings?.addressEn ? settings.addressEn : settings?.address}</p>
          <p className="text-gray-600">{settings?.phone}</p>
          {settings?.email && <p className="text-gray-600">{settings.email}</p>}
          <p className="text-gray-600">Tax ID: {settings?.taxId}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-1">{t('to', language)}</p>
          <p className="font-medium text-gray-800">{language === 'en' && document.customerEn ? document.customerEn : (document.customer || '-')}</p>
          <p className="text-gray-600">{language === 'en' && document.customerAddressEn ? document.customerAddressEn : (document.customerAddress || '-')}</p>
          <p className="text-gray-600 text-sm mt-1">{language === 'th' ? 'เลขประจำตัวผู้เสียภาษี' : 'Tax ID'}: {document.customerTaxId || '-'}</p>
          <p className="text-gray-600 text-sm">{language === 'th' ? 'เบอร์โทร' : 'Phone'}: {document.customerPhone || '-'}</p>
        </div>
      </div>

      <div className="overflow-x-auto w-full min-w-0 print:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
      <table className="w-full mb-6 min-w-[28rem]">
        <thead>
          <tr className="border-b-2" style={{ borderColor: theme.primary }}>
            <th className="text-left py-2 px-2 font-normal text-gray-500">#</th>
            <th className="text-left py-3 px-2 font-normal text-gray-500 w-1/2">{t('itemName', language)}</th>
            <th className="text-center py-3 px-2 font-normal text-gray-500">{t('qty', language)}</th>
            <th className="text-center py-3 px-2 font-normal text-gray-500">{t('unit', language)}</th>
            <th className="text-right py-3 px-2 font-normal text-gray-500">{t('price', language)}</th>
            <th className="text-right py-3 px-2 font-normal text-gray-500">{t('total', language)}</th>
          </tr>
        </thead>
        <tbody>
          {document.items.map((item, index) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-3 px-2 text-gray-400">{index + 1}</td>
              <td className="py-3 px-2 text-gray-800">{item.name}</td>
              <td className="py-3 px-2 text-center text-gray-600">{item.qty}</td>
              <td className="py-3 px-2 text-center text-gray-600">{item.unit || 'ชิ้น'}</td>
              <td className="py-3 px-2 text-right text-gray-600">{item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              <td className="py-3 px-2 text-right text-gray-800">{(item.qty * item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="flex justify-end border-t pt-4 mb-4" style={{ borderColor: theme.primary }}>
        <div className="w-80">
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-500">{t('subtotal', language)}</span>
            <span>{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          {document.discountValue > 0 && (
            <div className="flex justify-between mb-2 text-sm text-red-600">
              <span>
                {t('discount', language)} 
                {document.discountType === 'percent' ? ` (${document.discountValue}%)` : ''}
              </span>
              <span>-{(document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          {document.discountValue > 0 && (
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-500">{t('afterDiscount', language)}</span>
              <span>{(subtotal - (document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          {document.vatType === 'exclude' && (
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-500">VAT 7%</span>
              <span>{((subtotal - (document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue)) * 0.07).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          {hasWht && (
            <div className="flex justify-between mb-2 text-sm text-amber-700">
              <span>{t('wht', language)} {document.whtRate}%</span>
              <span>-{whtAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t">
            <span className="text-gray-500">{t('grandTotal', language)}</span>
            <span className="text-xl font-light" style={{ color: theme.primary }}>
              {formatCurrency(document.total)}
            </span>
          </div>
          {hasWht && document.netPayable != null && (
            <div className="flex justify-between pt-2 mt-1 text-sm font-bold text-amber-800">
              <span>{t('netPayable', language)}</span>
              <span>{formatCurrency(document.netPayable)}</span>
            </div>
          )}
          {language === 'th' && (
            <p className="text-sm text-gray-600 mt-2 pt-1">({numberToThaiBahtText(amountForThaiText)})</p>
          )}
        </div>
      </div>

      {/* Payment Info - IV/SO */}
      {(document.type === 'IV' || document.type === 'SO' || document.type === 'QT') && (settings?.bankAccountNumber || settings?.bankAccountName) && (
        <div className="mt-6 mb-8 pb-4 border-b border-gray-200">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">🏦 {t('paymentInfo', language)}</p>
          <div className="flex items-start gap-4">
            {settings.customBankLogo && settings.bankName === 'custom' && (
              <img src={settings.customBankLogo} alt="Bank Logo" className="w-16 h-16 object-contain" />
            )}
            <div className="text-sm text-gray-700 space-y-1 flex-1">
              {settings.bankName && <p>{settings.bankName === 'custom' ? settings.customBankName : settings.bankName}</p>}
              {settings.bankAccountName && <p>{settings.bankAccountName}</p>}
              {settings.bankAccountNumber && <p className="font-bold text-lg">{settings.bankAccountNumber}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions */}
      {settings?.[`cond${document.type}`] && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-semibold mb-2 text-gray-700">{t('termsAndConditions', language)}</p>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{settings[`cond${document.type}`]}</p>
        </div>
      )}

      {/* Signature - Preparer Only */}
      <div className="mt-8 flex justify-end" style={{ paddingRight: '15%' }}>
        <div className="inline-block text-center">
          <div className="h-16 flex items-end justify-center mb-1">
            {settings?.signatureImage && (
              <img src={settings.signatureImage} alt="Signature" className="max-w-[140px] max-h-[70px] object-contain" />
            )}
          </div>
          <div className="w-64 mx-auto mb-1 h-px bg-gray-300"></div>
          <p className="text-sm text-gray-400">{document.preparerName || t('preparer', language)}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
        </div>
      </div>

      {/* Payment QR - IV/QT */}
      {(document.type === 'IV' || document.type === 'QT') && settings?.paymentQrImage && (
        <div className="mt-6 text-center">
          <p className="text-sm font-semibold text-gray-700 mb-2">{language === 'th' ? 'สแกนเพื่อชำระเงิน' : 'Scan to pay'}</p>
          <img src={settings.paymentQrImage} alt="Payment QR" className="w-32 h-32 mx-auto object-contain border border-gray-200 rounded-lg" />
        </div>
      )}

      {/* Footer — responsive */}
      <div className="mt-4 pt-3 border-t-2 bg-gray-900 text-white -mx-6 px-6 py-2 print:bg-gray-900" style={{ borderColor: theme.primary }}>
        <div className="flex flex-wrap gap-y-2 gap-x-4 justify-between items-start sm:items-center text-sm">
          <div className="flex items-center gap-2 min-w-0 shrink-0"><span>📧</span><span className="truncate">{settings?.email || 'contact@company.com'}</span></div>
          <div className="flex items-center gap-2 min-w-0 shrink-0"><span>📞</span><span>{settings?.phone || '+66-XX-XXX-XXXX'}</span></div>
          <div className="flex items-center gap-2 min-w-0 basis-full sm:basis-auto"><span>📍</span><span className="text-xs break-words">{language === 'en' && settings?.addressEn ? settings.addressEn : (settings?.address || '123 Sample St., Bangkok')}</span></div>
        </div>
      </div>
    </div>
  );

  // Compact Layout
  const CompactLayout = () => (
    <div className="p-4 print:p-0" style={{ fontFamily: `"${settings?.fontFamily || 'Sarabun'}", sans-serif`, fontSize: '11px' }}>
      <div className="flex justify-between items-center mb-3 pb-2 border-b-2" style={{ borderColor: theme.primary }}>
        <div className="flex items-center gap-2">
          <img src={logoSrc} alt="Logo" className="w-10 h-10 object-contain" />
          <div>
            <h2 className="text-base font-bold leading-tight" style={{ color: theme.primary }}>
              {settings?.companyName || 'ชื่อบริษัท'}
            </h2>
            <p className="text-xs text-gray-600">{language === 'en' && settings?.addressEn ? settings.addressEn : (settings?.address || '123 ถนนตัวอย่าง')}</p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-lg font-bold" style={{ color: theme.primary }}>
            {getDocTypeName(document.type)}
          </h3>
          <p className="text-xs text-gray-600">{document.no} | {new Date(document.date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
          {document.type === 'QT' && document.dueDate && (
            <p className="text-xs text-gray-600 mt-0.5">{language === 'th' ? 'วันที่ยืนยันราคา' : 'Price valid until'}: {new Date(document.dueDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
          )}
        </div>
      </div>

      <div className="mb-2 py-1 px-2 bg-gray-50 rounded text-xs space-y-0.5">
        <p><span className="font-semibold">{t('customer', language)}:</span> {language === 'en' && document.customerEn ? document.customerEn : document.customer}</p>
        <p><span className="font-semibold">{t('address', language)}:</span> <span className="text-gray-600">{language === 'en' && document.customerAddressEn ? document.customerAddressEn : (document.customerAddress || '-')}</span></p>
        <p><span className="font-semibold">{language === 'th' ? 'เลขประจำตัวผู้เสียภาษี' : 'Tax ID'}:</span> {document.customerTaxId || '-'} | <span className="font-semibold">{language === 'th' ? 'เบอร์โทร' : 'Phone'}:</span> {document.customerPhone || '-'}</p>
      </div>

      <div className="overflow-x-auto w-full min-w-0 print:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
      <table className="w-full text-xs mb-2 border border-gray-300 min-w-[28rem]">
        <thead className="bg-gray-100">
          <tr style={{ borderBottom: `2px solid ${theme.primary}` }}>
            <th className="py-1 px-2 text-left font-bold" style={{ color: theme.primary }}>#</th>
            <th className="py-1 px-2 text-left font-bold" style={{ color: theme.primary }}>{t('itemName', language)}</th>
            <th className="py-1 px-2 text-center font-bold w-12" style={{ color: theme.primary }}>{t('qty', language)}</th>
            <th className="py-1 px-2 text-center font-bold w-12" style={{ color: theme.primary }}>{t('unit', language)}</th>
            <th className="py-1 px-2 text-right font-bold w-20" style={{ color: theme.primary }}>{t('price', language)}</th>
            <th className="py-1 px-2 text-right font-bold w-24" style={{ color: theme.primary }}>{t('total', language)}</th>
          </tr>
        </thead>
        <tbody>
          {document.items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
              <td className="py-1 px-2 text-gray-500">{idx + 1}</td>
              <td className="py-1 px-2 font-medium">{item.name}</td>
              <td className="py-1 px-2 text-center">{item.qty}</td>
              <td className="py-1 px-2 text-center text-gray-600">{item.unit || 'ชิ้น'}</td>
              <td className="py-1 px-2 text-right">{item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              <td className="py-1 px-2 text-right font-bold">{(item.qty * item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="flex justify-end">
        <div className="w-56 border border-gray-300 p-2 bg-gray-50">
          <div className="flex justify-between text-xs py-0.5">
            <span>{t('subtotal', language)}:</span>
            <span className="font-semibold">{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          {document.discountValue > 0 && (
            <div className="flex justify-between text-xs py-0.5 text-red-600">
              <span>
                {t('discount', language)} 
                {document.discountType === 'percent' ? ` (${document.discountValue}%)` : ''}
              </span>
              <span>-{(document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          {document.discountValue > 0 && (
            <div className="flex justify-between text-xs py-0.5">
              <span>{t('afterDiscount', language)}:</span>
              <span className="font-semibold">{(subtotal - (document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue)).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          {document.vatType === 'exclude' && (
            <div className="flex justify-between text-xs py-0.5">
              <span>VAT 7%:</span>
              <span className="font-semibold">{((subtotal - (document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue)) * 0.07).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          {hasWht && (
            <div className="flex justify-between text-xs py-0.5 text-amber-700">
              <span>{t('wht', language)} {document.whtRate}%:</span>
              <span className="font-semibold">-{whtAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          )}
          <div className="flex justify-between text-sm py-1 border-t border-gray-400 mt-1 font-bold" style={{ color: theme.primary }}>
            <span>{t('grandTotal', language)}:</span>
            <span>{formatCurrency(document.total)}</span>
          </div>
          {hasWht && document.netPayable != null && (
            <div className="flex justify-between text-sm py-1 font-bold text-amber-800">
              <span>{t('netPayable', language)}:</span>
              <span>{formatCurrency(document.netPayable)}</span>
            </div>
          )}
          {language === 'th' && (
            <p className="text-xs text-gray-600 mt-1">({numberToThaiBahtText(amountForThaiText)})</p>
          )}
        </div>
      </div>

      {(document.type === 'IV' || document.type === 'SO' || document.type === 'QT') && (settings?.bankAccountNumber || settings?.bankAccountName) && (
        <div className="mt-3 p-3 rounded border" style={{ borderColor: theme.light, backgroundColor: theme.light }}>
          <p className="font-bold mb-1 text-xs" style={{ color: theme.primary }}>🏦 {t('paymentInfo', language)}</p>
          <div className="flex items-start gap-2">
            {settings.customBankLogo && settings.bankName === 'custom' && (
              <img src={settings.customBankLogo} alt="Bank Logo" className="w-12 h-12 object-contain" />
            )}
            <div className="text-xs text-gray-700 space-y-0.5 flex-1">
              {settings.bankName && <p><span className="font-semibold">{t('bankName', language)}:</span> {settings.bankName === 'custom' ? settings.customBankName : settings.bankName}</p>}
              {settings.bankAccountName && <p><span className="font-semibold">{t('accountName', language)}:</span> {settings.bankAccountName}</p>}
              {settings.bankAccountNumber && <p><span className="font-semibold">{t('accountNumber', language)}:</span> <span className="font-bold">{settings.bankAccountNumber}</span></p>}
            </div>
          </div>
        </div>
      )}

      {settings?.[`cond${document.type}`] && (
        <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
          <p className="font-semibold mb-1 text-gray-700 text-xs">{t('termsAndConditions', language)}</p>
          <p className="text-xs text-gray-600 whitespace-pre-wrap">{settings[`cond${document.type}`]}</p>
        </div>
      )}

      <div className="mt-4 flex justify-end" style={{ paddingRight: '15%' }}>
        <div className="inline-block text-center">
          <div className="h-12 flex items-end justify-center mb-1">
            {settings?.signatureImage && (
              <img src={settings.signatureImage} alt="Signature" className="max-w-[100px] max-h-[50px] object-contain" />
            )}
          </div>
          <div className="border-b border-gray-300 w-48 mx-auto mb-1"></div>
          <p className="text-gray-500 text-xs">{document.preparerName || t('preparer', language)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
        </div>
      </div>

      {/* Payment QR - IV/QT */}
      {(document.type === 'IV' || document.type === 'QT') && settings?.paymentQrImage && (
        <div className="mt-4 text-center">
          <p className="text-xs font-semibold text-gray-700 mb-1">{language === 'th' ? 'สแกนเพื่อชำระเงิน' : 'Scan to pay'}</p>
          <img src={settings.paymentQrImage} alt="Payment QR" className="w-24 h-24 mx-auto object-contain border border-gray-200 rounded" />
        </div>
      )}

      <div className="mt-4 pt-2 border-t-2 bg-gray-900 text-white -mx-4 px-4 py-2 print:bg-gray-900 text-xs" style={{ borderColor: theme.primary }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span>📧</span>
            <span>{settings?.email || 'contact@company.com'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📞</span>
            <span>{settings?.phone || '+66-XX-XXX-XXXX'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Professional Layout
  const ProfessionalLayout = () => (
    <div className="p-6 border-4 print:p-0" style={{ borderColor: theme.primary, fontFamily: `"${settings?.fontFamily || 'Sarabun'}", sans-serif` }}>
      <div className="border-2 border-gray-200 p-6">
        <div className="text-center mb-6 pb-4 border-b-2" style={{ borderColor: theme.primary }}>
          <img src={logoSrc} alt="Logo" className="w-24 h-24 object-contain mx-auto mb-3" />
          <h1 className="text-3xl font-bold mb-2" style={{ color: theme.primary }}>
            {settings?.companyName || 'ชื่อบริษัท'}
          </h1>
          <p className="text-sm text-gray-600">{settings?.companyNameEn || 'Company Name'}</p>
          <p className="text-xs text-gray-500 mt-2">{language === 'en' && settings?.addressEn ? settings.addressEn : (settings?.address || 'ที่อยู่บริษัท')}</p>
          {settings?.email && <p className="text-xs text-gray-500">{settings.email}</p>}
        </div>

        <div className="mb-6">
          <div className="text-center py-3 mb-4" style={{ backgroundColor: theme.light }}>
            <h2 className="text-2xl font-bold" style={{ color: theme.primary }}>
              {getDocTypeName(document.type)}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-1">{t('documentNo', language)}:</p>
              <p className="text-gray-700">{document.no}</p>
            </div>
            <div>
              <p className="font-semibold mb-1">{t('date', language)}:</p>
              <p className="text-gray-700">{new Date(document.date).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
            </div>
            {document.type === 'QT' && document.dueDate && (
              <div className="col-span-2">
                <p className="font-semibold mb-1">{language === 'th' ? 'วันที่ยืนยันราคา' : 'Price valid until'}:</p>
                <p className="text-gray-700">{new Date(document.dueDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 p-4 border-2 border-gray-200 rounded-lg">
          <p className="font-bold mb-2" style={{ color: theme.primary }}>{t('customerInfo', language)}</p>
          <p className="font-semibold text-gray-800">{language === 'en' && document.customerEn ? document.customerEn : document.customer}</p>
          <p className="text-sm text-gray-600">{language === 'en' && document.customerAddressEn ? document.customerAddressEn : document.customerAddress}</p>
          <p className="text-sm text-gray-600 mt-1">{language === 'th' ? 'เลขประจำตัวผู้เสียภาษี' : 'Tax ID'}: {document.customerTaxId || '-'}</p>
          <p className="text-sm text-gray-600">{language === 'th' ? 'เบอร์โทร' : 'Phone'}: {document.customerPhone || '-'}</p>
        </div>

        <div className="overflow-x-auto w-full min-w-0 print:overflow-visible" style={{ WebkitOverflowScrolling: 'touch' }}>
        <table className="w-full mb-6 border-2 border-gray-300 min-w-[28rem]">
          <thead>
            <tr style={{ backgroundColor: theme.primary, color: 'white' }}>
              <th className="p-3 text-left font-bold">{t('description', language)}</th>
              <th className="p-3 text-center font-bold w-20">{t('quantity', language)}</th>
              <th className="p-3 text-center font-bold w-20">{t('unit', language)}</th>
              <th className="p-3 text-right font-bold w-32">{t('unitPrice', language)}</th>
              <th className="p-3 text-right font-bold w-32">{t('amount', language)}</th>
            </tr>
          </thead>
          <tbody>
            {document.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-300">
                <td className="p-3">{item.name}</td>
                <td className="p-3 text-center">{item.qty}</td>
                <td className="p-3 text-center text-gray-600">{item.unit || 'ชิ้น'}</td>
                <td className="p-3 text-right">{item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td className="p-3 text-right font-semibold">{(item.qty * item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="flex justify-end mb-6">
          <div className="w-80 border-2 border-gray-300">
            <div className="flex justify-between p-3 border-b border-gray-300">
              <span className="font-semibold">{t('subtotal', language)}</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
            {document.discountValue > 0 && (
              <div className="flex justify-between p-3 border-b border-gray-300 text-red-600">
                <span className="font-semibold">
                  {t('discount', language)} 
                  {document.discountType === 'percent' ? ` (${document.discountValue}%)` : ''}
                </span>
                <span className="font-semibold">-{formatCurrency(document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue)}</span>
              </div>
            )}
            {document.discountValue > 0 && (
              <div className="flex justify-between p-3 border-b border-gray-300">
                <span className="font-semibold">{t('afterDiscount', language)}</span>
                <span className="font-semibold">{formatCurrency(subtotal - (document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue))}</span>
              </div>
            )}
            {document.vatType === 'exclude' && (
              <div className="flex justify-between p-3 border-b border-gray-300">
                <span className="font-semibold">{language === 'th' ? 'ภาษีมูลค่าเพิ่ม 7%' : 'VAT 7%'}</span>
                <span className="font-semibold">{formatCurrency((subtotal - (document.discountType === 'percent' ? subtotal * (document.discountValue / 100) : document.discountValue)) * 0.07)}</span>
              </div>
            )}
            {hasWht && (
              <div className="flex justify-between p-3 border-b border-gray-300 text-amber-700">
                <span className="font-semibold">{t('wht', language)} {document.whtRate}%</span>
                <span className="font-semibold">-{formatCurrency(whtAmount)}</span>
              </div>
            )}
            <div className="flex justify-between p-3 font-bold text-lg" style={{ backgroundColor: theme.light, color: theme.primary }}>
              <span>{t('grandTotal', language)}</span>
              <span>{formatCurrency(document.total)}</span>
            </div>
            {hasWht && document.netPayable != null && (
              <div className="flex justify-between p-3 font-bold text-lg text-amber-800">
                <span>{t('netPayable', language)}</span>
                <span>{formatCurrency(document.netPayable)}</span>
              </div>
            )}
            {language === 'th' && (
              <p className="px-3 pb-2 text-sm text-gray-700 font-medium">({numberToThaiBahtText(amountForThaiText)})</p>
            )}
          </div>
        </div>

        {(document.type === 'IV' || document.type === 'SO' || document.type === 'QT') && (settings?.bankAccountNumber || settings?.bankAccountName) && (
          <div className="mb-6 p-4 rounded-lg border-2" style={{ borderColor: theme.light, backgroundColor: theme.light }}>
            <p className="font-bold mb-2" style={{ color: theme.primary }}>🏦 {t('paymentInfo', language)}</p>
            <div className="flex items-start gap-4">
              {settings.customBankLogo && settings.bankName === 'custom' && (
                <img src={settings.customBankLogo} alt="Bank Logo" className="w-16 h-16 object-contain" />
              )}
              <div className="text-sm text-gray-700 space-y-1 flex-1">
                {settings.bankName && <p><span className="font-semibold">{t('bankName', language)}:</span> {settings.bankName === 'custom' ? settings.customBankName : settings.bankName}</p>}
                {settings.bankAccountName && <p><span className="font-semibold">{t('accountName', language)}:</span> {settings.bankAccountName}</p>}
                {settings.bankAccountNumber && <p><span className="font-semibold">{t('accountNumber', language)}:</span> <span className="font-bold text-lg">{settings.bankAccountNumber}</span></p>}
              </div>
            </div>
          </div>
        )}

        {settings?.[`cond${document.type}`] && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="font-semibold mb-2 text-gray-700">{t('termsAndConditions', language)}</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{settings[`cond${document.type}`]}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end" style={{ paddingRight: '15%' }}>
          <div className="inline-block text-center">
            <div className="h-16 flex items-end justify-center mb-1">
              {settings?.signatureImage && (
                <img src={settings.signatureImage} alt="Signature" className="max-w-[140px] max-h-[70px] object-contain" />
              )}
            </div>
            <div className="border-b-2 border-gray-400 w-64 mx-auto mb-1"></div>
            <p className="font-semibold text-gray-700">{document.preparerName || t('preparer', language)}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US')}</p>
          </div>
        </div>

        {/* Payment QR - IV/QT */}
        {(document.type === 'IV' || document.type === 'QT') && settings?.paymentQrImage && (
          <div className="mt-6 text-center">
            <p className="text-sm font-semibold text-gray-700 mb-2">{language === 'th' ? 'สแกนเพื่อชำระเงิน' : 'Scan to pay'}</p>
            <img src={settings.paymentQrImage} alt="Payment QR" className="w-32 h-32 mx-auto object-contain border border-gray-200 rounded-lg" />
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t-2 bg-gray-900 text-white -mx-6 px-6 py-2 print:bg-gray-900" style={{ borderColor: theme.primary }}>
        <div className="flex flex-wrap gap-y-2 gap-x-4 justify-between items-start sm:items-center text-sm">
          <div className="flex items-center gap-2 min-w-0 shrink-0"><span>📧</span><span className="truncate">{settings?.email || 'contact@company.com'}</span></div>
          <div className="flex items-center gap-2 min-w-0 shrink-0"><span>📞</span><span>{settings?.phone || '+66-XX-XXX-XXXX'}</span></div>
          <div className="flex items-center gap-2 min-w-0 basis-full sm:basis-auto"><span>📍</span><span className="text-xs break-words">{language === 'en' && settings?.addressEn ? settings.addressEn : (settings?.address || '123 Sample St., Bangkok')}</span></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 print:p-0 print:bg-white">
      <div className="print:flex print:justify-center print:items-start print:min-h-0 print:max-h-[297mm] print:overflow-hidden">
        <div id="pdf-print-area" data-pdf-content ref={printRef} className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-x-auto overflow-y-visible print:overflow-hidden print:shadow-none print:w-full print:!w-[210mm] print:!max-w-[210mm]">
        
        {/* Toolbar — responsive: แถวแรก = กลับ + หัวข้อ, แถวสอง = ปุ่มทั้งหมด wrap */}
        <div className="bg-gray-800 text-white p-3 sm:p-4 flex flex-col gap-3 print:hidden">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <button 
              onClick={() => navigate('/dashboard')}
              className="shrink-0 flex items-center px-3 py-2 sm:px-4 bg-gray-700 rounded-lg hover:bg-gray-600 text-sm font-medium"
            >
              <span aria-hidden>&larr;</span>
              <span className="ml-1 sm:ml-2">{language === 'th' ? 'กลับ' : 'Back'}</span>
            </button>
            <h1 className="text-base sm:text-xl font-bold truncate min-w-0 text-center flex-1 mx-2">
              {language === 'th' ? 'ตัวอย่างเอกสาร' : 'Document Preview'}
            </h1>
            <div className="w-16 sm:w-20 shrink-0" aria-hidden />
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
            {currencySettings?.secondaryCurrency && (
              <button
                onClick={() => setDisplayCurrency(displayCurrency === 'primary' ? 'secondary' : 'primary')}
                className="flex items-center justify-center min-w-[2.5rem] px-2 py-2 sm:px-4 bg-gray-700 rounded-lg hover:bg-gray-600 font-bold text-sm"
                title={language === 'th' ? 'สลับสกุลเงิน' : 'Toggle currency'}
              >
                {displayCurrency === 'primary' ? (currencySettings?.currencySymbol || '฿') : currencySettings?.secondaryCurrency}
              </button>
            )}
            <button 
              onClick={toggleLanguage}
              className="flex items-center justify-center min-w-[2.5rem] px-2 py-2 sm:px-4 bg-gray-700 rounded-lg hover:bg-gray-600 font-bold text-sm"
              title={language === 'th' ? 'เปลี่ยนภาษา' : 'Language'}
            >
              <Globe className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">{language === 'th' ? 'TH' : 'EN'}</span>
            </button>
            <button 
              onClick={handleShareLine}
              className="flex items-center justify-center min-w-[2.5rem] px-2 py-2 sm:px-4 bg-green-600 rounded-lg hover:bg-green-500 font-bold text-sm"
              title={language === 'th' ? 'แชร์ไป LINE' : 'Share to LINE'}
            >
              <Share2 className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">LINE</span>
            </button>
            <button 
              onClick={handleShareEmail}
              className="flex items-center justify-center min-w-[2.5rem] px-2 py-2 sm:px-4 bg-purple-600 rounded-lg hover:bg-purple-500 font-bold text-sm"
              title={language === 'th' ? 'แชร์ทาง Email' : 'Share via Email'}
            >
              <Mail className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Email</span>
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center justify-center min-w-[2.5rem] px-2 py-2 sm:px-4 bg-orange-600 rounded-lg hover:bg-orange-500 font-bold text-sm"
              title={language === 'th' ? 'ดาวน์โหลด PDF' : 'Download PDF'}
            >
              <Download className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center justify-center min-w-[2.5rem] px-2 py-2 sm:px-4 bg-blue-600 rounded-lg hover:bg-blue-500 font-bold text-sm"
              title={language === 'th' ? 'พิมพ์เอกสาร' : 'Print'}
            >
              <Printer className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">{language === 'th' ? 'พิมพ์' : 'Print'}</span>
            </button>
          </div>
        </div>

        {/* ส่วนแสดงประวัติเอกสาร (History) */}
        {((document.ancestors && document.ancestors.length > 0) || (document.children && document.children.length > 0)) && (
            <div className="bg-blue-50 p-4 border-b border-blue-100 print:hidden">
                <div className="text-sm font-bold text-blue-800 mb-2 flex items-center"><History className="w-4 h-4 mr-1"/> {language === 'th' ? 'ประวัติเอกสาร' : 'Document History'}</div>
                <div className="flex flex-wrap items-center gap-2">
                    {document.ancestors?.map((doc) => (
                        <div key={doc.id} className="flex items-center">
                            <button onClick={() => navigate(`/documents/${doc.id}`)} className="px-3 py-1 rounded-md text-xs font-bold bg-white text-gray-600 border border-gray-300 hover:text-blue-600 hover:border-blue-400 transition flex items-center">
                                <span className="bg-gray-200 text-gray-700 px-1 rounded mr-1">{doc.type}</span> {doc.no}
                            </button>
                            <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />
                        </div>
                    ))}
                    
                    <div className="px-3 py-1 rounded-md text-xs font-bold bg-blue-600 text-white border border-blue-600 flex items-center shadow-sm">
                         <span className="bg-white bg-opacity-20 text-white px-1 rounded mr-1">{document.type}</span> {document.no} ({language === 'th' ? 'ปัจจุบัน' : 'Current'})
                    </div>

                    {document.children?.map((doc) => (
                        <div key={doc.id} className="flex items-center">
                            <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />
                            <button onClick={() => navigate(`/documents/${doc.id}`)} className="px-3 py-1 rounded-md text-xs font-bold bg-white text-gray-600 border border-gray-300 hover:text-blue-600 hover:border-blue-400 transition flex items-center">
                                <span className="bg-gray-200 text-gray-700 px-1 rounded mr-1">{doc.type}</span> {doc.no}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* ปุ่มแปลงเอกสาร — responsive wrap ไม่ซ้อน */}
            <div className="bg-gray-50 p-3 sm:p-4 border-b border-gray-200 flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start print:hidden items-center">
            <button
              onClick={() => navigate('/create-document', { state: { sourceDoc: document, duplicate: true } })}
              className="min-h-touch px-4 py-2.5 bg-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-300 transition touch-target"
            >
              {language === 'th' ? 'คัดลอกบิล' : 'Duplicate'}
            </button>
            <span className="text-sm font-bold text-gray-500">{language === 'th' ? 'สร้างต่อ:' : 'Convert to:'}</span>
            {document.type === 'QT' && (
                qtSalesOrderChild ? (
                  <button
                    onClick={() => navigate(`/documents/${qtSalesOrderChild.id}`)}
                    className="min-h-touch px-5 py-3 bg-orange-500 text-white text-base font-bold rounded-xl hover:bg-orange-600 transition shadow-lg ring-2 ring-orange-300 ring-offset-2 touch-target"
                  >
                    {language === 'th' ? 'ดู ใบสั่งขาย (SO)' : 'View Sales Order (SO)'}
                  </button>
                ) : (
                  <button onClick={() => handleConvert('SO')} className="min-h-touch px-5 py-3 bg-orange-500 text-white text-base font-bold rounded-xl hover:bg-orange-600 transition shadow-lg ring-2 ring-orange-300 ring-offset-2 touch-target">{language === 'th' ? 'แปลงเป็น ใบสั่งขาย (SO)' : 'Convert to Sales Order (SO)'}</button>
                )
            )}
            {document.type === 'SO' && (
                <button onClick={() => handleConvert('DO')} className="min-h-touch px-5 py-3 bg-green-600 text-white text-base font-bold rounded-xl hover:bg-green-700 transition shadow-lg ring-2 ring-green-300 ring-offset-2 touch-target">{language === 'th' ? 'สร้าง ใบส่งของ (DO)' : 'Create Delivery Order (DO)'}</button>
            )}
            {(document.type === 'SO' || document.type === 'DO') && (
                <button onClick={() => handleConvert('IV')} className="min-h-touch px-5 py-3 bg-purple-600 text-white text-base font-bold rounded-xl hover:bg-purple-700 transition shadow-lg ring-2 ring-purple-300 ring-offset-2 touch-target">{language === 'th' ? 'สร้าง ใบแจ้งหนี้ (IV)' : 'Create Invoice (IV)'}</button>
            )}
            {document.type === 'IV' && (
                <span className="text-sm text-gray-400 italic">{language === 'th' ? 'สิ้นสุดกระบวนการ' : 'End of workflow'}</span>
            )}
        </div>

        {/* Render Selected Layout */}
        {layout === 'classic' && <ClassicLayout />}
        {layout === 'modern' && <ModernLayout />}
        {layout === 'minimal' && <MinimalLayout />}
        {layout === 'compact' && <CompactLayout />}
        {layout === 'professional' && <ProfessionalLayout />}
      </div>
      </div>
    </div>
  );
};

export default PreviewDocument;
