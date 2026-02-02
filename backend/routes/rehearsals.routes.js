const express = require('express');
const router = express.Router();
const controller = require('../controllers/rehearsal.controller');
const { protect, admin } = require('../middleware/auth');

// Ai cũng xem được lịch
router.get('/', protect, controller.getRehearsals);

// Chỉ Admin mới được Tạo/Sửa/Xóa
router.post('/', protect, admin, controller.createRehearsal);
router.put('/:id/attendance', protect, admin, controller.updateAttendance);
router.delete('/:id', protect, admin, controller.deleteRehearsal);

module.exports = router;