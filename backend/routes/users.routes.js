const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Middleware chỉ cho Admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Không phận sự miễn vào! Chỉ dành cho Admin 👮' });
  }
};

// 1. Lấy danh sách thành viên
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ status: -1, createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. Cập nhật thành viên
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, role, instrument } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status, role, instrument }, { new: true });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. Xóa thành viên
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa thành viên' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 🔥 QUAN TRỌNG NHẤT: PHẢI CÓ DÒNG NÀY Ở CUỐI 🔥
module.exports = router;