// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

// 1. Middleware xác thực Token (Kiểm tra đăng nhập)
const verifyToken = (req, res, next) => {
    // Lấy token từ header (Định dạng: Bearer <token>)
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy Token. Vui lòng đăng nhập!' });
    }

    try {
        // Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'BiMatCuaTai123');
        
        // Gắn thông tin user (id, role_id...) vào req để các hàm phía sau xài
        req.user = decoded; 
        
        next(); // Token hợp lệ -> Cho đi tiếp
    } catch (error) {
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
};

// 2. Middleware kiểm tra quyền Admin
const adminOnly = (req, res, next) => {
    // Kiểm tra role_id === 1 (Admin)
    if (req.user && req.user.role_id === 1) {
        next();
    } else {
        return res.status(403).json({ message: 'Bạn không có quyền quản trị!' });
    }
};

// Xuất cả 2 hàm ra để các file Routes có thể import và sử dụng
module.exports = {
    verifyToken,
    adminOnly
};