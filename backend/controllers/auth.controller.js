const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// 1. IMPORT THÊM 2 THƯ VIỆN NÀY
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');

// Khởi tạo Client của Google bằng Client ID trong file .env
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


// ==========================================
// [MỚI] MIDDLEWARE: XÁC THỰC RECAPTCHA (Chống Bot)
// ==========================================
exports.verifyRecaptcha = async (req, res, next) => {
    const { captchaToken } = req.body; // Nam 1 sẽ gửi token này cùng với email, password

    if (!captchaToken) {
        return res.status(400).json({ message: 'Thiếu mã xác thực reCAPTCHA!' });
    }

    try {
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
        const response = await axios.post(verifyUrl);

        if (!response.data.success) {
            return res.status(403).json({ message: 'Phát hiện Bot hoặc reCAPTCHA không hợp lệ!' });
        }

        next(); // Nếu là người thật, cho đi tiếp vào hàm login hoặc register
    } catch (error) {
        console.error('Lỗi check reCAPTCHA:', error);
        return res.status(500).json({ message: 'Lỗi server khi xác thực reCAPTCHA.' });
    }
};


// ==========================================
// [GIỮ NGUYÊN] ĐĂNG NHẬP BẰNG TÀI KHOẢN THƯỜNG
// ==========================================
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email không tồn tại!' });
        }

        const user = users[0];

        // Nếu user này được tạo bằng Google, nhắc họ dùng nút Google Login
        if (user.auth_provider === 'google' && !user.password) {
            return res.status(400).json({ message: 'Tài khoản này được đăng ký bằng Google. Vui lòng chọn "Đăng nhập với Google"!' });
        }

        const isMatch = await bcrypt.compare(password, user.password); 
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Sai mật khẩu!' });
        }

        const token = jwt.sign(
            { id: user.id, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Đăng nhập thành công',
            token: token,
            user: {
                id: user.id,
                full_name: user.full_name,
                role_id: user.role_id
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi Server!' });
    }
};


// ==========================================
// [MỚI] ĐĂNG NHẬP BẰNG GOOGLE (Tự động tạo tài khoản nếu chưa có)
// ==========================================
exports.googleLogin = async (req, res) => {
    const { googleToken } = req.body; 

    if (!googleToken) {
        return res.status(400).json({ message: 'Không nhận được Google Token' });
    }

    try {
        // Xác thực Token với server của Google
        const ticket = await client.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name } = payload; // Lấy email và tên thật từ Google

        // Tìm xem email này đã có trong DB chưa
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        let user = users[0];

        if (!user) {
            // TỰ ĐỘNG ĐĂNG KÝ: role_id = 3 (Học sinh), provider = 'google'
            const [result] = await db.execute(
                `INSERT INTO users (full_name, email, role_id, auth_provider) VALUES (?, ?, ?, ?)`,
                [name, email, 3, 'google']
            );
            
            user = {
                id: result.insertId,
                full_name: name,
                role_id: 3
            };
        } 

        // Cấp JWT Token của hệ thống mình cho Frontend
        const token = jwt.sign(
            { id: user.id, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Đăng nhập Google thành công!',
            token: token,
            user: {
                id: user.id,
                full_name: user.full_name,
                role_id: user.role_id
            }
        });

    } catch (error) {
        console.error('Lỗi Google Auth:', error);
        res.status(401).json({ message: 'Google Token không hợp lệ hoặc đã hết hạn.' });
    }
};
// ==========================================
// [MỚI] API ĐĂNG KÝ TÀI KHOẢN
// ==========================================
exports.register = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        // 1. Kiểm tra email đã tồn tại chưa
        const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email này đã được sử dụng!' });
        }

        // 2. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Lưu vào DB (Mặc định role_id = 3 là Học sinh)
        const [result] = await db.execute(
            'INSERT INTO users (full_name, email, password, role_id, auth_provider) VALUES (?, ?, ?, ?, ?)',
            [fullName, email, hashedPassword, 3, 'local']
        );

        res.status(201).json({ message: 'Đăng ký thành công! Bạn có thể đăng nhập ngay.' });

    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi đăng ký!' });
    }
};