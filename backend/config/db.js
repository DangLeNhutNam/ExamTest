const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo Pool kết nối (giúp chịu tải nhiều user cùng lúc)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',      
    password: process.env.DB_PASSWORD || '',  
    database: process.env.DB_NAME || 'exam_test_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test thử kết nối
pool.getConnection()
    .then(() => console.log('✅ Đã kết nối thành công với phpMyAdmin!'))
    .catch((err) => console.log('❌ Lỗi kết nối DB:', err));

module.exports = pool;