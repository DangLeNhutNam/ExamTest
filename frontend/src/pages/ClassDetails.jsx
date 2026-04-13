import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  
  // State quản lý thông tin lớp & học sinh
  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State quản lý danh sách đề thi của lớp
  const [exams, setExams] = useState([]);
  const [isExamsLoading, setIsExamsLoading] = useState(true);

  // 1. Gọi API lấy dữ liệu lớp và học sinh
  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/classes/${classId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (response.ok) {
          setClassData(result.data);
        } else {
          toast.error(result.message || 'Không thể tải thông tin lớp học!');
          navigate('/teacher/classes');
        }
      } catch (error) {
        toast.error('Lỗi kết nối máy chủ!');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassDetails();
  }, [classId, navigate]);

  // 2. Gọi API lấy danh sách đề thi thuộc về lớp này
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem('token');
        // Gọi API truyền class_id dạng query string (Khớp với backend getExamsByClass của bạn)
        const response = await fetch(`http://localhost:5000/api/exams?class_id=${classId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();
        if (response.ok) {
          setExams(result.data || []);
        }
      } catch (error) {
        toast.error('Không thể tải danh sách đề thi!');
      } finally {
        setIsExamsLoading(false);
      }
    };

    fetchExams();
  }, [classId]);

  // ================= XỬ LÝ XÓA ĐỀ THI =================
  const handleDeleteExam = async (examId, examTitle) => {
    if (!window.confirm(`⚠️ Bạn có chắc chắn muốn xóa đề thi: "${examTitle}"?\nHành động này sẽ xóa toàn bộ câu hỏi và điểm của học sinh (nếu có)!`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/exams/${examId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Đã xóa đề thi thành công!');
        // Cập nhật lại danh sách trên màn hình mà không cần load lại trang
        setExams(exams.filter(exam => exam.id !== examId)); 
      } else {
        toast.error(result.message || 'Có lỗi xảy ra khi xóa!');
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ!');
    }
  };

  if (isLoading) return <div className="text-center mt-20 text-xl font-bold text-gray-600">Đang tải thông tin lớp học...</div>;
  if (!classData) return null;

  const { info, students } = classData;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      
      {/* ================= 1. HEADER LỚP HỌC ================= */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏫 Lớp: {info.name}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-mono font-bold border border-blue-200">
              Mã mời: {info.invite_code}
            </span>
            <span>Tổng số: <strong>{students.length}</strong> học sinh</span>
          </div>
        </div>

        {/* NÚT ACTION */}
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <Link 
            to={`/teacher/classes`}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all flex items-center justify-center"
          >
            Quay lại
          </Link>

          <Link 
            to={`/teacher/classes/${classId}/scores`}
            className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-green-700 font-bold transition-all flex items-center gap-2 justify-center"
          >
            Xem Bảng Điểm
          </Link>

          <Link 
            to={`/teacher/classes/${classId}/create-exam`}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-blue-700 font-bold transition-all flex items-center gap-2 justify-center"
          >
            Tạo Đề Thi Mới
          </Link>
        </div>
      </div>

      {/* ================= 2. DANH SÁCH ĐỀ THI CỦA LỚP ================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">📝 Danh sách Đề thi / Bài tập</h2>
        </div>
        
        {isExamsLoading ? (
          <div className="p-8 text-center text-blue-500 font-semibold animate-pulse">Đang tải đề thi...</div>
        ) : exams.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <p className="text-lg">Lớp này chưa có bài kiểm tra nào.</p>
            <p className="text-sm mt-2">Hãy bấm <strong>"Tạo Đề Thi Mới"</strong> ở phía trên để bắt đầu giao bài nhé!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Tên đề thi</th>
                  <th className="p-4 font-semibold">Thời gian làm</th>
                  <th className="p-4 font-semibold">Trạng thái</th>
                  <th className="p-4 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 font-bold text-gray-800">{exam.title}</td>
                    <td className="p-4 text-gray-600">{exam.duration} phút</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        exam.is_proctored ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {exam.is_proctored ? 'Thi nghiêm ngặt' : 'Mở tự do'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-4">
                        
                        <button 
                            onClick={() => navigate(`/teacher/classes/${classId}/edit-exam/${exam.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-sm transition-colors"
                        >
                            Sửa đề
                        </button>

                        
                        <button 
                            onClick={() => handleDeleteExam(exam.id, exam.title)}
                            className="text-red-500 hover:text-red-700 font-bold text-sm transition-colors"
                        >
                            Xóa
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= 3. DANH SÁCH HỌC SINH ================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">🧑‍🎓 Danh sách Học sinh</h2>
        </div>

        {students.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <p className="text-lg">Chưa có học sinh nào tham gia lớp này.</p>
            <p className="text-sm mt-2">Hãy gửi Mã mời <strong>{info.invite_code}</strong> cho học sinh nhé!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">STT</th>
                  <th className="p-4 font-semibold">Họ và Tên</th>
                  <th className="p-4 font-semibold">Email / Tài khoản</th>
                  <th className="p-4 font-semibold text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student, index) => (
                  <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 text-gray-600 font-medium">{index + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {student.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-800">{student.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{student.email}</td>
                    <td className="p-4 text-center">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        Đang hoạt động
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ClassDetails;