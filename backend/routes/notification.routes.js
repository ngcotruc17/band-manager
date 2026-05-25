const express = require('express');
const router = express.Router();
const { getMyNotifications, markAsRead, markAllRead, sendCustomNotification } = require('../controllers/notification.controller');
const { protect, admin } = require('../middleware/auth');

router.put('/mark-all-read', protect, markAllRead);
router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);
router.post('/send-custom', protect, admin, sendCustomNotification);

module.exports = router;