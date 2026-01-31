const express = require('express');
const router = express.Router();

// Import đủ 4 hàm từ controller
const { login, register, getMe, rescueAdmin } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Định nghĩa routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/rescue', rescueAdmin); // Dòng này gây lỗi nếu controller thiếu hàm rescueAdmin

module.exports = router;