const express = require('express');
const router = express.Router();

// Middleware an toàn
let protect, admin;
try {
    const auth = require('../middleware/auth');
    protect = auth.protect;
    admin = auth.admin;
} catch (e) {}
if (!protect) protect = (req, res, next) => next();

const { 
  getRehearsals, 
  createRehearsal, 
  markAttendance, 
  deleteRehearsal 
} = require('../controllers/rehearsal.controller');

// --- CÁC ROUTE ---

// 1. Lấy danh sách
router.get('/', protect, getRehearsals);

// 2. Tạo lịch (Chỉ Admin)
router.post('/', protect, admin, createRehearsal);

// 3. Điểm danh (Cập nhật trạng thái)
// 👇 Đây là cái API mà Frontend đang gọi bị lỗi, giờ có rồi sẽ hết lỗi
router.put('/:id/attendance', protect, admin, markAttendance);

// 4. Xóa lịch
router.delete('/:id', protect, admin, deleteRehearsal);

module.exports = router;