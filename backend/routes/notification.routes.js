const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// Lấy thông báo của user đang đăng nhập
router.get('/', protect, async (req, res) => {
  try {
    // 👇 QUAN TRỌNG: Tìm theo 'recipient' khớp với ID người dùng
    const notis = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20); // Lấy 20 cái mới nhất
      
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    
    res.json({ notifications: notis, unreadCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Đánh dấu đã đọc 1 cái
router.put('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Đánh dấu đã đọc tất cả
router.put('/read-all', protect, async (req, res) => {
  try {
    // 👇 Sửa 'user' thành 'recipient'
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;