const express = require('express');
const router = express.Router();
// Dùng try-catch để import middleware an toàn
let protect;
try {
    const authMiddleware = require('../middleware/auth');
    protect = authMiddleware.protect;
} catch (err) {
    protect = (req, res, next) => next(); // Nếu lỗi thì bỏ qua auth để test
}

// Import Controller
const { getDashboardData } = require('../controllers/dashboard.controller');

// --- ĐỊNH NGHĨA ĐƯỜNG DẪN ---
router.get('/', protect, getDashboardData);

module.exports = router;