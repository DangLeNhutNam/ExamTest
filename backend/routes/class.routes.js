const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');

const { verifyToken } = require('../middlewares/auth.middleware');
const { isTeacher, isStudent } = require('../middlewares/role.middleware');

// ================= CÁC ROUTE CỐ ĐỊNH (BỎ LÊN TRÊN CÙNG) =================

// 1. Giáo viên tạo lớp mới
router.post('/', verifyToken, isTeacher, classController.createClass);

// 2. Lấy danh sách lớp (Của Giáo viên)
router.get('/my-classes', verifyToken, isTeacher, classController.getMyClasses);

// 3. Lấy danh sách lớp đã tham gia (Của Học sinh)
router.get('/joined-classes', verifyToken, isStudent, classController.getJoinedClasses);

// 4. Học sinh nhập mã tham gia lớp
router.post('/join', verifyToken, isStudent, classController.joinClass);


// ================= CÁC ROUTE CÓ BIẾN (/:id) BỎ XUỐNG DƯỚI =================

// 5. Hiển thị danh sách học sinh (Trang chi tiết lớp - NAY NẰM Ở ĐÂY LÀ CHUẨN)
router.get('/:classId', verifyToken, isTeacher, classController.getClassDetails);

// 6. Giáo viên xem danh sách học sinh của 1 lớp (Route cũ của Tài)
router.get('/:id/students', verifyToken, isTeacher, classController.getStudentsInClass);

// 7. Giáo viên đuổi học sinh khỏi lớp
router.delete('/:id/students/:userId', verifyToken, isTeacher, classController.removeStudent);

// 8. Giáo viên xem thống kê điểm số của lớp
router.get('/:classId/scores', verifyToken, isTeacher, classController.getClassScores);

module.exports = router;