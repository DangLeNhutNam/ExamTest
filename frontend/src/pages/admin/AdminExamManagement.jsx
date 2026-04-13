import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'; // Dùng để chuyển hướng sang trang sửa chi tiết

const AdminExamManagement = () => {
  const navigate = useNavigate();

  // ================= STATE =================
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, exam, assignment

  // ================= FETCH DỮ LIỆU (SCRUM-36) =================
  useEffect(() => {
    const fetchExams = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/admin/all-exams', {
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

    fetchExams();
  }, []);

  // ================= XỬ LÝ XÓA (SCRUM-157) =================
  const handleDelete = async (examId, examTitle) => {
    if (!window.confirm(`⚠️ NGUY HIỂM: Bạn có chắc chắn muốn xóa vĩnh viễn đề thi: "${examTitle}"?\nMọi kết quả thi liên quan của học sinh có thể bị ảnh hưởng.`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/manage-exams/${examId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Đã xóa dữ liệu thành công!');
        setExams(exams.filter(exam => exam.id !== examId));
      } else {
        toast.error(result.message || 'Có lỗi xảy ra khi xóa!');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ!');
    }
  };

  // ================= XỬ LÝ SỬA =================
  const handleEdit = (examId) => {
    // Thông thường, nút này sẽ dẫn sang trang ExamCreator kèm theo ID để load dữ liệu cũ lên
    // Ví dụ: navigate(`/admin/manage-exams/${examId}/edit`);
    toast.info(`Chuyển hướng sang giao diện Sửa Đề Thi #${examId} (Tính năng đang phát triển)`);
  };

  // ================= LỌC & TÌM KIẾM =================
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchType = typeFilter === 'all' || exam.type === typeFilter;
      const searchLower = searchTerm.toLowerCase();
      
      const matchSearch = 
        (exam.title && exam.title.toLowerCase().includes(searchLower)) ||
        (exam.creator_name && exam.creator_name.toLowerCase().includes(searchLower));

      return matchType && matchSearch;
    });
  }, [exams, searchTerm, typeFilter]);

  // ================= RENDER GIAO DIỆN =================
  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quản lý Đề Thi & Bài Tập</h1>
          <p className="mt-2 text-sm text-gray-500">Kiểm soát, rà soát nội dung và quản lý tất cả bài kiểm tra trên toàn hệ thống.</p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Controls: Search & Filter */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm theo tên đề hoặc người tạo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm outline-none"
              />
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-48 px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm outline-none font-medium text-gray-700"
              >
                <option value="all">Tất cả nội dung</option>
                <option value="exam">Đề thi (Exam)</option>
                <option value="assignment">Bài tập (Assignment)</option>
              </select>
            </div>
          </div>

          {/* Table Area */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <span className="text-base font-medium text-blue-600 animate-pulse tracking-wide">Đang tải dữ liệu hệ thống...</span>
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
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mã</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin đề thi</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thể loại</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thiết lập</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExams.length > 0 ? (
                    filteredExams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-blue-50/30 transition-colors duration-200">
                        
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">#{exam.id}</td>
                        
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 truncate max-w-[250px]">{exam.title}</span>
                            <span className="text-xs text-gray-500 mt-0.5">Tạo bởi: <span className="font-medium text-gray-700">{exam.creator_name || 'Admin'}</span></span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${
                            exam.type === 'exam' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-teal-100 text-teal-800 border border-teal-200'
                          }`}>
                            {exam.type === 'exam' ? 'Đề Thi' : 'Bài Tập'}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-medium text-gray-600">
                              ⏳ Thời gian: <span className="font-bold text-gray-900">{exam.duration} phút</span>
                            </span>
                            <span className={`text-xs font-bold ${exam.is_proctored ? 'text-purple-600' : 'text-gray-400'}`}>
                              {exam.is_proctored ? '🛡️ Có giám sát' : 'Mở tự do'}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-right space-x-3">
                          <button 
                            onClick={() => handleEdit(exam.id)}
                            className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm"
                          >
                            Sửa Đề
                          </button>
                          
                          <button 
                            onClick={() => handleDelete(exam.id, exam.title)}
                            className="inline-flex items-center px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-all shadow-sm"
                          >
                            Xóa Bỏ
                          </button>
                        </td>
                        
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <span className="text-sm font-medium text-gray-500">Chưa có dữ liệu hoặc không tìm thấy đề thi phù hợp.</span>
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

export default AdminExamManagement;