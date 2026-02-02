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

// 👇 THÊM ĐOẠN NÀY ĐỂ DEBUG 👇
console.log("--- KIỂM TRA IMPORT ---");
console.log("1. register:", register);   // Phải hiện [Function]
console.log("2. login:", login);         // Phải hiện [Function]
console.log("3. protect:", protect);     // Phải hiện [Function]
console.log("4. admin:", admin);         // 🔥 Nghi ngờ cái này đang là 'undefined'
console.log("5. adminCreateUser:", adminCreateUser); // Phải hiện [Function]

router.post('/register', register);
router.post('/login', login);

// Route cho Admin tạo user (nếu bạn chưa có)
router.post('/create-user', protect, admin, adminCreateUser);

// 👇 Route đổi mật khẩu (Cần đăng nhập mới đổi được)
router.put('/change-password', protect, changePasswordFirstTime);
router.get('/me', protect, getMe); // 👈 Thêm dòng này

module.exports = router;