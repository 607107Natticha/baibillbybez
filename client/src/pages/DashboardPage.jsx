import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { getDocTypeName } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ACTION_CARD_COLORS = {
  QT: 'bg-gradient-to-br from-pink-200 to-pink-400 hover:from-pink-300 hover:to-pink-500 border-pink-300',
  SO: 'bg-gradient-to-br from-orange-200 to-orange-400 hover:from-orange-300 hover:to-orange-500 border-orange-300',
  DO: 'bg-gradient-to-br from-emerald-200 to-emerald-400 hover:from-emerald-300 hover:to-emerald-500 border-emerald-300',
  IV: 'bg-gradient-to-br from-sky-200 to-sky-400 hover:from-sky-300 hover:to-sky-500 border-sky-300',
};

const DashboardPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyNameTh, setCompanyNameTh] = useState('โหลดข้อมูล...');
  const [companyNameEn, setCompanyNameEn] = useState('Loading...');
  const language = useLanguage();
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();

  const docCounts = documents.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {});

  const invoices = documents.filter((d) => d.type === 'IV');
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const amount = (d) => (d.netPayable != null ? Number(d.netPayable) : Number(d.total)) || 0;

  const salesThisMonth = invoices
    .filter((d) => {
      const dte = new Date(d.date);
      return dte.getFullYear() === currentYear && dte.getMonth() === currentMonth;
    })
    .reduce((sum, d) => sum + amount(d), 0);

  const collected = invoices
    .filter((d) => d.status === 'ชำระแล้ว')
    .reduce((sum, d) => sum + amount(d), 0);

  const pending = invoices
    .filter((d) => d.status !== 'ชำระแล้ว' && d.status !== 'ยกเลิก')
    .reduce((sum, d) => sum + amount(d), 0);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      try {
        const docRes = await axios.get(`${API_URL}/api/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDocuments(docRes.data);

        const settingsRes = await axios.get(`${API_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCompanyNameTh(settingsRes.data.companyName || 'บริษัท');
        setCompanyNameEn(settingsRes.data.companyNameEn || settingsRes.data.companyName || 'Company');
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        if (error.response?.status === 401) navigate('/login');
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 skeleton w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 skeleton rounded-2xl" />
          <div className="h-24 skeleton rounded-2xl" />
          <div className="h-24 skeleton rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 skeleton rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          {language === 'th' ? 'แดชบอร์ด' : 'Dashboard'} — {language === 'th' ? companyNameTh : companyNameEn}
        </h2>
      </div>

      {/* 3 กล่องหลัก: ยอดขายเดือนนี้ / เก็บแล้ว / รอเก็บ — Card shadows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-lg flex flex-col justify-center">
          <div className="text-sm font-bold text-gray-500">{language === 'th' ? 'ยอดขายเดือนนี้' : 'Sales this month'}</div>
          <div className="text-2xl md:text-3xl font-black text-gray-900 mt-1 truncate">{formatCurrency(salesThisMonth)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-lg flex flex-col justify-center bg-emerald-50/50">
          <div className="text-sm font-bold text-emerald-700">{language === 'th' ? 'ยอดที่เก็บเงินแล้ว' : 'Collected'}</div>
          <div className="text-2xl md:text-3xl font-black text-emerald-800 mt-1 truncate">{formatCurrency(collected)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-lg flex flex-col justify-center bg-amber-50/50">
          <div className="text-sm font-bold text-amber-700">{language === 'th' ? 'ยอดที่รอเก็บเงิน' : 'Pending'}</div>
          <div className="text-2xl md:text-3xl font-black text-amber-800 mt-1 truncate">{formatCurrency(pending)}</div>
        </div>
      </div>

      {/* รายการนับตามประเภท (รอง) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {['QT', 'SO', 'DO', 'IV'].map((tp) => (
          <div key={tp} className="bg-white rounded-xl border border-gray-200 p-3 shadow-md flex flex-col justify-center">
            <div className="text-xs font-bold text-gray-500">{tp}</div>
            <div className="text-xl font-black text-gray-900 mt-0.5">{docCounts[tp] || 0}</div>
            <div className="text-xs text-gray-500 line-clamp-1">{getDocTypeName(tp, language)}</div>
          </div>
        ))}
      </div>

      {/* Action Cards: hover lift + shadow + icon motion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {['QT', 'SO', 'DO', 'IV'].map((type, idx) => (
          <button
            key={type}
            type="button"
            onClick={() => navigate(`/create-document?type=${type}`)}
            className={`group min-h-[4.5rem] md:min-h-[5rem] w-full p-4 md:p-5 rounded-2xl border-2 cursor-pointer active:scale-[0.98] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl flex flex-col justify-center items-center gap-2 text-white shadow-lg text-center touch-target ${ACTION_CARD_COLORS[type]}`}
          >
            <PlusCircleIcon className="w-8 h-8 shrink-0 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" aria-hidden />
            <span className="text-base font-bold leading-tight">
              {idx + 1}. {getDocTypeName(type, language)}
            </span>
          </button>
        ))}
      </div>
    </>
  );
};

export default DashboardPage;
