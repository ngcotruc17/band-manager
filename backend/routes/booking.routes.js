const express = require('express');
const router = express.Router();

// 1. Import Middleware (Dùng chế độ an toàn như Event)
let protect, admin;
try {
    const authMiddleware = require('../middleware/auth');
    protect = authMiddleware.protect;
    admin = authMiddleware.admin;
} catch (err) {
    console.warn("⚠️ Thiếu file middleware/auth.js");
}

// Nếu thiếu middleware thì tạo giả để không crash
if (!protect) protect = (req, res, next) => next();
if (!admin) admin = (req, res, next) => next();

// 2. Import Controller
// Đảm bảo tên hàm khớp 100% với file booking.controller.js
const {
    getBookings,
    createBooking,
    updateStatus,
    deleteBooking
} = require('../controllers/booking.controller');

// --- CÁC ROUTE ---

// 1. Lấy danh sách Booking
router.get('/', protect, getBookings);

// 2. Tạo Booking mới
router.post('/', protect, createBooking);

// 3. Cập nhật trạng thái (Duyệt/Hủy) - Chỉ Admin
// (Dòng này hay bị lỗi nếu tên hàm updateStatus trong controller bị sai)
router.put('/:id', protect, admin, updateStatus);

// 4. Xóa Booking - Chỉ Admin
router.delete('/:id', protect, admin, deleteBooking);

module.exports = router;