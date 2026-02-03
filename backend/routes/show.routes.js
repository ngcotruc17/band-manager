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
router.post('/:id/join', protect, controller.joinShow);

router.put('/:id/approve-participant', protect, admin, controller.approveParticipant);
router.put('/:id/remove-participant', protect, admin, controller.removeParticipant);
router.put('/:id/toggle-registration', protect, admin, controller.toggleRegistration);

router.put('/:id', protect, admin, controller.updateShow);

module.exports = router;