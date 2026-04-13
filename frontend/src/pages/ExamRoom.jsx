import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const ExamRoom = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [examData, setExamData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warningCount, setWarningCount] = useState(0);

  // Dùng useRef để giữ giá trị mới nhất của answers mà không làm hàm submitExam bị re-create
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // ================= 1. GỌI API LẤY DỮ LIỆU ĐỀ THI =================
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/exams/${examId}/take`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (response.ok) {
          setExamData(result.data);
          setTimeLeft(result.data.duration * 60);
        } else {
          toast.error(result.message || 'Lỗi tải đề thi!');
          navigate('/student/dashboard');
        }
      } catch (error) {
        toast.error('Lỗi kết nối máy chủ!');
      }
    };

    fetchExamData();
  }, [examId, navigate]);

  // ================= 2. CẢNH BÁO KHI F5 HOẶC THOÁT TRANG =================
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ================= 3. HÀM NỘP BÀI =================
  // Lược bỏ answers khỏi mảng dependency nhờ dùng answersRef
  const submitExam = useCallback(async (isAutoSubmit = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (isAutoSubmit) {
      toast.warning('⏳ Đã hết thời gian hoặc vi phạm! Hệ thống tự động nộp bài.');
    }

    // Lấy đáp án mới nhất từ ref
    const currentAnswers = answersRef.current;
    const user_answers = Object.keys(currentAnswers).map(qId => ({
      question_id: parseInt(qId),
      answer_id: currentAnswers[qId]
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/exams/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ exam_id: examId, user_answers })
      });
      
      const result = await response.json();

      if (response.ok) {
        toast.success(`🎉 Nộp bài thành công! Điểm của bạn: ${result.score}`);
        setTimeout(() => {
          navigate('/student/dashboard'); 
        }, 2000);
      } else {
        toast.error(result.message);
        setIsSubmitting(false); // Cho phép nộp lại nếu lỗi mạng
      }
    } catch (error) {
      toast.error('Lỗi khi nộp bài! Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  }, [examId, isSubmitting, navigate]);

  // ================= 4. ĐỒNG HỒ ĐẾM NGƯỢC =================
  useEffect(() => {
    if (isSubmitting || timeLeft === null) return;

    // Không đưa timeLeft vào dependency array để tránh clearInterval chạy mỗi giây
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitting, submitExam]); // Bỏ timeLeft ra khỏi mảng này

  // ================= 5. HỆ THỐNG ANTI-CHEAT =================
  useEffect(() => {
    if (!examData || examData.is_proctored !== 1 || isSubmitting) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarningCount((prevCount) => {
          const newCount = prevCount + 1;
          
          if (newCount >= 3) {
            toast.error('🚨 BẠN ĐÃ VI PHẠM QUY CHẾ THI QUÁ 3 LẦN. HỆ THỐNG TỰ ĐỘNG THU BÀI!', { autoClose: 5000 });
            submitExam(true); 
          } else {
            // Dùng toast thay vì alert để không block luồng đếm ngược của đồng hồ
            toast.error(`⚠️ CẢNH BÁO VI PHẠM (${newCount}/3)\nBạn đã rời khỏi màn hình làm bài!`, {
               autoClose: 10000,
               position: "top-center",
               theme: "colored"
            });
          }
          
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [examData, isSubmitting, submitExam]);

  // ================= 6. HÀM XỬ LÝ GIAO DIỆN =================
  const handleSelectAnswer = (questionId, answerId) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const formatTime = (seconds) => {
    if (seconds == null) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!examData) return <div className="flex items-center justify-center min-h-screen text-xl font-bold text-gray-600">Đang tải đề thi...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      {/* HEADER & TIMER STICKY */}
      <div className="sticky top-0 z-50 bg-white shadow-md px-6 py-4 flex justify-between items-center border-b-4 border-blue-500">
        <h1 className="text-2xl font-bold text-gray-800">{examData.title}</h1>
        
        <div className="flex items-center gap-6">
          <div className={`text-2xl font-black px-4 py-2 rounded-xl border-2 
            ${timeLeft <= 60 ? 'text-red-600 border-red-500 animate-pulse bg-red-50' : 'text-blue-700 border-blue-200 bg-blue-50'}
          `}>
            ⏱ {formatTime(timeLeft)}
          </div>
          
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn nộp bài sớm không?')) submitExam(false);
            }}
            disabled={isSubmitting}
            className={`font-bold py-3 px-8 rounded-xl shadow-lg transition-all ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isSubmitting ? 'Đang nộp...' : 'Nộp Bài'}
          </button>
        </div>
      </div>

      {/* DANH SÁCH CÂU HỎI */}
      <div className="max-w-4xl mx-auto mt-8 space-y-8 px-4">
        {examData.questions.map((q, index) => (
          <div key={q.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              <span className="text-blue-600 mr-2">Câu {index + 1}:</span> 
              {q.content}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.answers.map((ans) => {
                const isSelected = answers[q.id] === ans.id;
                return (
                  <label 
                    key={ans.id} 
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question_${q.id}`}
                      checked={isSelected}
                      onChange={() => handleSelectAnswer(q.id, ans.id)}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`ml-3 text-lg ${isSelected ? 'font-semibold text-blue-800' : 'text-gray-700'}`}>
                      {ans.content}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamRoom;