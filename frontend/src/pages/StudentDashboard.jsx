import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');

  // Lấy tên học sinh từ LocalStorage để lời chào thêm thân thiện
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setStudentName(parsedUser.full_name || 'Học sinh');
      } catch (error) {
        setStudentName('Học sinh');
      }
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      
      {/* KHU VỰC HERO (BANNER CHÀO MỪNG) */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-10 md:p-14 text-white shadow-xl mb-12 relative overflow-hidden">
        {/* Các vòng tròn trang trí background (Không dùng icon) */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-20 -mb-10 w-40 h-40 bg-white opacity-10 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Chào mừng trở lại, {studentName}!
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl leading-relaxed mb-8">
            Đây là không gian học tập trực tuyến của bạn. Tại đây, bạn có thể dễ dàng tham gia các lớp học, nhận đề thi từ giáo viên và theo dõi tiến trình học tập của bản thân một cách trực quan nhất.
          </p>
          <button 
            onClick={() => navigate('/student/classes')}
            className="bg-white text-blue-700 hover:bg-blue-50 font-bold text-lg py-4 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            Đến trang Lớp học của tôi
          </button>
        </div>
      </div>

      {/* KHU VỰC GIỚI THIỆU TÍNH NĂNG (3 CỘT) */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Hướng dẫn sử dụng hệ thống</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-xl mb-6">
              1
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Tham gia lớp học</h3>
            <p className="text-gray-600 leading-relaxed">
              Nhận mã mời gồm 6 ký tự từ giáo viên của bạn. Truy cập vào mục "Lớp học của tôi" và nhập mã để chính thức ghi danh vào lớp.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center font-black text-xl mb-6">
              2
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Làm bài kiểm tra</h3>
            <p className="text-gray-600 leading-relaxed">
              Sau khi vào lớp, bạn sẽ thấy danh sách các đề thi được giao. Chú ý thời gian mở và đóng đề để sắp xếp làm bài đúng hạn.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-black text-xl mb-6">
              3
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Môi trường nghiêm túc</h3>
            <p className="text-gray-600 leading-relaxed">
              Hệ thống được trang bị công nghệ chống gian lận. Việc chuyển đổi tab hoặc rời khỏi trình duyệt trong lúc thi sẽ bị hệ thống ghi nhận.
            </p>
          </div>

        </div>
      </div>

      {/* KHU VỰC NÚT CALL TO ACTION CUỐI TRANG */}
      <div className="bg-gray-50 rounded-3xl p-10 text-center border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Bạn đã sẵn sàng chưa?</h3>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto">
          Hãy bắt đầu bằng việc kiểm tra xem bạn đã có danh sách lớp học nào chưa, hoặc nhập mã để tham gia một lớp học mới ngay bây giờ.
        </p>
        <button 
          onClick={() => navigate('/student/classes')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-3 px-8 rounded-xl shadow-md transition-colors"
        >
          Tham gia Lớp học mới
        </button>
      </div>

    </div>
  );
};

export default StudentDashboard;