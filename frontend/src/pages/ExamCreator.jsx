import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';

const ExamCreator = () => {
  const navigate = useNavigate();
  // 1. LẤY THÊM examId TỪ URL
  const { classId, examId } = useParams(); 
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false); // State báo đang tải dữ liệu cũ

  // Biến xác định xem đây là trang TẠO MỚI hay SỬA ĐỀ
  const isEditMode = Boolean(examId);

  const [exam, setExam] = useState({
    title: '',
    duration: 15,
    description: '',
    is_proctored: 0,
    start_time: '',
    end_time: '',
    questions: [
      {
        content: '',
        point: 1,
        answers: [
          { content: '', is_correct: 1 },
          { content: '', is_correct: 0 },
          { content: '', is_correct: 0 },
          { content: '', is_correct: 0 },
        ],
      },
    ],
  });

  // 2. [THÊM MỚI] LẤY DỮ LIỆU ĐỀ THI CŨ KHI Ở CHẾ ĐỘ SỬA
  useEffect(() => {
    if (isEditMode) {
      const fetchExamDetails = async () => {
        setIsFetching(true);
        try {
          const token = localStorage.getItem('token');
          // Gọi API lấy chi tiết đề dành riêng cho giáo viên (có is_correct)
          const response = await fetch(`http://localhost:5000/api/exams/${examId}/teacher-detail`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const result = await response.json();

          if (response.ok) {
            const fetchedExam = result.data;
            
            // Format lại ngày giờ để hiển thị đúng trên input type="datetime-local"
            const formatDateTime = (dateString) => {
              if (!dateString) return '';
              const date = new Date(dateString);
              // Đưa về múi giờ local (YYYY-MM-DDThh:mm)
              date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
              return date.toISOString().slice(0, 16);
            };

            setExam({
              title: fetchedExam.title || '',
              duration: fetchedExam.duration || 15,
              description: fetchedExam.description || '',
              is_proctored: fetchedExam.is_proctored || 0,
              start_time: formatDateTime(fetchedExam.start_time),
              end_time: formatDateTime(fetchedExam.end_time),
              questions: fetchedExam.questions || [],
            });
          } else {
            toast.error(result.message || 'Lỗi tải chi tiết đề thi!');
          }
        } catch (error) {
          toast.error('Lỗi kết nối máy chủ!');
        } finally {
          setIsFetching(false);
        }
      };

      fetchExamDetails();
    }
  }, [examId, isEditMode]);

  // ================= CÁC HÀM XỬ LÝ ĐỘNG (GIỮ NGUYÊN) =================
  const handleExamChange = (e) => setExam({ ...exam, [e.target.name]: e.target.value });
  
  const addQuestion = () => {
    setExam({
      ...exam,
      questions: [...exam.questions, {
        content: '', point: 1,
        answers: [
          { content: '', is_correct: 1 }, { content: '', is_correct: 0 },
          { content: '', is_correct: 0 }, { content: '', is_correct: 0 },
        ],
      }],
    });
  };

  const removeQuestion = (index) => {
    if (exam.questions.length === 1) return toast.warning('Đề thi phải có ít nhất 1 câu hỏi!');
    setExam({ ...exam, questions: exam.questions.filter((_, qIndex) => qIndex !== index) });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...exam.questions];
    newQuestions[index][field] = value;
    setExam({ ...exam, questions: newQuestions });
  };

  const handleAnswerChange = (qIndex, aIndex, value) => {
    const newQuestions = [...exam.questions];
    newQuestions[qIndex].answers[aIndex].content = value;
    setExam({ ...exam, questions: newQuestions });
  };

  const handleCorrectAnswer = (qIndex, aIndex) => {
    const newQuestions = [...exam.questions];
    newQuestions[qIndex].answers.forEach((ans, idx) => {
      ans.is_correct = idx === aIndex ? 1 : 0;
    });
    setExam({ ...exam, questions: newQuestions });
  };

  // ================= 3. SỬA LẠI HÀM LƯU ĐỂ HỖ TRỢ CẢ POST VÀ PUT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!exam.title.trim()) return toast.error('Vui lòng nhập tên đề thi!');

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Nếu có examId -> Gọi PUT (Sửa). Nếu không -> Gọi POST (Tạo mới)
      const url = isEditMode 
        ? `http://localhost:5000/api/exams/${examId}` 
        : `http://localhost:5000/api/exams`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...exam, class_id: classId || 1 }),
      });

      if (response.ok) {
        toast.success(isEditMode ? '🎉 Cập nhật đề thi thành công!' : '🎉 Tạo đề thi thành công!');
        navigate(-1); 
      } else {
        const result = await response.json();
        toast.error(result.message || 'Có lỗi xảy ra!');
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ!');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="text-center mt-20 text-xl font-bold">Đang tải dữ liệu đề thi...</div>;
  }

  // GIAO DIỆN (GIỮ NGUYÊN)
  return (
    <div className="max-w-5xl mx-auto p-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {isEditMode ? 'Chỉnh Sửa Đề Thi' : 'Tạo Đề Thi Mới'}
        </h1>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all"
        >
          {isLoading ? 'Đang lưu...' : '💾 Lưu Đề Thi'}
        </button>
      </div>

      <form className="space-y-6">
        {/* THÔNG TIN CHUNG */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Thông tin chung</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tên đề thi *</label>
              <input
                type="text"
                name="title"
                value={exam.title}
                onChange={handleExamChange}
                placeholder="VD: Kiểm tra 15 phút Toán Hình"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Thời gian (phút)</label>
              <select
                name="duration"
                value={exam.duration}
                onChange={handleExamChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 outline-none cursor-pointer"
              >
                <option value={15}>15 phút</option>
                <option value={45}>45 phút</option>
                <option value={90}>90 phút</option>
                <option value={120}>120 phút</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Mở đề thi lúc</label>
              <input
                type="datetime-local"
                name="start_time"
                value={exam.start_time}
                onChange={handleExamChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>
            
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">🏁 Đóng đề thi lúc</label>
              <input
                type="datetime-local"
                name="end_time"
                value={exam.end_time}
                onChange={handleExamChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả thêm</label>
              <textarea
                name="description"
                value={exam.description}
                onChange={handleExamChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 outline-none h-24"
              />
              <div className="md:col-span-3 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mt-4">
                  <input
                      type="checkbox"
                      id="antiCheat"
                      checked={exam.is_proctored === 1}
                      onChange={(e) => setExam({ ...exam, is_proctored: e.target.checked ? 1 : 0 })}
                      className="w-6 h-6 text-red-600 rounded cursor-pointer"
                  />
                  <label htmlFor="antiCheat" className="font-bold text-red-700 cursor-pointer">
                      Bật chế độ giám sát (Chống chuyển Tab)
                  </label>
              </div>
            </div>
          </div>
        </div>

        {/* DANH SÁCH CÂU HỎI */}
        <div className="space-y-6">
          {exam.questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative group">
              <button
                type="button"
                onClick={() => removeQuestion(qIndex)}
                className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors opacity-50 group-hover:opacity-100"
              >
                🗑️ Xóa
              </button>

              <div className="flex gap-4 items-start mb-6">
                <div className="bg-blue-100 text-blue-700 font-bold w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  {qIndex + 1}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={q.content}
                    onChange={(e) => handleQuestionChange(qIndex, 'content', e.target.value)}
                    placeholder="Nhập nội dung câu hỏi..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 outline-none text-lg font-medium"
                  />
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    value={q.point}
                    onChange={(e) => handleQuestionChange(qIndex, 'point', parseFloat(e.target.value))}
                    step="0.5" min="0" placeholder="Điểm"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 outline-none text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-14">
                {q.answers.map((ans, aIndex) => (
                  <div
                    key={aIndex}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      ans.is_correct === 1 ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct_answer_${qIndex}`}
                      checked={ans.is_correct === 1}
                      onChange={() => handleCorrectAnswer(qIndex, aIndex)}
                      className="w-5 h-5 text-green-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={ans.content}
                      onChange={(e) => handleAnswerChange(qIndex, aIndex, e.target.value)}
                      placeholder={`Đáp án ${String.fromCharCode(65 + aIndex)}`}
                      className="flex-1 bg-transparent outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="w-full py-4 border-2 border-dashed border-blue-400 text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-lg"
        >
          <span>+</span> Thêm câu hỏi
        </button>
      </form>
    </div>
  );
};

export default ExamCreator;