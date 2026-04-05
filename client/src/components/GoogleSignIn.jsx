import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// Google Client ID - ใช้สำหรับ Google Identity Services
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

const GoogleSignIn = () => {
  const navigate = useNavigate();
  const buttonRef = useRef(null);

  useEffect(() => {
    // รอให้ Google Identity Services script โหลดเสร็จ
    if (window.google && buttonRef.current) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 400,
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'center',
      });
    }
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      // ส่ง credential ไป verify ที่ backend
      const res = await axios.post(`${API_URL}/api/auth/google/verify`, {
        credential: response.credential,
      });

      // เก็บ token และ redirect
      localStorage.setItem('token', res.data.token);
      
      if (res.data.isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Google login error:', error);
      alert(error.response?.data?.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
    }
  };

  return (
    <div>
      {/* Google Sign-In Button จะถูก render ที่นี่ */}
      <div ref={buttonRef} className="w-full"></div>
    </div>
  );
};

export default GoogleSignIn;
