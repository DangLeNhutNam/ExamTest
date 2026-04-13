import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const StudentClassDetails = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/exams/student/class/${classId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        if (response.ok) {
          setExams(result.data);
        } else {
          toast.error(result.message);
          navigate('/student/classes');
        }
      } catch (error) {
        toast.error('Lỗi tải danh sách bài thi!');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, [classId, navigate]);

  // HÀM KIỂM TRA TRẠNG THÁI BÀI THI DỰA VÀO GIỜ GIẤC
  const getExamStatus = (exam) => {
    const now = new Date();
    const startTime = exam.start_time ? new Date(exam.start_time) : null;
    const endTime = exam.end_time ? new Date(exam.end_time) : null;

    if (startTime && now < startTime) {
      return { 
        canTake: false, 
        text: `Sắp mở lúc: ${startTime.toLocaleString('vi-VN')}`, 
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200' 
      };
    }
    
    if (endTime && now > endTime) {
      return { 
        canTake: false, 
        text: 'Đã đóng (Hết hạn)', 
        color: 'text-red-600 bg-red-50 border-red-200' 
      };
    }

    return { 
      canTake: true, 
      text: 'Đang mở (Có thể làm bài)', 
      color: 'text-green-700 bg-green-50 border-green-200' 
    };
  };

  const handleTakeExam = (examId, title, canTake) => {
    if (!canTake) return;
    const confirm = window.confirm(`Bạn đã sẵn sàng vào thi môn: ${title} chưa? Thời gian sẽ bắt đầu đếm ngược!`);
    if (confirm) navigate(`/student/exam/${examId}`);
  };

  if (isLoading) return <div className="text-center mt-20 text-xl font-bold">Đang tải dữ liệu lớp học...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📚 Đề thi của lớp</h1>
        <button onClick={() => navigate('/student/classes')} className="px-4 py-2 border rounded-lg hover:bg-gray-100 font-bold">
          Quay lại
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl shadow text-center border">
          <p className="text-gray-500 text-lg">Giáo viên chưa giao bài tập/đề thi nào cho lớp này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exams.map((exam) => {
            const status = getExamStatus(exam);
            
            return (
              <div key={exam.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{exam.title}</h3>
                  {exam.is_proctored === 1 && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold">🛡️ Giám sát</span>}
                </div>
                
                <div className="space-y-2 mb-6 flex-1">
                  <p className="text-gray-600">⏱ Thời gian: <strong>{exam.duration} phút</strong></p>
                  
                  {/* THANH TRẠNG THÁI */}
                  <div className={`px-3 py-2 rounded-lg border text-sm font-bold mt-2 ${
                    exam.is_submitted === 1 
                      ? 'text-purple-700 bg-purple-50 border-purple-200' // Màu tím cho trạng thái Đã nộp
                      : status.color 
                  }`}>
                    {exam.is_submitted === 1 ? 'Đã hoàn thành' : status.text}
                  </div>
                </div>

                {exam.is_submitted === 1 ? (
                  // NẾU ĐÃ THI -> HIỆN NÚT XEM KẾT QUẢ
                  <button
                    onClick={() => navigate(`/student/exam/${exam.id}/result`)}
                    className="w-full py-3 rounded-xl font-bold transition-all bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300 shadow-sm cursor-pointer"
                  >
                    Xem kết quả
                  </button>
                ) : (
                  // NẾU CHƯA THI -> HIỆN NÚT VÀO THI (Giữ nguyên logic cũ)
                  <button
                    onClick={() => handleTakeExam(exam.id, exam.title, status.canTake)}
                    disabled={!status.canTake}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      status.canTake 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {status.canTake ? 'Vào thi ngay' : 'Đã khóa'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentClassDetails;