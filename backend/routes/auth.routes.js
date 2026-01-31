const express = require('express');
const router = express.Router();
// Import cả 2 hàm: login và register
const { login, register } = require('../controllers/auth.controller');

// 1. Route Đăng nhập (Cũ)
router.post('/login', login);

// 2. Route Đăng ký (Mới)
router.post('/register', register);

module.exports = router;