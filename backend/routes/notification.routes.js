const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllRead } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth');

router.put('/mark-all-read', protect, markAllRead);
router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);


module.exports = router;