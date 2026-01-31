const express = require('express');
const router = express.Router();
const { 
  getBookings, 
  createBooking, 
  updateBookingStatus, 
  deleteBooking 
} = require('../controllers/booking.controller');
const { protect } = require('../middleware/auth');

// Lấy danh sách & Tạo mới
router.route('/')
  .get(protect, getBookings)
  .post(protect, createBooking);

// Cập nhật trạng thái (Dùng chung cho Duyệt/Hủy/Đã diễn)
router.put('/:id/status', protect, updateBookingStatus);

// Xóa booking
router.delete('/:id', protect, deleteBooking);

module.exports = router;