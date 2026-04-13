const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. Cấu hình Middleware
app.use(cors()); // Cho phép Frontend (cổng 5173) gọi API qua Backend (cổng 5000)
app.use(express.json()); // Giúp Backend đọc được dữ liệu JSON từ Frontend gửi lên

// 2. Import các Routes
const authRoutes = require('./routes/auth.routes');
const classRoutes = require('./routes/class.routes');
const examRoutes = require('./routes/exam.routes');
const adminRoutes = require('./routes/adminRoutes');

// 3. Khai báo đường dẫn API
// Toàn bộ API liên quan đến login/register sẽ có tiền tố là /api/auth
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/admin', adminRoutes);

// Route mặc định để test xem server sống không
app.get('/', (req, res) => {
    res.send('🚀 Server Backend ExamTest đang chạy mượt mà nha!');
});

// 4. Khởi động Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server đã khởi chạy thành công tại http://localhost:${PORT}`);
});