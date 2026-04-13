const db = require('../config/db');

const adminExamController = {
    // [SCRUM-154] Admin lấy TẤT CẢ đề thi/bài tập trong hệ thống
    getAllContent: async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.*, u.full_name as creator_name 
            FROM exams e 
            LEFT JOIN users u ON e.created_by = u.id 
            ORDER BY e.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        // THÊM DÒNG NÀY ĐỂ XEM LỖI Ở TERMINAL
        console.error("❌ Lỗi SQL Admin Exam:", error.message); 
        
        res.status(500).json({ 
            success: false, 
            message: "Lỗi lấy dữ liệu hệ thống",
            debug: error.message // Có thể tạm thời gửi lỗi về FE để xem cho nhanh
        });
        }
    },

    // [SCRUM-155] Admin có thể tạo đề thi mẫu hoặc đề thi chung
    createSystemExam: async (req, res) => {
        const { title, description, duration, is_proctored, type } = req.body;
        try {
            await db.query(
                'INSERT INTO exams (title, description, duration, is_proctored, type, created_by) VALUES (?, ?, ?, ?, ?, ?)',
                [title, description, duration, is_proctored, type, req.user.id]
            );
            res.status(201).json({ success: true, message: "Tạo nội dung hệ thống thành công" });
        } catch (error) {
            res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ" });
        }
    },

    // [SCRUM-157] Admin xóa bất kỳ nội dung nào vi phạm hoặc hết hạn
    deleteAnyContent: async (req, res) => {
        const { id } = req.params;
        try {
            await db.query('DELETE FROM exams WHERE id = ?', [id]);
            res.json({ success: true, message: "Admin đã xóa nội dung thành công" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi khi xóa dữ liệu" });
        }
    }
};

module.exports = adminExamController;