import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage'; 
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import TeacherClasses from './pages/TeacherClasses';
import StudentClasses from './pages/StudentClasses';
import ExamCreator from './pages/ExamCreator';
import ExamRoom from './pages/ExamRoom';
import StudentDashboard from './pages/StudentDashboard';
import ClassDetails from './pages/ClassDetails';
import StudentLayout from './layouts/StudentLayout';
import StudentClassDetails from './pages/StudentClassDetails';
import ClassScores from './pages/ClassScores';
import StudentExamResult from './pages/StudentExamResult';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminExamManagement from './pages/admin/AdminExamManagement';
import TeacherExamManagement from './pages/TeacherExamManagement';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TeacherDashboard = () => <h1 className="text-3xl font-bold text-gray-800">Khu vực dành cho Giáo viên</h1>;


function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        <Route path="/login" element={<AuthPage />} />

        {/* 🚨 KHU VỰC ĐƯỢC BẢO VỆ: Chỉ Admin (1) và Teacher (2) được vào */}
        <Route element={<ProtectedRoute allowedRoles={[1, 2]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminUserManagement />} />
            <Route path="/admin/exams" element={<AdminExamManagement />} />
            
            
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/classes" element={<TeacherClasses />} />
            <Route path="/teacher/classes/:classId" element={<ClassDetails />} />
            <Route path="/teacher/classes/:classId/scores" element={<ClassScores />} />
            <Route path="/teacher/exams" element={<TeacherExamManagement />} />
            <Route path="/teacher/classes/:classId/edit-exam/:examId" element={<ExamCreator />} />
            
            <Route path="/teacher/classes/:classId/create-exam" element={<ExamCreator/>} />
          </Route>
        </Route>

        {/* KHU VỰC HỌC SINH (Role 3) */}
        <Route element={<ProtectedRoute allowedRoles={[3]} />}>
          
          {/* Những trang CÓ thanh Menu bên trái */}
          <Route element={<StudentLayout />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/classes" element={<StudentClasses />} />
            <Route path="/student/classes/:classId" element={<StudentClassDetails />} />
            <Route path="/student/exam/:examId/result" element={<StudentExamResult />} />
          </Route>

          {/* Riêng trang VÀO THI thì tách ra ngoài để Full Màn Hình */}
          <Route path="/student/exam/:examId" element={<ExamRoom />} />

        </Route>
        
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-screen">
                <h1 className="text-4xl font-bold text-red-500">404 - Lạc đường rồi!</h1>
                <p className="mt-4">Đường dẫn này không tồn tại trong hệ thống.</p>
            </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;