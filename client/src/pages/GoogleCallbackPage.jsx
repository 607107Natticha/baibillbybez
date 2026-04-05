import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const isOnboarded = searchParams.get('isOnboarded') === 'true';
    const error = searchParams.get('error');

    if (error) {
      alert('เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
      navigate('/login');
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      
      // Redirect based on onboarding status
      if (isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-800">กำลังเข้าสู่ระบบด้วย Google...</h2>
        <p className="text-gray-500 mt-2">กรุณารอสักครู่</p>
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
