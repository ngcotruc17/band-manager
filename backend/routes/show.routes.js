const express = require('express');
const router = express.Router();
const controller = require('../controllers/show.controller');
const { protect, admin } = require('../middleware/auth');

// Ai cũng xem được
router.get('/', protect, controller.getShows);

// Chỉ Admin được tạo/xóa/sửa
router.get('/:id', protect, controller.getShowById);
router.post('/', protect, admin, controller.createShow);
router.delete('/:id', protect, admin, controller.deleteShow);
router.put('/:id/status', protect, admin, controller.updateShowStatus);


module.exports = router;