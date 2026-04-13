// controllers/exam.controller.js
const db = require('../config/db');

// ======================================================================
//  Tạo đề thi 
// ======================================================================
exports.createFullExam = async (req, res) => {
    const conn = await db.getConnection();
    
    try {
        // Lấy thêm is_proctored từ Frontend gửi lên
        const { class_id, title, duration, description, is_proctored, start_time, end_time, questions } = req.body;
        
        // BỔ SUNG: Lấy ID của giáo viên đang đăng nhập từ token
        const teacherId = req.user.id; 
        
        await conn.beginTransaction();

        // Bước 1: Lưu Đề thi (Đã bổ sung created_by vào đây)
        const [examResult] = await conn.execute(
            'INSERT INTO exams (class_id, title, duration, description, is_proctored, start_time, end_time, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [class_id, title, duration, description || '', is_proctored ? 1 : 0, start_time, end_time, teacherId]
        );
        const examId = examResult.insertId;

        // Bước 2: Lưu Câu hỏi
        for (const q of questions) {
            const [qResult] = await conn.execute(
                'INSERT INTO questions (exam_id, content, point) VALUES (?, ?, ?)',
                [examId, q.content, q.point || 1]
            );
            const questionId = qResult.insertId;

            // Bước 3: Lưu Đáp án
            for (const ans of q.answers) {
                await conn.execute(
                    'INSERT INTO answers (question_id, content, is_correct) VALUES (?, ?, ?)',
                    [questionId, ans.content, ans.is_correct ? 1 : 0]
                );
            }
        }

        await conn.commit();
        res.status(201).json({ message: 'Tạo đề thi trọn bộ thành công!', examId });

    } catch (error) {
        await conn.rollback();
        console.error('❌ Lỗi tạo đề thi:', error);
        res.status(500).json({ message: 'Lỗi hệ thống, đã hủy tạo đề để bảo vệ dữ liệu!' });
    } finally {
        // LUÔN LUÔN RELEASE CONNECTION TRONG MỌI TRƯỜNG HỢP
        if (conn) conn.release();
    }
};

// ======================================================================
// Cập nhật toàn bộ đề thi (Update Full Exam)
// ======================================================================
exports.updateFullExam = async (req, res) => {
    const conn = await db.getConnection();
    
    try {
        const { examId } = req.params;
        const { class_id, title, duration, description, is_proctored, start_time, end_time, questions } = req.body;
        const teacherId = req.user.id; 

        await conn.beginTransaction();

        // Bước 1: Cập nhật thông tin chung của Đề thi (Bảng exams)
        await conn.execute(
            'UPDATE exams SET class_id = ?, title = ?, duration = ?, description = ?, is_proctored = ?, start_time = ?, end_time = ? WHERE id = ? AND created_by = ?',
            [class_id, title, duration, description || '', is_proctored ? 1 : 0, start_time, end_time, examId, teacherId]
        );

        // --- CÁCH XỬ LÝ NHANH GỌN NHẤT: Xóa sạch câu hỏi cũ, thêm lại câu hỏi mới ---
        // Vì DB của Tâm đã set ON DELETE CASCADE, nên xóa câu hỏi sẽ tự xóa luôn đáp án
        await conn.execute('DELETE FROM questions WHERE exam_id = ?', [examId]);

        // Bước 2: Lưu lại mảng Câu hỏi mới từ Frontend gửi lên
        if (questions && questions.length > 0) {
            for (const q of questions) {
                const [qResult] = await conn.execute(
                    'INSERT INTO questions (exam_id, content, point) VALUES (?, ?, ?)',
                    [examId, q.content, q.point || 1]
                );
                const questionId = qResult.insertId;

                // Bước 3: Lưu lại Đáp án cho câu hỏi đó
                if (q.answers && q.answers.length > 0) {
                    for (const ans of q.answers) {
                        await conn.execute(
                            'INSERT INTO answers (question_id, content, is_correct) VALUES (?, ?, ?)',
                            [questionId, ans.content, ans.is_correct ? 1 : 0]
                        );
                    }
                }
            }
        }

        await conn.commit();
        res.status(200).json({ message: 'Cập nhật đề thi thành công!' });

    } catch (error) {
        await conn.rollback();
        console.error('❌ Lỗi cập nhật đề thi:', error);
        res.status(500).json({ message: 'Lỗi hệ thống, không thể cập nhật đề thi!' });
    } finally {
        if (conn) conn.release();
    }
};

exports.getExamDetailForTeacher = async (req, res) => {
    try {
        const { examId } = req.params;

        const [exams] = await db.execute('SELECT * FROM exams WHERE id = ?', [examId]);
        if (!exams.length) return res.status(404).json({ message: 'Không tìm thấy đề thi!' });
        
        const exam = exams[0];

        const [questions] = await db.execute('SELECT id, content, point FROM questions WHERE exam_id = ?', [examId]);

        // KHÁC VỚI HỌC SINH: Ở ĐÂY TA SELECT CẢ CỘT is_correct
        for (let q of questions) {
            const [answers] = await db.execute(
                'SELECT id, content, is_correct FROM answers WHERE question_id = ?', 
                [q.id]
            );
            q.answers = answers;
        }

        exam.questions = questions;
        res.status(200).json({ data: exam });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi tải chi tiết đề thi!' });
    }
};

// 1. [SCRUM-108] Lấy danh sách đề thi theo class_id
exports.getExamsByClass = async (req, res) => {
    try {
        const { class_id } = req.query;
        if (!class_id) return res.status(400).json({ message: 'Thiếu class_id!' });

        const [exams] = await db.execute('SELECT * FROM exams WHERE class_id = ?', [class_id]);
        res.status(200).json({ data: exams });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách đề thi!' });
    }
};

// 2. [SCRUM-104] Thêm 1 câu hỏi vào đề thi (kèm đáp án)
exports.addQuestion = async (req, res) => {
    const conn = await db.getConnection();
    try {
        const { examId } = req.params;
        const { content, point, answers } = req.body; // answers là mảng [{content, is_correct}]

        await conn.beginTransaction();

        const [qResult] = await conn.execute(
            'INSERT INTO questions (exam_id, content, point) VALUES (?, ?, ?)',
            [examId, content, point || 1]
        );
        const questionId = qResult.insertId;

        for (const ans of answers) {
            await conn.execute(
                'INSERT INTO answers (question_id, content, is_correct) VALUES (?, ?, ?)',
                [questionId, ans.content, ans.is_correct]
            );
        }

        await conn.commit();
        res.status(201).json({ message: 'Thêm câu hỏi thành công!', questionId });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: 'Lỗi khi thêm câu hỏi!' });
    } finally {
        conn.release();
    }
};

// 3. [SCRUM-106] Sửa câu hỏi
exports.updateQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { content, point } = req.body;

        const [result] = await db.execute(
            'UPDATE questions SET content = ?, point = ? WHERE id = ?',
            [content, point, questionId]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Không tìm thấy câu hỏi!' });
        res.status(200).json({ message: 'Cập nhật câu hỏi thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật câu hỏi!' });
    }
};

// 4. [SCRUM-107] Xóa câu hỏi (DB của Tâm có CASCADE nên sẽ tự xóa Answers)
exports.deleteQuestion = async (req, res) => {
    try {
        const { questionId } = req.params;
        await db.execute('DELETE FROM questions WHERE id = ?', [questionId]);
        res.status(200).json({ message: 'Đã xóa câu hỏi khỏi đề thi!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa câu hỏi!' });
    }
};

// controllers/exam.controller.js

// 1. [SCRUM-114 & 113] Logic Nộp bài & Chấm điểm tự động
exports.submitExam = async (req, res) => {
    // Dùng Transaction vì bây giờ mình phải Insert vào tận 2 bảng
    const conn = await db.getConnection(); 
    
    try {
        const { exam_id, user_answers } = req.body; // user_answers: [{question_id, answer_id}, ...]
        const user_id = req.user.id;
        const now = new Date();

        await conn.beginTransaction();

        // Bước A: Kiểm tra thời gian bài thi
        const [exam] = await conn.execute(
            'SELECT duration, end_time FROM exams WHERE id = ?', [exam_id]
        );

        if (!exam.length) {
            await conn.rollback();
            return res.status(404).json({ message: 'Không tìm thấy đề thi!' });
        }

        if (exam[0].end_time && now > new Date(exam[0].end_time)) {
            await conn.rollback();
            return res.status(403).json({ 
                message: 'Hết giờ làm bài! Hệ thống không nhận bài nộp quá hạn.',
                total_score: 0 
            });
        }

        // Bước B: Lấy toàn bộ đáp án đúng để đối chiếu
        const [correctAnswers] = await conn.execute(`
            SELECT q.id as question_id, q.point, a.id as answer_id 
            FROM questions q
            JOIN answers a ON q.id = a.question_id
            WHERE q.exam_id = ? AND a.is_correct = 1
        `, [exam_id]);

        // Bước C: Chấm điểm tự động
        let achievedRawScore = 0; // Điểm thực tế đạt được
        let maxRawScore = 0;      // Tổng điểm tối đa của cả đề
        
        correctAnswers.forEach(correct => {
            maxRawScore += correct.point; 
            
            // Tìm xem học sinh có chọn đúng answer_id cho question_id này không
            const studentChoice = user_answers.find(ua => ua.question_id === correct.question_id);
            if (studentChoice && studentChoice.answer_id === correct.answer_id) {
                achievedRawScore += correct.point;
            }
        });

        // QUY ĐỔI SANG THANG ĐIỂM 10
        let finalScore = 0;
        if (maxRawScore > 0) {
            // Công thức: (Điểm đạt được / Tổng điểm tối đa) * 10
            finalScore = (achievedRawScore / maxRawScore) * 10;
            finalScore = Math.round(finalScore * 100) / 100; // Làm tròn 2 chữ số (VD: 8.33)
        }

        // Bước D: Xóa dữ liệu bài nộp cũ (nếu học sinh nộp lại) để tránh rác DB
        const [oldResult] = await conn.execute(
            'SELECT id FROM exam_results WHERE user_id = ? AND exam_id = ?', 
            [user_id, exam_id]
        );
        if (oldResult.length > 0) {
            await conn.execute('DELETE FROM result_details WHERE result_id = ?', [oldResult[0].id]);
            await conn.execute('DELETE FROM exam_results WHERE id = ?', [oldResult[0].id]);
        }

        // Bước E: Lưu Điểm Tổng vào bảng exam_results
        const [resultHeader] = await conn.execute(
            'INSERT INTO exam_results (user_id, exam_id, total_score) VALUES (?, ?, ?)',
            [user_id, exam_id, finalScore]
        );
        const result_id = resultHeader.insertId;

        // Bước F: Lưu Chi Tiết từng câu vào bảng result_details
        if (user_answers && user_answers.length > 0) {
            for (const ua of user_answers) {
                if (ua.answer_id) { // Chỉ lưu những câu học sinh có tích chọn
                    await conn.execute(
                        'INSERT INTO result_details (result_id, question_id, selected_answer_id) VALUES (?, ?, ?)',
                        [result_id, ua.question_id, ua.answer_id]
                    );
                }
            }
        }

        await conn.commit();
        res.status(200).json({ 
            message: 'Nộp bài thành công!', 
            score: finalScore 
        });

    } catch (error) {
        await conn.rollback();
        console.error('Lỗi chấm điểm:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi chấm điểm!' });
    } finally {
        conn.release();
    }
};

// 2. [SCRUM-112] Chặn xem kết quả trước giờ kết thúc
exports.getExamResult = async (req, res) => {
    try {
        const { examId } = req.params;
        const user_id = req.user.id;
        const now = new Date();

        // Lấy end_time để kiểm tra
        const [exam] = await db.execute('SELECT end_time FROM exams WHERE id = ?', [examId]);
        
        if (now < new Date(exam[0].end_time)) {
            return res.status(403).json({ 
                message: 'Chưa tới thời gian công bố kết quả. Vui lòng quay lại sau khi bài thi kết thúc!' 
            });
        }

        // Nếu đã hết giờ thi, cho phép lấy điểm
        const [result] = await db.execute(
            'SELECT * FROM exam_results WHERE user_id = ? AND exam_id = ?', 
            [user_id, examId]
        );

        res.status(200).json({ data: result[0] });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy kết quả!' });
    }
};

// ======================================================================
// [API HỌC SINH] - Lấy chi tiết đề thi để làm bài (Bảo mật đáp án)
// ======================================================================
exports.getExamForStudent = async (req, res) => {
    try {
        const { examId } = req.params;

        // 1. Lấy thông tin chung của đề thi
        const [exams] = await db.execute(
            'SELECT id, title, duration, is_proctored, end_time FROM exams WHERE id = ?', 
            [examId]
        );
        
        if (!exams.length) return res.status(404).json({ message: 'Không tìm thấy đề thi!' });
        const exam = exams[0];

        // 2. Lấy danh sách câu hỏi
        const [questions] = await db.execute(
            'SELECT id, content FROM questions WHERE exam_id = ?', 
            [examId]
        );

        // 3. Lấy đáp án cho từng câu (🚨 CHÚ Ý: KHÔNG SELECT CỘT is_correct)
        for (let q of questions) {
            const [answers] = await db.execute(
                'SELECT id, content FROM answers WHERE question_id = ?', 
                [q.id]
            );
            q.answers = answers; // Nhét đáp án vào trong câu hỏi
        }

        exam.questions = questions; // Nhét danh sách câu hỏi vào đề thi

        res.status(200).json({ data: exam });

    } catch (error) {
        console.error('Lỗi lấy đề thi cho học sinh:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tải đề thi!' });
    }
};

// ======================================================================
// [API HỌC SINH] - Lấy danh sách đề thi (Trạm soát vé)
// ======================================================================
exports.getAvailableExams = async (req, res) => {
    try {
        // Tạm thời lấy tất cả đề thi (Sau này Tài có thể filter theo class_id của học sinh)
        const [exams] = await db.execute(`
            SELECT id, title, duration, end_time, is_proctored 
            FROM exams 
            ORDER BY created_at DESC
        `);
        
        res.status(200).json({ data: exams });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tải danh sách đề thi!' });
    }
};

// ======================================================================
// [API HỌC SINH] - Lấy danh sách đề thi của 1 lớp cụ thể
// ======================================================================
exports.getExamsForStudentByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const studentId = req.user.id;

        // 1. Kiểm tra xem học sinh này có thực sự nằm trong lớp không (Chống xem trộm)
        const [members] = await db.execute(
            'SELECT * FROM class_members WHERE class_id = ? AND user_id = ?', 
            [classId, studentId]
        );
        
        if (members.length === 0) {
            return res.status(403).json({ message: 'Bạn không có quyền xem đề thi của lớp này!' });
        }

        // 2. Lấy danh sách đề thi (Bao gồm cả start_time và end_time anh em vừa làm)
        const [exams] = await db.execute(`
            SELECT e.id, e.title, e.duration, e.start_time, e.end_time, e.is_proctored,
                   IF(r.id IS NOT NULL, 1, 0) as is_submitted
            FROM exams e
            LEFT JOIN exam_results r ON e.id = r.exam_id AND r.user_id = ?
            WHERE e.class_id = ? 
            ORDER BY e.id DESC
        `, [studentId, classId]);

        res.status(200).json({ data: exams });

    } catch (error) {
        console.error('Lỗi lấy đề thi theo lớp cho học sinh:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tải danh sách đề thi!' });
    }
};

// ======================================================================
// [SCRUM-31] [API HỌC SINH] - Xem điểm & Chi tiết bài làm
// ======================================================================
exports.getExamResult = async (req, res) => {
    try {
        const { examId } = req.params;
        const studentId = req.user.id;

        // 1. Lấy điểm tổng từ bảng exam_results (Dùng total_score và submitted_at)
        const [submissionInfo] = await db.execute(`
            SELECT r.id as result_id, r.total_score as score, r.submitted_at, e.title, e.end_time 
            FROM exam_results r
            JOIN exams e ON r.exam_id = e.id
            WHERE r.exam_id = ? AND r.user_id = ?
        `, [examId, studentId]);

        if (submissionInfo.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy kết quả bài thi này!' });
        }

        const resultData = submissionInfo[0];
        const now = new Date();
        const endTime = resultData.end_time ? new Date(resultData.end_time) : null;

        // 2. Logic Khóa/Mở chi tiết
        if (!endTime || now < endTime) {
            return res.status(200).json({
                message: 'Bài thi chưa kết thúc thời gian làm bài. Bạn chỉ được xem điểm tổng.',
                data: {
                    exam_title: resultData.title,
                    score: resultData.score,
                    submitted_at: resultData.submitted_at,
                    details_locked: true 
                }
            });
        }

        // 3. Đã hết giờ -> Truy xuất bảng result_details để xem đúng/sai
        const [detailedAnswers] = await db.execute(`
            SELECT q.content as question_content, a.content as student_choice, 
                   a.is_correct, q.point
            FROM result_details rd
            JOIN questions q ON rd.question_id = q.id
            JOIN answers a ON rd.selected_answer_id = a.id
            WHERE rd.result_id = ?
        `, [resultData.result_id]);

        res.status(200).json({
            message: 'Đây là chi tiết kết quả của bạn.',
            data: {
                exam_title: resultData.title,
                score: resultData.score,
                submitted_at: resultData.submitted_at,
                details_locked: false,
                details: detailedAnswers
            }
        });

    } catch (error) {
        console.error('Lỗi lấy kết quả thi:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi tải kết quả thi!' });
    }
};

exports.getTeacherExams = async (req, res) => {
    try {
        const teacherId = req.user.id; // Lấy ID giáo viên từ token
        
        // Lấy tất cả đề thi do giáo viên này tạo, sắp xếp mới nhất lên đầu
        const [exams] = await db.query(
            'SELECT * FROM exams WHERE created_by = ? ORDER BY created_at DESC',
            [teacherId]
        );
        
        res.json({ success: true, data: exams });
    } catch (error) {
        console.error("Lỗi lấy đề thi của Giáo viên:", error);
        res.status(500).json({ success: false, message: "Lỗi server khi lấy dữ liệu!" });
    }
};

// ======================================================================
// Xóa đề thi (Giáo viên chỉ được xóa đề của mình)
// ======================================================================
exports.deleteExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const teacherId = req.user.id;

        // Xóa đề thi (Do DB của bạn có CASCADE, nó sẽ tự động xóa các câu hỏi và đáp án bên trong)
        const [result] = await db.execute(
            'DELETE FROM exams WHERE id = ? AND created_by = ?', 
            [examId, teacherId]
        );

        if (result.affectedRows === 0) {
            return res.status(403).json({ message: 'Không tìm thấy đề thi hoặc bạn không có quyền xóa!' });
        }

        res.status(200).json({ message: 'Đã xóa đề thi thành công!' });
    } catch (error) {
        console.error('Lỗi xóa đề thi:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi xóa đề thi!' });
    }
};