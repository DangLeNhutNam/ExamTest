import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const TeacherClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Lấy Token từ LocalStorage để gửi kèm API
  const token = localStorage.getItem('token');

  // 1. [SCRUM-88] Hàm lấy danh sách lớp học
  const fetchClasses = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/classes/my-classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setClasses(data.data || []);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách lớp!');
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // 2. [SCRUM-87 & 89] Hàm xử lý Tạo Lớp Mới
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      toast.warning('Tên lớp không được để trống!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ class_name: newClassName })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Tạo lớp thành công! Mã mời: ' + result.data.invite_code);
        setIsModalOpen(false);
        setNewClassName('');
        fetchClasses(); // Load lại danh sách lớp mới nhất
      } else {
        toast.error(result.message || 'Có lỗi xảy ra!');
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Lớp học</h1>
          <p className="text-gray-500 mt-1">Tạo và quản lý danh sách học sinh của bạn</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <span className="text-xl">+</span> Tạo Lớp Mới
        </button>
      </div>

      {/* Grid Danh sách lớp */}
      {classes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">Bạn chưa tạo lớp học nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 rounded-l-2xl"></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2 truncate" title={cls.class_name}>
                {cls.class_name}
              </h3>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-gray-500">Mã mời:</span>
                <span className="bg-blue-50 text-blue-700 font-mono font-bold px-3 py-1 rounded-md tracking-wider">
                  {cls.invite_code}
                </span>
              </div>
              <button
                onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors border border-gray-200"
              >
                Xem chi tiết & Học sinh ➔
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tạo Lớp */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800">Tạo Lớp Học Mới</h2>
            </div>
            
            <form onSubmit={handleCreateClass} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên lớp học
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="VD: Toán Cao Cấp - K65..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl shadow-md transition-all ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 hover:shadow-lg'
                  }`}
                >
                  {isLoading ? 'Đang tạo...' : 'Tạo Lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherClasses;