const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth'); // Import middleware
const { 
    register, 
    login, 
    adminCreateUser, 
    changePasswordFirstTime,
    getMe
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);

// Route cho Admin tạo user (nếu bạn chưa có)
router.post('/create-user', protect, admin, adminCreateUser);

// 👇 Route đổi mật khẩu (Cần đăng nhập mới đổi được)
router.put('/change-password', protect, changePasswordFirstTime);
router.get('/me', protect, getMe); // 👈 Thêm dòng này

module.exports = router;