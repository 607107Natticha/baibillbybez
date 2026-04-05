import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { getApiBase } from '../utils/apiBase';

const API_URL = getApiBase();

export default function EntryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleEnter = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/onboarding-status`);
      navigate(data.isOnboarded ? '/dashboard' : '/onboarding', { replace: true });
    } catch {
      navigate('/onboarding', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light to-pink-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <img src="/logo.png" alt="SabaiBill" className="h-20 w-20 object-contain rounded-2xl border border-white shadow-md" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SabaiBill</h1>
          <p className="mt-2 text-gray-600 text-base">ระบบออกเอกสารใบเสนอราคา / ใบสั่งขาย / ใบส่งของ / ใบแจ้งหนี้</p>
        </div>
        <button
          type="button"
          onClick={handleEnter}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 min-h-touch rounded-2xl bg-brand-primary text-white font-semibold text-lg px-6 py-4 shadow-lg hover:opacity-95 disabled:opacity-60 transition-opacity touch-target"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              กำลังโหลด…
            </>
          ) : (
            <>
              <Building2 className="w-6 h-6" />
              เข้าใช้งาน
            </>
          )}
        </button>
        <p className="text-sm text-gray-500">กดปุ่มเดียว แล้วไปกรอกข้อมูลบริษัทหรือเข้าหน้าหลักทันที</p>
      </div>
    </div>
  );
}
