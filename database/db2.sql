-- 1. TẠO BẢNG LỚP HỌC (classes)
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(10) NOT NULL UNIQUE, -- Đảm bảo mã mời không bao giờ trùng nhau
    teacher_id INT NOT NULL, -- Trỏ về bảng users (người tạo lớp)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Khóa ngoại: Nếu xóa tài khoản giáo viên -> Xóa luôn các lớp ông ấy tạo
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. TẠO BẢNG THÀNH VIÊN LỚP (class_members)
CREATE TABLE class_members (
    class_id INT NOT NULL,
    user_id INT NOT NULL, -- Trỏ về bảng users (Học sinh)
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Khóa chính kép: Đảm bảo 1 học sinh chỉ có thể tham gia 1 lớp 1 lần duy nhất
    PRIMARY KEY (class_id, user_id), 
    
    -- KHÓA NGOẠI QUAN TRỌNG (ON DELETE CASCADE)
    -- Nếu xóa Lớp -> Tự động xóa sạch danh sách học sinh trong lớp đó
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    
    -- Nếu xóa Học sinh -> Tự động xóa học sinh đó khỏi mọi lớp đang tham gia
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);