import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Thêm useLocation để làm hiệu ứng active cho menu
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Hàm phụ trợ để highlight menu đang được chọn
  const getMenuClass = (path) => {
    // Nếu URL hiện tại khớp chính xác với path, đổi màu nền nổi bật hơn
    const isActive = location.pathname === path;
    return `block px-4 py-3 rounded-lg transition-colors ${
      isActive ? 'bg-blue-600 text-white font-semibold shadow-md' : 'hover:bg-slate-700 text-gray-300'
    }`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Thanh Sidebar bên trái */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col shadow-xl">
        <div className="p-5 text-center text-2xl font-black border-b border-slate-700 tracking-wider">
          EXAM<span className="text-blue-500">TEST</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Menu cho Admin (Role 1) */}
          {user.role_id === 1 && (
            <>
              <Link to="/admin" className={getMenuClass('/admin')}>
                Quản lý Người dùng
              </Link>
              <Link to="/admin/exams" className={getMenuClass('/admin/exams')}>
                Quản lý Đề thi
              </Link>
            </>
          )}
          
          {/* Menu cho Teacher (Role 2) */}
          {user.role_id === 2 && (
            <>
              <Link to="/teacher" className={getMenuClass('/teacher')}>🏠 Trang chủ Giáo viên</Link>
              <Link to="/teacher/classes" className={getMenuClass('/teacher/classes')}>👥 Quản lý Lớp học</Link>
              <Link to="/teacher/exams" className={getMenuClass('/teacher/exams')}>📝 Quản lý Đề thi</Link>
            </>
          )}
        </nav>

        {/* Thông tin User và nút Đăng xuất */}
        <div className="p-4 border-t border-slate-700 bg-slate-900">
          <p className="mb-3 truncate text-sm text-gray-300">Chào, <span className="font-bold text-white">{user.full_name}</span></p>
          <button 
            onClick={handleLogout} 
            className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white font-semibold transition-colors shadow-sm"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Khu vực nội dung chính thay đổi theo từng trang */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet /> 
      </main>
    </div>
  );
};

export default AdminLayout;