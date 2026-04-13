import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import ReCAPTCHA from 'react-google-recaptcha';
import { toast } from 'react-toastify';

const AuthPage = () => {
  // Toggle UI Login (SCRUM-57) và Register (SCRUM-61)
  const [isLogin, setIsLogin] = useState(true); 
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
  
  // State quản lý lỗi hiển thị trên UI (SCRUM-60)
  const [errors, setErrors] = useState({}); 
  
  const [captchaToken, setCaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();

  // Xử lý nhập liệu và xóa lỗi khi user gõ lại
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' }); 
  };

  // Hàm Validate Form nội bộ (SCRUM-60)
  const validateForm = () => {
    let newErrors = {};
    if (!isLogin && !formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên';
    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không đúng định dạng';
    }
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải từ 6 ký tự';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return; // Dừng lại nếu form có lỗi

    // Kiểm tra reCAPTCHA (SCRUM-59)
    if (!captchaToken) {
      toast.warning('Vui lòng xác nhận bạn không phải là robot!');
      return;
    }

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        ...formData,
        captchaToken
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success(response.data.message);
      
      if (response.data.user.role_id === 1) navigate('/admin');
      else if (response.data.user.role_id === 2) navigate('/teacher');
      else navigate('/student/dashboard');

    } catch (error) {
      // Hiển thị lỗi từ Backend trả về (SCRUM-60)
      toast.error(error.response?.data?.message || 'Có lỗi kết nối đến máy chủ!');
      recaptchaRef.current?.reset(); 
      setCaptchaToken(null);
    }
  };

  // Google Login (SCRUM-58)
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/google-login`, {
        googleToken: credentialResponse.credential
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      toast.success('Đăng nhập Google thành công!');

      const userRole = response.data.user.role_id;
      if (userRole === 1) navigate('/admin');
      else if (userRole === 2) navigate('/teacher');
      else navigate('/student/dashboard'); 
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng nhập Google thất bại!');
    }
  };

  return (
    /* Thiết kế Responsive (SCRUM-62): p-4 cho mobile, p-8 cho PC, max-w-md tự động co giãn */
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-8">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-6 text-blue-700">
          {isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Form Đăng ký (SCRUM-61) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và Tên</label>
              <input
                type="text"
                name="fullName"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${errors.fullName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>
          )}

          {/* Form Đăng nhập (SCRUM-57) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
              onChange={handleChange}
              placeholder="email@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              name="password"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'}`}
              onChange={handleChange}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* reCAPTCHA (SCRUM-59) */}
          <div className="flex justify-center my-4 overflow-hidden">
            <div className="transform scale-90 sm:scale-100">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md"
          >
            {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
          </button>
        </form>

        <div className="my-6 flex items-center justify-between">
          <span className="border-b w-1/4 sm:w-1/3"></span>
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Hoặc</span>
          <span className="border-b w-1/4 sm:w-1/3"></span>
        </div>

        {/* Nút Login Google (SCRUM-58) */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Lỗi kết nối dịch vụ Google')}
            theme="filled_blue"
            shape="rectangular"
            size="large"
          />
        </div>

        <p className="mt-8 text-center text-sm text-gray-600">
          {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
          <button
            type="button"
            className="text-blue-600 font-bold hover:underline"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({}); // Reset lỗi khi chuyển tab
            }}
          >
            {isLogin ? 'Tạo ngay' : 'Đăng nhập'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;