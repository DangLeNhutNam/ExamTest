// middlewares/role.middleware.js
const db = require('../config/db');


exports.isTeacher = (req, res, next) => {
    // Giả định req.user đã được middleware xác thực JWT (verifyToken) gắn vào
    if (!req.user) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập!' });
    }

    // Role 2 là Teacher theo DB của Tâm
    if (req.user.role_id !== 2) {
        return res.status(403).json({ message: 'Truy cập bị từ chối. Chỉ Giáo viên mới được tạo lớp!' });
    }

    next(); // Hợp lệ thì cho đi tiếp vào Controller
};

exports.isStudent = (req, res, next) => {
    if (!req.user || req.user.role_id !== 3) {
        return res.status(403).json({ message: 'Truy cập bị từ chối. Chỉ Học sinh mới được thực hiện hành động này!' });
    }
    next();
};

// Kiểm tra xem giáo viên có phải chủ sở hữu của đề thi không
exports.isExamOwner = async (req, res, next) => {
    // Lấy examId từ mọi ngóc ngách có thể (Params trên URL, Body gửi lên, hoặc Query)
    const exam_id = req.params.examId || req.body.exam_id || req.query.exam_id;
    const teacher_id = req.user.id;

    if (!exam_id) {
        return res.status(400).json({ message: 'Lỗi: Không tìm thấy mã đề thi để kiểm tra quyền!' });
    }

    try {
        // So sánh trực tiếp ID giáo viên với cột created_by của đề thi
        const [exam] = await db.execute(
            'SELECT id FROM exams WHERE id = ? AND created_by = ?',
            [exam_id, teacher_id]
        );

        if (exam.length === 0) {
            return res.status(403).json({ message: 'Bạn không có quyền thao tác trên đề thi này (Đề của người khác tạo)!' });
        }
        
        // Nếu đúng là chính chủ -> Cho phép đi tiếp vào Controller
        next();
    } catch (error) {
        // Đặt console.error để nếu sau này có lỗi, Terminal sẽ hiện rõ nguyên nhân
        console.error("❌ Lỗi SQL tại isExamOwner:", error.message);
        res.status(500).json({ message: 'Lỗi hệ thống khi kiểm tra quyền sở hữu đề thi!' });
    }
};