import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';

const AdminUserManagement = () => {
  // ================= STATE QUẢN LÝ DỮ LIỆU & UI =================
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho Tìm kiếm và Lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // ================= FECTH DỮ LIỆU TỪ BACKEND =================
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/admin/users', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (response.ok) {
          setUsers(result.data || []);
        } else {
          setError(result.message);
          toast.error(result.message || 'Lỗi tải danh sách người dùng!');
        }
      } catch (err) {
        setError('Không thể kết nối đến máy chủ.');
        toast.error('Không thể kết nối đến máy chủ.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // ================= XỬ LÝ KHÓA/MỞ KHÓA TÀI KHOẢN =================
  const handleToggleLock = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    const actionName = newStatus === 'locked' ? 'Khóa' : 'Mở khóa';

    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName.toLowerCase()} tài khoản này?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/lock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Đã ${actionName.toLowerCase()} tài khoản thành công!`);
        setUsers(users.map(user => user.id === userId ? { ...user, status: newStatus } : user));
      } else {
        toast.error(result.message || 'Có lỗi xảy ra!');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    }
  };

  // ================= XỬ LÝ ĐỔI VAI TRÒ =================
  const handleChangeRole = async (userId, currentRoleId) => {
    const newRole = window.prompt(
      "Nhập ID vai trò mới (2: Giáo viên, 3: Học sinh):", 
      currentRoleId
    );

    if (!newRole || newRole == currentRoleId) return;
    if (newRole !== '2' && newRole !== '3') {
      return toast.warning('Chỉ chấp nhận ID: 2 (Giáo viên) hoặc 3 (Học sinh)');
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role_id: parseInt(newRole) })
      });

      if (response.ok) {
        toast.success('Cập nhật vai trò thành công!');
        setUsers(users.map(user => user.id === userId ? { ...user, role_id: parseInt(newRole) } : user));
      } else {
        toast.error('Lỗi khi cập nhật!');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    }
  };

  // ================= LOGIC TÌM KIẾM & LỌC =================
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchRole = roleFilter === 'all' || user.role_id.toString() === roleFilter;
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = 
        (user.full_name && user.full_name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower));

      return matchRole && matchSearch;
    });
  }, [users, searchTerm, roleFilter]);

  // ================= RENDER GIAO DIỆN =================
  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Tiêu đề trang */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quản lý Người dùng</h1>
          <p className="mt-2 text-sm text-gray-500">Xem, chỉnh sửa quyền và quản lý trạng thái tài khoản trong hệ thống.</p>
        </div>

        {/* Khối Bảng điều khiển (Card) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Bộ lọc & Tìm kiếm */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm outline-none"
              />
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-48 px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm outline-none font-medium text-gray-700"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="2">Giáo viên (Teacher)</option>
                <option value="3">Học sinh (Student)</option>
              </select>
            </div>
          </div>

          {/* Xử lý trạng thái Loading & Error */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <span className="text-base font-medium text-indigo-600 animate-pulse tracking-wide">Đang tải dữ liệu hệ thống...</span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <span className="text-base font-medium text-rose-500 bg-rose-50 px-4 py-2 rounded-lg">{error}</span>
            </div>
          ) : (
            
            /* Bảng dữ liệu */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-white border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Người dùng</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vai trò</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">#{user.id}</td>
                        
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{user.full_name || 'Chưa cập nhật'}</span>
                            <span className="text-sm text-gray-500 mt-0.5">{user.email}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${
                            user.role_id === 2 ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-sky-100 text-sky-800 border border-sky-200'
                          }`}>
                            {user.role_id === 2 ? 'Giáo viên' : 'Học sinh'}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${
                            user.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 text-right space-x-3">
                          <button 
                            onClick={() => handleChangeRole(user.id, user.role_id)}
                            className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-sm"
                          >
                            Đổi Role
                          </button>
                          
                          <button 
                            onClick={() => handleToggleLock(user.id, user.status)}
                            className={`inline-flex items-center px-3 py-1.5 border rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-sm ${
                              user.status === 'active' 
                                ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50 focus:ring-rose-500' 
                                : 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500'
                            }`}
                          >
                            {user.status === 'active' ? 'Khóa TK' : 'Mở Khóa'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <span className="text-sm font-medium text-gray-500">Không tìm thấy người dùng nào phù hợp với bộ lọc.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;