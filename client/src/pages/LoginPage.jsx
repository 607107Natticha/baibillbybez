import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock } from 'lucide-react';
import GoogleSignIn from '../components/GoogleSignIn';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !pin) {
      alert('กรุณากรอก Email และ PIN');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/login`, {
        email,
        pin
      });
      
      localStorage.setItem('token', res.data.token);
      
      // Check if user needs onboarding
      if (res.data.isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md text-center transform transition-all border border-gray-100">
        <img src="/logo.png" alt="สบายบิล" className="h-20 w-auto mx-auto mb-4 object-contain" />
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">สบายบิล</h1>
        <p className="text-lg md:text-xl text-gray-500 mb-8">ระบบเปิดบิลสำหรับมืออาชีพ</p>

        {/* Google Login - Simple GIS Button */}
        <div className="mb-4">
          <GoogleSignIn />
        </div>

        <div className="flex items-center mb-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">หรือ</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6 text-left">
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
              className="w-full p-4 text-base md:text-lg border-2 border-gray-300 rounded-2xl focus:border-brand-primary focus:ring-2 focus:ring-brand-light bg-gray-50 transition-all" 
            />
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
              className="w-full p-4 text-2xl md:text-3xl border-2 border-gray-300 rounded-2xl focus:border-brand-primary text-center tracking-[0.5em] bg-gray-50 transition-all" 
            />
          </div>

          {/* Login Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full min-h-touch py-4 bg-brand-primary text-white font-bold text-lg md:text-xl rounded-2xl hover:bg-pink-500 transition shadow-lg mt-4 flex items-center justify-center active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed touch-target"
          >
            {loading ? (
              'กำลังเข้าสู่ระบบ...'
            ) : (
              <><LogIn className="mr-2 w-6 h-6" /> เข้าสู่ระบบ</>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-gray-600 mb-3">ยังไม่มีบัญชี?</p>
          <Link 
            to="/register" 
            className="w-full min-h-touch py-3 bg-pastel-green text-gray-900 font-bold text-base md:text-lg rounded-2xl hover:bg-emerald-400 transition shadow flex items-center justify-center touch-target"
          >
            สมัครสมาชิกใหม่
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;