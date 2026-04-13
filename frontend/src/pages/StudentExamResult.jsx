import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const StudentExamResult = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/exams/${examId}/result`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (response.ok) {
          setResultData({ ...result.data, message: result.message });
        } else {
          toast.error(result.message || 'Không thể tải kết quả!');
          navigate('/student/classes');
        }
      } catch (error) {
        toast.error('Lỗi kết nối máy chủ!');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [examId, navigate]);

  if (loading) return <div className="text-center mt-20 text-xl font-bold">Đang tải kết quả...</div>;
  if (!resultData) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      {/* Thẻ Điểm Tổng Quan */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl mb-8 text-center relative overflow-hidden">
        <h1 className="text-2xl font-bold mb-2 opacity-90">{resultData.exam_title}</h1>
        <p className="mb-6 opacity-80">Nộp bài lúc: {new Date(resultData.submitted_at).toLocaleString('vi-VN')}</p>
        
        <div className="inline-block bg-white text-blue-800 rounded-full w-40 h-40 flex flex-col items-center justify-center shadow-inner mx-auto border-8 border-blue-400/30">
          <span className="text-5xl font-black">{resultData.score}</span>
          <span className="text-sm font-bold opacity-60 uppercase tracking-widest mt-1">Điểm</span>
        </div>
      </div>

      {/* Khu vực thông báo & Chi tiết bài làm */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">Chi tiết bài làm</h2>
        
        {/* Logic SCRUM-126: Kiểm tra cờ details_locked từ Backend */}
        {resultData.details_locked ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <span className="text-4xl block mb-3">🔒</span>
            <h3 className="text-lg font-bold text-yellow-800 mb-2">Chưa thể xem chi tiết</h3>
            <p className="text-yellow-700">{resultData.message}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-50 text-green-700 p-4 rounded-xl font-bold text-sm mb-6 text-center border border-green-200">
              {resultData.message}
            </div>
            
            {/* Render danh sách câu hỏi */}
            {resultData.details?.map((item, index) => (
              <div key={index} className={`p-6 rounded-xl border-2 transition-all ${item.is_correct === 1 ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
                <div className="flex gap-4 items-start mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 text-white ${item.is_correct === 1 ? 'bg-green-500' : 'bg-red-500'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{item.question_content}</p>
                    <p className="text-sm text-gray-500 mt-1">Điểm câu này: {item.point}</p>
                  </div>
                </div>
                
                <div className="ml-14 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                  <p className="text-sm font-bold text-gray-500 mb-1">Đáp án bạn chọn:</p>
                  <p className={`font-medium ${item.is_correct === 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.is_correct === 1 ? '✅' : '❌'} {item.student_choice}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <button onClick={() => navigate(-1)} className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
          Quay lại danh sách
        </button>
      </div>
    </div>
  );
};

export default StudentExamResult;