import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Building, ImageIcon, MapPin, Phone, CreditCard, ChevronRight, ChevronLeft, Check, Upload, Globe, Mail } from 'lucide-react';

import { getApiBase } from '../utils/apiBase';

const API_URL = getApiBase();

const COUNTRIES = [
  { code: 'TH', name: 'ไทย', postalLength: 5 },
  { code: 'US', name: 'สหรัฐอเมริกา', postalLength: 5 },
  { code: 'CN', name: 'จีน', postalLength: 6 },
  { code: 'JP', name: 'ญี่ปุ่น', postalLength: 7 },
  { code: 'SG', name: 'สิงคโปร์', postalLength: 6 },
  { code: 'MY', name: 'มาเลเซีย', postalLength: 5 },
  { code: 'OTHER', name: 'อื่นๆ', postalLength: 10 },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    companyNameEn: '',
    taxId: '',
    address: '',
    country: 'ไทย',
    postalCode: '',
    phone: '',
    logoImage: null,
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    if (!formData.companyName.trim()) {
      alert('กรุณากรอกชื่อบริษัท (ภาษาไทย)');
      return false;
    }
    if (!formData.companyNameEn.trim()) {
      alert('กรุณากรอกชื่อบริษัท (ภาษาอังกฤษ)');
      return false;
    }
    if (!formData.taxId.trim()) {
      alert('กรุณากรอกเลขประจำตัวผู้เสียภาษี');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.address.trim()) {
      alert('กรุณากรอกที่อยู่');
      return false;
    }
    if (!formData.country) {
      alert('กรุณาเลือกประเทศ');
      return false;
    }
    if (!formData.postalCode.trim()) {
      alert('กรุณากรอกรหัสไปรษณีย์');
      return false;
    }
    if (!formData.phone.trim()) {
      alert('กรุณากรอกเบอร์โทรศัพท์');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleComplete = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/onboarding/complete`, formData);
      
      alert('บันทึกข้อมูลสำเร็จ! ยินดีต้อนรับสู่ระบบสบายบิล');
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  // Progress Indicator
  const ProgressBar = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-12 h-12 rounded-full text-xl font-bold ${
          step >= 1 ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'
        }`}>
          1
        </div>
        <div className={`w-16 h-1 rounded ${step >= 2 ? 'bg-brand-primary' : 'bg-gray-200'}`} />
        <div className={`flex items-center justify-center w-12 h-12 rounded-full text-xl font-bold ${
          step >= 2 ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'
        }`}>
          2
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-brand-primary text-white p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4 shadow-lg">
            <Building className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ตั้งค่าข้อมูลบริษัท</h1>
          <p className="text-lg text-gray-600">กรุณากรอกข้อมูลบริษัทของคุณเพื่อเริ่มต้นใช้งาน</p>
        </div>

        {/* Progress */}
        <ProgressBar />

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Building className="w-7 h-7 mr-3 text-brand-primary" />
                ข้อมูลบริษัทพื้นฐาน
              </h2>

              {/* Logo Upload */}
              <div className="border-2 border-dashed border-pink-200 bg-brand-light p-6 rounded-2xl text-center">
                <label className="block text-xl font-bold text-gray-700 mb-4 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 mr-2 text-brand-primary" />
                  โลโก้บริษัท (ถ้ามี)
                </label>
                {formData.logoImage ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={formData.logoImage} 
                      alt="Logo Preview" 
                      className="w-32 h-32 object-contain bg-white border border-gray-300 rounded-lg shadow-sm mb-4" 
                    />
                    <button 
                      onClick={() => setFormData({...formData, logoImage: null})}
                      className="text-red-500 font-bold text-lg hover:underline"
                    >
                      ลบรูปภาพ
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-200 border-2 border-dashed border-gray-400 rounded-2xl mx-auto flex items-center justify-center text-gray-500 mb-4">
                    <span className="text-4xl">📷</span>
                  </div>
                )}
                <div className="mt-4">
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="logo-upload" 
                    className="hidden" 
                    onChange={handleImageUpload}
                  />
                  <label 
                    htmlFor="logo-upload" 
                    className="cursor-pointer bg-brand-primary text-white px-6 py-3 rounded-2xl font-bold text-lg hover:bg-pink-500 transition inline-flex items-center"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {formData.logoImage ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปภาพ'}
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-2">รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 5MB)</p>
              </div>

              {/* Company Name Thai */}
              <div>
                <label className="block text-xl font-bold text-gray-700 mb-2">
                  ชื่อบริษัท / ร้านค้า (ภาษาไทย) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                  placeholder="เช่น บริษัท สบายบิล จำกัด"
                  className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light bg-gray-50"
                />
              </div>

              {/* Company Name English */}
              <div>
                <label className="block text-xl font-bold text-gray-700 mb-2">
                  ชื่อบริษัท (ภาษาอังกฤษ) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={formData.companyNameEn}
                  onChange={e => setFormData({...formData, companyNameEn: e.target.value})}
                  placeholder="e.g. Sabaibill Co., Ltd."
                  className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light bg-gray-50"
                />
              </div>

              {/* Tax ID */}
              <div>
                <label className="block text-xl font-bold text-gray-700 mb-2">
                  เลขประจำตัวผู้เสียภาษี <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={formData.taxId}
                  onChange={e => setFormData({...formData, taxId: e.target.value})}
                  placeholder="เช่น 1234567890123"
                  className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light bg-gray-50"
                />
              </div>

              {/* Next Button */}
              <button
                onClick={handleNext}
                className="w-full py-4 bg-brand-primary text-white font-bold text-xl rounded-2xl hover:bg-pink-500 transition shadow-lg flex items-center justify-center"
              >
                ถัดไป <ChevronRight className="w-6 h-6 ml-2" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <MapPin className="w-7 h-7 mr-3 text-brand-primary" />
                ที่อยู่และข้อมูลติดต่อ
              </h2>

              {/* Address */}
              <div>
                <label className="block text-xl font-bold text-gray-700 mb-2 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-brand-primary" />
                  ที่อยู่ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="เลขที่, ถนน, ซอย, แขวง/ตำบล, เขต/อำเภอ, จังหวัด"
                  rows="4"
                  className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light focus:shadow-md bg-white shadow-sm transition-all"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-xl font-bold text-gray-700 mb-2 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-brand-primary" />
                  ประเทศ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={e => setFormData({...formData, country: e.target.value})}
                  className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light focus:shadow-md bg-white shadow-sm transition-all"
                >
                  {COUNTRIES.map(country => (
                    <option key={country.code} value={country.name}>{country.name}</option>
                  ))}
                </select>
              </div>

              {/* Postal Code */}
              <div>
                <label className="block text-xl font-bold text-gray-700 mb-2">
                  รหัสไปรษณีย์ <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={formData.postalCode}
                  onChange={e => setFormData({...formData, postalCode: e.target.value})}
                  placeholder={formData.country === 'ไทย' ? 'เช่น 10110' : 'Postal Code'}
                  className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light focus:shadow-md bg-white shadow-sm transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xl font-bold text-gray-700 mb-2 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-brand-primary" />
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input 
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="เช่น 02-123-4567 หรือ 081-234-5678"
                  className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light focus:shadow-md bg-white shadow-sm transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleBack}
                  className="flex-1 py-4 bg-gray-200 text-gray-700 font-bold text-xl rounded-2xl hover:bg-gray-300 transition flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6 mr-2" /> กลับ
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 min-h-touch py-4 bg-pastel-green text-gray-900 font-bold text-lg md:text-xl rounded-2xl hover:bg-emerald-400 transition shadow-lg flex items-center justify-center disabled:bg-gray-400 touch-target"
                >
                  {loading ? (
                    'กำลังบันทึก...'
                  ) : (
                    <><Check className="w-6 h-6 mr-2" /> เริ่มต้นใช้งาน</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-lg">
            ขั้นตอนที่ {step} จาก 2 | ข้อมูลเหล่านี้จะแสดงในเอกสารของคุณ
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
