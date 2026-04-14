const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { updateProfile } = require('../controllers/user.controller'); // 👇 Import Controller mới

// Middleware chỉ cho Admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Không phận sự miễn vào! Chỉ dành cho Admin 👮' });
  }
};

// 👇 0. Route Cập nhật Profile (Dành cho mọi User đã đăng nhập)
// Đặt cái này LÊN TRÊN CÙNG để không bị nhầm 'profile' là ':id'
router.put('/profile', protect, updateProfile);

// 1. Lấy danh sách thành viên (Admin)
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ status: -1, createdAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. Cập nhật thành viên (Admin sửa người khác)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, role, instrument } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status, role, instrument }, { new: true });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. Xóa thành viên (Admin)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa thành viên' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;