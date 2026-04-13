
const express = require('express');
const router = express.Router();

// 1. Import các Controllers
const adminController = require('../controllers/adminController');
const adminExamController = require('../controllers/adminExamController');

// 2. Import Middleware
const { verifyToken, adminOnly } = require('../middlewares/auth.middleware');

// 3. Khóa bảo vệ: Tất cả các route dưới đây đều cần đăng nhập VÀ là Admin
router.use(verifyToken, adminOnly);

// =================== QUẢN LÝ NGƯỜI DÙNG (SCRUM-35) ===================
router.get('/users', adminController.getAllUsers); // [SCRUM-146]
router.post('/users', adminController.createUser); // [SCRUM-147]
router.put('/users/:id/lock', adminController.toggleLockUser); // [SCRUM-144]
router.put('/users/:id/reset-password', adminController.resetPassword); // [SCRUM-143]
router.delete('/users/:id', adminController.deleteUser); // [SCRUM-149]
router.put('/users/:id/role', adminController.updateUserRole); // [SCRUM-148]

// =================== QUẢN LÝ NỘI DUNG (SCRUM-36) ===================
router.get('/all-exams', adminExamController.getAllContent);
router.post('/manage-exams', adminExamController.createSystemExam);
router.delete('/manage-exams/:id', adminExamController.deleteAnyContent);

module.exports = router;