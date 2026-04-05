import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Building, UserPlus, Mail, Lock, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !pin || !confirmPin) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('รูปแบบ Email ไม่ถูกต้อง');
      return;
    }

    if (!/^\d{6}$/.test(pin)) {
      alert('PIN ต้องเป็นตัวเลข 6 หลักเท่านั้น');
      return;
    }

    if (pin !== confirmPin) {
      alert('PIN ยืนยันไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/register`, {
        email,
        pin,
        confirmPin
      });
      
      localStorage.setItem('token', res.data.token);
      
      // Redirect to onboarding since new user
      navigate('/onboarding');
    } catch (error) {
      alert(error.response?.data?.message || 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md text-center transform transition-all border border-gray-100">
        <div className="bg-brand-light text-brand-primary p-4 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6 shadow-inner">
          <Building className="w-12 h-12" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">สบายบิล</h1>
        <p className="text-lg md:text-xl text-gray-500 mb-8">สมัครสมาชิกใหม่</p>
        
        <form onSubmit={handleRegister} className="space-y-6 text-left">
          {/* Email */}
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-brand-primary" />
              อีเมล (Email)
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="example@email.com"
              className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light bg-gray-50 transition-all" 
            />
            <p className="text-sm text-gray-500 mt-1">ใช้สำหรับเข้าสู่ระบบ</p>
          </div>

          {/* PIN */}
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-brand-primary" />
              รหัส PIN (6 หลัก)
            </label>
            <input 
              type="password" 
              value={pin} 
              onChange={e => setPin(e.target.value)} 
              maxLength="6"
              inputMode="numeric"
              pattern="\d{6}"
              placeholder="••••••"
              className="w-full p-4 text-3xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 text-center tracking-[0.5em] bg-gray-50 transition-all" 
            />
            <p className="text-sm text-gray-500 mt-1">ตั้ง PIN 6 ตัวเลขสำหรับเข้าสู่ระบบ</p>
          </div>

          {/* Confirm PIN */}
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-2 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-brand-primary" />
              ยืนยัน PIN
            </label>
            <input 
              type="password" 
              value={confirmPin} 
              onChange={e => setConfirmPin(e.target.value)} 
              maxLength="6"
              inputMode="numeric"
              pattern="\d{6}"
              placeholder="••••••"
              className="w-full p-4 text-3xl border-2 border-gray-300 rounded-2xl focus:border-blue-500 text-center tracking-[0.5em] bg-gray-50 transition-all" 
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full min-h-touch py-4 bg-brand-primary text-white font-bold text-lg md:text-xl rounded-2xl hover:bg-pink-500 transition shadow-lg mt-4 flex items-center justify-center active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed touch-target"
          >
            {loading ? (
              'กำลังสมัคร...'
            ) : (
              <><UserPlus className="mr-2 w-6 h-6" /> สมัครสมาชิก</>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link 
            to="/login" 
            className="text-brand-primary font-bold text-lg hover:text-blue-800 flex items-center justify-center transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
