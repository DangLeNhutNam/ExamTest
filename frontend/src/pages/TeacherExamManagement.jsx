import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const TeacherExamManagement = () => {
  const navigate = useNavigate();

  // ================= STATE =================
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const classId = 1;

  // ================= FETCH DỮ LIỆU ĐỀ THI CỦA RIÊNG GIÁO VIÊN NÀY =================
  useEffect(() => {
    const fetchMyExams = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        // ⚠️ THAY ĐỔI ĐƯỜNG DẪN NÀY THÀNH API BẠN ĐÃ LÀM TỪ TRƯỚC
        const response = await fetch('http://localhost:5000/api/exams/teacher', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (response.ok) {
          setExams(result.data || []);
        } else {
          setError(result.message);
          toast.error(result.message || 'Lỗi tải danh sách đề thi!');
        }
      } catch (err) {
        setError('Không thể kết nối đến máy chủ.');
        toast.error('Không thể kết nối đến máy chủ.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyExams();
  }, []);

  // ================= XỬ LÝ XÓA =================
  const handleDelete = async (examId, examTitle) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đề thi: "${examTitle}" không?\nHành động này không thể hoàn tác.`)) return;

    try {
      const token = localStorage.getItem('token');
      // ⚠️ Đổi endpoint xóa cho đúng API của bạn
      const response = await fetch(`http://localhost:5000/api/exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Đã xóa đề thi thành công!');
        setExams(exams.filter(exam => exam.id !== examId));
      } else {
        toast.error(result.message || 'Có lỗi xảy ra khi xóa!');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    }
  };

  // ================= XỬ LÝ SỬA =================
  const handleEdit = (examId, classId) => {
    // Nếu bạn muốn dẫn sang màn hình ExamCreator cũ
    // Bạn cần sửa lại Route ở App.js hoặc truyền logic phù hợp
    toast.info(`Tính năng sửa đề #${examId} đang được cập nhật!`);
    // navigate(`/teacher/classes/${classId}/edit-exam/${examId}`); 
  };

  // ================= LỌC & TÌM KIẾM =================
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const searchLower = searchTerm.toLowerCase();
      return exam.title && exam.title.toLowerCase().includes(searchLower);
    });
  }, [exams, searchTerm]);

  // ================= RENDER GIAO DIỆN =================
  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quản lý Đề Thi Của Tôi</h1>
            <p className="mt-2 text-sm text-gray-500">Xem, chỉnh sửa và quản lý các bài kiểm tra do chính bạn tạo ra.</p>
          </div>
          <button 
            onClick={() => navigate(`/teacher/classes/${classId}/create-exam`)}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-sm transition-colors"
            >
            + Tạo Đề Mới
            </button>
            </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên đề thi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md pl-4 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm outline-none"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <span className="text-base font-medium text-blue-600 animate-pulse tracking-wide">Đang tải danh sách đề thi...</span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64">
              <span className="text-base font-medium text-rose-500 bg-rose-50 px-4 py-2 rounded-lg">{error}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-white border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mã Đề</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Tên Đề Thi</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thiết lập</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian tạo</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExams.length > 0 ? (
                    filteredExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-blue-50/30 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">#{exam.id}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900 truncate max-w-[250px] block">{exam.title}</span>
                          {/* Nếu có class_id thì hiển thị thêm để GV dễ phân biệt */}
                          {exam.class_id && <span className="text-xs text-gray-500">Lớp ID: {exam.class_id}</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-gray-800">{exam.duration} phút</span>
                            <span className={`text-xs font-bold ${exam.is_proctored ? 'text-purple-600' : 'text-gray-400'}`}>
                              {exam.is_proctored ? 'Có giám sát' : 'Mở tự do'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(exam.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-4 text-right space-x-4">
                          {/* Nút Sửa */}
                          <button 
                            onClick={() => navigate(`/teacher/classes/${classId}/edit-exam/${exam.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-sm transition-colors"
                          >
                            Sửa
                          </button>
                          
                          {/* Nút Xóa */}
                          <button 
                            onClick={() => handleDeleteExam(exam.id, exam.title)}
                            className="text-red-500 hover:text-red-700 font-bold text-sm transition-colors"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <span className="text-sm font-medium text-gray-500">Bạn chưa tạo đề thi nào.</span>
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

export default TeacherExamManagement;