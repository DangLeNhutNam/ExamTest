const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { isTeacher, isExamOwner, isStudent } = require('../middlewares/role.middleware');

// Route lấy danh sách đề (không cần check owner vì class_id đã lọc theo giáo viên ở FE)
router.get('/', verifyToken, isTeacher, examController.getExamsByClass);

// Cho phép Frontend tạo nguyên 1 đề thi mới
router.post('/', verifyToken, isTeacher, examController.createFullExam);

// Các thao tác can thiệp sâu vào đề thi (Phải qua isExamOwner)
router.post('/:examId/questions', verifyToken, isTeacher, isExamOwner, examController.addQuestion);
router.put('/:examId/questions/:questionId', verifyToken, isTeacher, isExamOwner, examController.updateQuestion);
router.delete('/:examId/questions/:questionId', verifyToken, isTeacher, isExamOwner, examController.deleteQuestion);

// Nộp bài thi
router.post('/submit', verifyToken, isStudent, examController.submitExam);
// Xem điểm (kèm logic chặn thời gian trong controller)
router.get('/results/:examId', verifyToken, examController.getExamResult);
// Route cho học sinh xem danh sách đề thi
router.get('/student/available', verifyToken, isStudent, examController.getAvailableExams);

// Lấy danh sách đề thi trong 1 lớp cụ thể (Dành cho Học sinh)
router.get('/student/class/:classId', verifyToken, isStudent, examController.getExamsForStudentByClass);
// Lấy đề thi 
router.get('/:examId/take', verifyToken, isStudent, examController.getExamForStudent);
// Lấy kết quả thi (điểm số và chi tiết đáp án) sau khi đã nộp bài
router.get('/:examId/result', verifyToken, isStudent, examController.getExamResult);
// Lấy danh sách đề thi của giáo viên (Dành cho Giáo viên)
router.get('/teacher', verifyToken, examController.getTeacherExams);
// Xóa đề thi (Dành cho Giáo viên)
router.delete('/:examId', verifyToken, isTeacher, isExamOwner, examController.deleteExam);

// Cập nhật toàn bộ đề thi (Dành cho Giáo viên) - ĐÃ SỬA THÀNH updateFullExam
router.put('/:examId', verifyToken, isTeacher, isExamOwner, examController.updateFullExam);

// Lấy chi tiết đề thi cho Giáo viên SỬA (hiện tất cả đáp án đúng)
router.get('/:examId/teacher-detail', verifyToken, isTeacher, isExamOwner, examController.getExamDetailForTeacher);

module.exports = router;