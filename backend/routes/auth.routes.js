const express = require('express');
const router = express.Router();

// 1. Import Middleware bảo vệ
const { protect, admin } = require('../middleware/auth');

// 2. Import Controller (QUAN TRỌNG: Phải có dòng này mới dùng được biến 'controller')
const controller = require('../controllers/auth.controller');

// --- CÁC ROUTE ---

// Đăng ký & Đăng nhập
router.post('/register', controller.register);
router.post('/login', controller.login);

// Admin tạo user
router.post('/admin-create', protect, admin, controller.adminCreateUser);

// Đổi mật khẩu lần đầu
router.put('/change-password-first-time', protect, controller.changePasswordFirstTime);

// Lấy thông tin bản thân
router.get('/me', protect, controller.getMe);

// 👇 CÁC ROUTE MỚI THÊM (Quản lý nhân sự) 👇
// 1. Lấy danh sách nhân sự
router.get('/users', protect, controller.getAllUsers);

// 2. Reset mật khẩu (Cần quyền Admin)
router.put('/users/:id/reset-password', protect, admin, controller.resetUserPassword);

// Duyệt thành viên
router.put('/users/:id/approve', protect, admin, controller.approveUser);

// Xóa thành viên
router.delete('/users/:id', protect, admin, controller.deleteUser);

module.exports = router;