import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ allowedRoles }) => {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  // 1. Nếu chưa có token -> Đuổi về trang Đăng nhập
  if (!token || !userStr) {
    toast.error('Vui lòng đăng nhập để tiếp tục!');
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);

  // 2. Nếu có token nhưng sai Quyền (Role) -> Đuổi về trang Đăng nhập
  if (!allowedRoles.includes(user.role_id)) {
    toast.warning('Bạn không có quyền truy cập khu vực này!');
    return <Navigate to="/login" replace />;
  }

  // 3. Hợp lệ -> Cho phép đi tiếp vào giao diện bên trong
  return <Outlet />; 
};

export default ProtectedRoute;