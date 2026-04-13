import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const StudentClasses = () => {
  const [classes, setClasses] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('token');

  // [SCRUM-97] Lấy danh sách lớp đã tham gia
  const fetchJoinedClasses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/classes/joined-classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setClasses(data.data || []);
    } catch (error) {
      toast.error('Không thể tải danh sách lớp!');
    }
  };

  useEffect(() => {
    fetchJoinedClasses();
  }, []);

  // [SCRUM-94, 95, 96] Xử lý tham gia lớp bằng mã
  const handleJoinClass = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.warning('Vui lòng nhập mã lớp!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/classes/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ invite_code: inviteCode.toUpperCase() })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Tham gia lớp thành công! 🎉');
        setInviteCode(''); // Xóa trắng ô nhập
        fetchJoinedClasses(); // Cập nhật lại danh sách lớp ở dưới
      } else {
        toast.error(result.message || 'Mã lớp không hợp lệ hoặc bạn đã tham gia rồi!');
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Lớp học của tôi</h1>
        <p className="text-gray-500 mt-1">Tham gia lớp mới hoặc xem các lớp đang học</p>
      </div>

      {/* Khu vực Nhập mã lớp */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Tham gia lớp học mới</h2>
        <form onSubmit={handleJoinClass} className="flex gap-3">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Nhập mã lớp (VD: A7X9BQ)"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 uppercase outline-none transition-all"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3 bg-blue-600 text-white font-medium rounded-xl shadow-md transition-all ${
              isLoading ? 'opacity-70' : 'hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {isLoading ? 'Đang xử lý...' : 'Tham gia'}
          </button>
        </form>
      </div>

      {/* Danh sách lớp đã tham gia */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Danh sách lớp hiện tại</h2>
      {classes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
          <p className="text-gray-500">Bạn chưa tham gia lớp học nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-green-500 rounded-l-2xl"></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 truncate" title={cls.class_name}>
                {cls.class_name}
              </h3>
              <div className="text-sm text-gray-600 mb-1">
                Giáo viên: <span className="font-semibold text-gray-800">{cls.teacher_name}</span>
              </div>
              <div className="text-sm text-gray-500 mb-6">
                Ngày tham gia: {new Date(cls.joined_at).toLocaleDateString('vi-VN')}
              </div>
              <Link 
                to={`/student/classes/${cls.id}`} 
                className="block text-center w-full py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors border border-green-200"
              >
                Vào Lớp ➔
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentClasses;