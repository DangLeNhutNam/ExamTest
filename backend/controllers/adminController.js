// controllers/adminController.js
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const adminController = {
    // [SCRUM-146] Lấy danh sách User/Teacher
    getAllUsers: async (req, res) => {
        try {
            const [users] = await db.query(
                'SELECT id, full_name, email, role_id, status, created_at FROM users WHERE role_id != 1'
            );
            res.json({ success: true, data: users });
        } catch (error) {
            console.log("CHI TIẾT LỖI:", error); // Thêm dòng này
            res.status(500).json({ message: 'Lỗi server!' });
        }
    },

    // [SCRUM-147] Tạo User/Teacher mới
    createUser: async (req, res) => {
        const { username, password, fullname, role } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.query(
                'INSERT INTO users (username, password, fullname, role) VALUES (?, ?, ?, ?)',
                [username, hashedPassword, fullname, role]
            );
            res.status(201).json({ message: 'Tạo tài khoản thành công!' });
        } catch (error) {
            res.status(400).json({ message: 'Username đã tồn tại hoặc dữ liệu lỗi!' });
        }
    },

    // [SCRUM-144] Khóa/Mở khóa tài khoản
    toggleLockUser: async (req, res) => {
        const { id } = req.params;
        const { status } = req.body; // 'active' hoặc 'locked'
        try {
            await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
            res.json({ message: `Đã cập nhật trạng thái thành ${status}` });
        } catch (error) {
            res.status(500).json({ message: 'Không thể cập nhật trạng thái!' });
        }
    },

    // [SCRUM-143] Reset mật khẩu về mặc định (ví dụ: 123456)
    resetPassword: async (req, res) => {
        const { id } = req.params;
        try {
            const defaultPass = await bcrypt.hash('123456', 10);
            await db.query('UPDATE users SET password = ? WHERE id = ?', [defaultPass, id]);
            res.json({ message: 'Mật khẩu đã được reset về: 123456' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi reset mật khẩu!' });
        }
    },

    // [SCRUM-148] Thay đổi Role người dùng
    updateUserRole: async (req, res) => {
        const { id } = req.params;
        const { role_id } = req.body; // Nhận role_id mới (2 hoặc 3)
        try {
            await db.query('UPDATE users SET role_id = ? WHERE id = ?', [role_id, id]);
            res.json({ success: true, message: 'Cập nhật vai trò thành công!' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi cập nhật vai trò' });
        }
    },
    
    // [SCRUM-149] Xóa User
    deleteUser: async (req, res) => {
        const { id } = req.params;
        try {
            await db.query('DELETE FROM users WHERE id = ?', [id]);
            res.json({ message: 'Xóa người dùng thành công!' });
        } catch (error) {
            res.status(500).json({ message: 'Không thể xóa người dùng này!' });
        }
    }
    
};

module.exports = adminController;