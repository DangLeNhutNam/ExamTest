-- 1. Thêm cột mô tả cho đề thi
ALTER TABLE `exams` ADD COLUMN `description` TEXT AFTER `title`;

-- 2. Sửa lại khóa ngoại cho bảng kết quả thi để có thể xóa tự động
-- Trước tiên xóa các ràng buộc cũ (nếu có tên khác thì Tâm check lại tên constraint nhé)
ALTER TABLE `exam_results` DROP FOREIGN KEY `exam_results_ibfk_1`;
ALTER TABLE `exam_results` DROP FOREIGN KEY `exam_results_ibfk_2`;

-- Thêm lại với ON DELETE CASCADE
ALTER TABLE `exam_results` 
  ADD CONSTRAINT `exam_results_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `exam_results_ibfk_2` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE;

-- 3. (Tùy chọn) Bảng lưu chi tiết đáp án học sinh đã chọn (Để xem lại bài)
CREATE TABLE IF NOT EXISTS `result_details` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `result_id` INT NOT NULL, -- Trỏ về bảng exam_results
    `question_id` INT NOT NULL, -- Câu hỏi nào
    `selected_answer_id` INT NOT NULL, -- Đáp án học sinh đã chọn
    FOREIGN KEY (`result_id`) REFERENCES `exam_results` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`selected_answer_id`) REFERENCES `answers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Xóa ràng buộc cũ
ALTER TABLE users DROP FOREIGN KEY users_ibfk_1;

-- Thêm ràng buộc mới thông minh hơn
ALTER TABLE users 
ADD CONSTRAINT users_ibfk_1 
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;