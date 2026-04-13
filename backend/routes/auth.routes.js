const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Login thường: Phải đi qua trạm kiểm soát reCAPTCHA trước
router.post('/login', authController.verifyRecaptcha, authController.login);
// Đã mở khóa API Đăng ký và gắn khiên reCAPTCHA
router.post('/register', authController.verifyRecaptcha, authController.register);
// Login Google: Không cần reCAPTCHA
router.post('/google-login', authController.googleLogin);

module.exports = router;