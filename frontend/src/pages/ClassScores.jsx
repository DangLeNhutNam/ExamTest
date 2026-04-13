import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const ClassScores = () => {
  const { classId } = useParams();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Lọc và Phân trang
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchScores = async (currentPage = 1, search = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Gọi API thống kê điểm của Tài
      const response = await fetch(`http://localhost:5000/api/classes/${classId}/scores?page=${currentPage}&limit=10&search=${search}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();

      if (response.ok) {
        setScores(result.data);
        setTotalPages(result.pagination.total_pages);
      } else {
        toast.error(result.message || 'Lỗi tải bảng điểm');
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  // Chạy lần đầu và khi đổi trang
  useEffect(() => {
    fetchScores(page, searchTerm);
  }, [classId, page]);

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset về trang 1 khi tìm kiếm mới
    fetchScores(1, searchTerm);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 Bảng Điểm Lớp Học</h1>
        <Link to={`/teacher/classes/${classId}`} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition-all">
          Quay lại Lớp
        </Link>
      </div>

      {/* Thanh Công cụ: Tìm kiếm */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <input 
            type="text" 
            placeholder="Tìm theo tên học sinh..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 outline-none"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all">
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Bảng Dữ Liệu Điểm Số */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
              <th className="p-4 font-semibold">Học sinh</th>
              <th className="p-4 font-semibold">Bài thi</th>
              <th className="p-4 font-semibold text-center">Điểm số</th>
              <th className="p-4 font-semibold">Thời gian nộp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="4" className="text-center p-10 font-bold text-gray-500">Đang tải dữ liệu...</td></tr>
            ) : scores.length === 0 ? (
              <tr><td colSpan="4" className="text-center p-10 font-bold text-gray-500">Chưa có dữ liệu điểm số.</td></tr>
            ) : (
              scores.map((row) => (
                <tr key={row.result_id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{row.student_name}</div>
                    <div className="text-sm text-gray-500">{row.email}</div>
                  </td>
                  <td className="p-4 text-gray-700 font-medium">{row.exam_title}</td>
                  <td className="p-4 text-center">
                    <span className={`px-4 py-1 rounded-full font-bold text-lg ${row.score >= 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {row.score}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    {new Date(row.submitted_at).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Phân Trang (Pagination) */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-center gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 bg-white border rounded disabled:opacity-50 font-bold hover:bg-gray-100"
            >
              Trước
            </button>
            <span className="px-4 py-2 font-bold text-gray-700">Trang {page} / {totalPages}</span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-white border rounded disabled:opacity-50 font-bold hover:bg-gray-100"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassScores;