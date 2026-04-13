import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

const StudentLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { path: '/student/dashboard', icon: '🏠', label: 'Trang chủ (Tìm đề)' },
    { path: '/student/classes', icon: '📚', label: 'Lớp học của tôi' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <div className="w-64 bg-blue-800 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 text-center border-b border-blue-700">
          <h2 className="text-3xl font-black tracking-wider text-yellow-400">EXAM<span className="text-white">TEST</span></h2>
          <p className="text-sm text-blue-200 mt-1">Cổng Học Sinh</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                location.pathname === item.path 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-blue-200 hover:bg-blue-700 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-700">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH (Outlet sẽ hiển thị Dashboard hoặc Lớp học ở đây) */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default StudentLayout;