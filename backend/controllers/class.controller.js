// controllers/class.controller.js
const db = require('../config/db'); // Đường dẫn tới file kết nối MySQL của Tài

// HÀM HỖ TRỢ: Sinh mã ngẫu nhiên 6 ký tự (Chữ in hoa + Số)
const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// API: TẠO LỚP HỌC
exports.createClass = async (req, res) => {
    try {
        const { class_name } = req.body;
        const teacher_id = req.user.id; // Lấy ID giáo viên từ token

        // Validate (SCRUM-80)
        if (!class_name) {
            return res.status(400).json({ message: 'Tên lớp không được để trống!' });
        }

        let invite_code = '';
        let isUnique = false;

        // Vòng lặp kiểm tra trùng lặp (SCRUM-81)
        while (!isUnique) {
            invite_code = generateInviteCode();
            // Quét DB xem mã này đã có ai dùng chưa
            const [existing] = await db.execute('SELECT id FROM classes WHERE invite_code = ?', [invite_code]);
            
            if (existing.length === 0) {
                isUnique = true; // Thoát vòng lặp nếu mã là duy nhất
            }
        }

        // Lưu vào DB (SCRUM-77)
        const [result] = await db.execute(
            'INSERT INTO classes (class_name, invite_code, teacher_id) VALUES (?, ?, ?)',
            [class_name, invite_code, teacher_id]
        );

        res.status(201).json({
            message: 'Tạo lớp học thành công!',
            data: {
                id: result.insertId,
                class_name,
                invite_code,
                teacher_id
            }
        });

    } catch (error) {
        console.error('Lỗi tạo lớp:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tạo lớp học!' });
    }
};

// ==========================================
// 1. API HỌC SINH THAM GIA LỚP BẰNG MÃ (POST /join)
// ==========================================
exports.joinClass = async (req, res) => {
    try {
        const { invite_code } = req.body;
        const student_id = req.user.id; // Lấy ID học sinh từ token

        if (!invite_code) return res.status(400).json({ message: 'Vui lòng nhập mã lớp!' });

        // 1. Tìm lớp bằng mã code
        const [classes] = await db.execute('SELECT id, class_name FROM classes WHERE invite_code = ?', [invite_code]);
        if (classes.length === 0) return res.status(404).json({ message: 'Mã lớp không tồn tại!' });
        
        const class_id = classes[0].id;

        // 2. Kiểm tra xem học sinh đã ở trong lớp chưa
        const [members] = await db.execute('SELECT * FROM class_members WHERE class_id = ? AND user_id = ?', [class_id, student_id]);
        if (members.length > 0) return res.status(400).json({ message: 'Bạn đã tham gia lớp này rồi!' });

        // 3. Cho vào lớp
        await db.execute('INSERT INTO class_members (class_id, user_id) VALUES (?, ?)', [class_id, student_id]);

        res.status(200).json({ message: `Gia nhập lớp ${classes[0].class_name} thành công!` });
    } catch (error) {
        console.error('Lỗi join class:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tham gia lớp!' });
    }
};

// ==========================================
// 2. API XEM DANH SÁCH HỌC SINH (GET /:id/students) - Dành cho Giáo viên
// ==========================================
exports.getStudentsInClass = async (req, res) => {
    try {
        const class_id = req.params.id;
        const teacher_id = req.user.id;

        // 1. Kiểm tra xem lớp này có đúng là của giáo viên đang đăng nhập không
        const [checkClass] = await db.execute('SELECT id FROM classes WHERE id = ? AND teacher_id = ?', [class_id, teacher_id]);
        if (checkClass.length === 0) return res.status(403).json({ message: 'Bạn không có quyền xem lớp này!' });

        // 2. Lấy danh sách (Nối bảng class_members với users)
        const [students] = await db.execute(`
            SELECT u.id, u.full_name, u.email, cm.joined_at 
            FROM class_members cm 
            JOIN users u ON cm.user_id = u.id 
            WHERE cm.class_id = ?
            ORDER BY cm.joined_at DESC
        `, [class_id]);

        res.status(200).json({ data: students });
    } catch (error) {
        console.error('Lỗi lấy danh sách học sinh:', error);
        res.status(500).json({ message: 'Lỗi hệ thống!' });
    }
};

// ==========================================
// 3. API ĐUỔI HỌC SINH KHỎI LỚP (DELETE /:id/students/:userId) - Dành cho Giáo viên
// ==========================================
exports.removeStudent = async (req, res) => {
    try {
        const class_id = req.params.id;
        const student_id = req.params.userId;
        const teacher_id = req.user.id;

        // 1. Kiểm tra quyền sở hữu lớp của giáo viên
        const [checkClass] = await db.execute('SELECT id FROM classes WHERE id = ? AND teacher_id = ?', [class_id, teacher_id]);
        if (checkClass.length === 0) return res.status(403).json({ message: 'Bạn không có quyền thao tác trên lớp này!' });

        // 2. Xóa học sinh
        const [result] = await db.execute('DELETE FROM class_members WHERE class_id = ? AND user_id = ?', [class_id, student_id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy học sinh trong lớp!' });

        res.status(200).json({ message: 'Đã xóa học sinh khỏi lớp!' });
    } catch (error) {
        console.error('Lỗi xóa học sinh:', error);
        res.status(500).json({ message: 'Lỗi hệ thống!' });
    }
};
// ==========================================
// 4. API LẤY DANH SÁCH LỚP CỦA GIÁO VIÊN (GET /my-classes)
// ==========================================
exports.getMyClasses = async (req, res) => {
    try {
        const teacher_id = req.user.id; // Lấy ID giáo viên đang đăng nhập

        // Quét DB lấy tất cả lớp do giáo viên này tạo, xếp cái mới nhất lên đầu
        const [classes] = await db.execute(
            'SELECT * FROM classes WHERE teacher_id = ? ORDER BY created_at DESC', 
            [teacher_id]
        );

        // Trả về cho Frontend của Nam
        res.status(200).json({ data: classes });
    } catch (error) {
        console.error('Lỗi lấy danh sách lớp:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tải danh sách lớp!' });
    }
};
// ==========================================
// 5. API LẤY DANH SÁCH LỚP HỌC SINH ĐÃ THAM GIA (GET /joined-classes)
// ==========================================
exports.getJoinedClasses = async (req, res) => {
    try {
        const student_id = req.user.id;
        
        // Nối bảng classes, class_members và users để lấy luôn tên giáo viên
        const [classes] = await db.execute(`
            SELECT c.*, u.full_name as teacher_name, cm.joined_at
            FROM classes c
            JOIN class_members cm ON c.id = cm.class_id
            JOIN users u ON c.teacher_id = u.id
            WHERE cm.user_id = ?
            ORDER BY cm.joined_at DESC
        `, [student_id]);

        res.status(200).json({ data: classes });
    } catch (error) {
        console.error('Lỗi lấy danh sách lớp đã tham gia:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tải danh sách lớp!' });
    }
};
/// ======================================================================
// [API GIÁO VIÊN] - Lấy chi tiết lớp học & Danh sách học sinh
// ======================================================================
exports.getClassDetails = async (req, res) => {
    try {
        const { classId } = req.params;

        // 1. Lấy thông tin chung của Lớp (✅ Đã sửa name thành class_name)
        const [classInfo] = await db.execute(
            'SELECT id, class_name as name, invite_code, created_at FROM classes WHERE id = ?', 
            [classId]
        );

        if (!classInfo.length) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học!' });
        }

        // 2. Lấy danh sách Học sinh tham gia lớp này
        const [students] = await db.execute(`
            SELECT u.id, u.full_name, u.email 
            FROM users u
            JOIN class_members cm ON u.id = cm.user_id
            WHERE cm.class_id = ?
            ORDER BY u.full_name ASC
        `, [classId]);

        res.status(200).json({ 
            data: {
                info: classInfo[0],
                students: students
            } 
        });

    } catch (error) {
        console.error('Lỗi lấy chi tiết lớp:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tải dữ liệu lớp học!' });
    }
};

// ======================================================================
// [SCRUM-32] [API GIÁO VIÊN] - Thống kê điểm số của lớp
// ======================================================================
exports.getClassScores = async (req, res) => {
    try {
        const { classId } = req.params;
        const teacherId = req.user.id;
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const searchName = req.query.search || ''; 
        const filterExamId = req.query.examId || ''; 

        // 1. Kiểm tra quyền sở hữu lớp
        const [checkClass] = await db.execute('SELECT id FROM classes WHERE id = ? AND teacher_id = ?', [classId, teacherId]);
        if (checkClass.length === 0) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập dữ liệu lớp này!' });
        }

        // 2. Build Query
        let queryParams = [classId];
        let searchCondition = '';
        
        if (searchName) {
            searchCondition += ` AND u.full_name LIKE ?`;
            queryParams.push(`%${searchName}%`);
        }
        if (filterExamId) {
            searchCondition += ` AND e.id = ?`;
            queryParams.push(filterExamId);
        }

        // Đếm tổng số để phân trang
        const [totalRows] = await db.execute(`
            SELECT COUNT(*) as total
            FROM exam_results r
            JOIN users u ON r.user_id = u.id
            JOIN exams e ON r.exam_id = e.id
            WHERE e.class_id = ? ${searchCondition}
        `, queryParams);

        queryParams.push(limit.toString(), offset.toString()); 
        
        // Lấy dữ liệu (Đã fix total_score và submitted_at)
        const [scores] = await db.execute(`
            SELECT r.id as result_id, u.full_name as student_name, u.email, 
                   e.title as exam_title, r.total_score as score, r.submitted_at
            FROM exam_results r
            JOIN users u ON r.user_id = u.id
            JOIN exams e ON r.exam_id = e.id
            WHERE e.class_id = ? ${searchCondition}
            ORDER BY r.submitted_at DESC
            LIMIT ? OFFSET ?
        `, queryParams);

        res.status(200).json({
            data: scores,
            pagination: {
                total_records: totalRows[0].total,
                current_page: page,
                total_pages: Math.ceil(totalRows[0].total / limit)
            }
        });

    } catch (error) {
        console.error('Lỗi thống kê điểm:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tải dữ liệu điểm số!' });
    }
};