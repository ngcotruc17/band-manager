//D:\ProjectVSC\band-booking-app\backend\routes\rehearsals.routes.js
const express = require('express');
const router = express.Router();
const Rehearsal = require('../models/Rehearsal');
const User = require('../models/User');
const Notification = require('../models/Notification'); // Import Model Thông báo
const { protect } = require('../middleware/auth');

// 1. Lấy danh sách lịch tập
router.get('/', protect, async (req, res) => {
  try {
    const list = await Rehearsal.find().sort({ date: -1, time: 1 }).populate('attendees.user', 'fullName username');
    res.json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. Tạo lịch tập + GỬI THÔNG BÁO XANH (INFO)
router.post('/', protect, async (req, res) => {
  try {
    const allUsers = await User.find();
    const attendees = allUsers.map(u => ({ user: u._id, status: 'pending', fine: 0 }));

    const newRehearsal = new Rehearsal({
      date: req.body.date,
      time: req.body.time,
      location: req.body.location,
      content: req.body.content,
      attendees: attendees
    });

    const saved = await newRehearsal.save();

    // --- TẠO THÔNG BÁO ---
    // Lưu ý: Dùng 'recipient' thay vì 'user'
    const notifications = allUsers.map(u => ({
      recipient: u._id, 
      sender: 'Admin',
      message: `📅 Lịch tập mới: ${req.body.time} - ${new Date(req.body.date).toLocaleDateString('vi-VN')}. Nội dung: ${req.body.content}`,
      link: '/rehearsals',
      type: 'info' // Màu xanh
    }));
    await Notification.insertMany(notifications);
    // ---------------------

    const populated = await Rehearsal.findById(saved._id).populate('attendees.user', 'fullName username');
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. Điểm danh + GỬI THÔNG BÁO ĐỎ (ERROR/WARNING)
router.put('/:id/checkin', protect, async (req, res) => {
  try {
    const { userId, status } = req.body;
    const rehearsal = await Rehearsal.findById(req.params.id);
    
    let fineAmount = 0;
    if (status === 'late') fineAmount = 50000;
    if (status === 'absent') fineAmount = 100000;

    const attendeeIndex = rehearsal.attendees.findIndex(a => a.user.toString() === userId);
    if (attendeeIndex > -1) {
      rehearsal.attendees[attendeeIndex].status = status;
      rehearsal.attendees[attendeeIndex].fine = fineAmount;
      
      // --- GỬI THÔNG BÁO PHẠT ---
      if (status === 'late' || status === 'absent') {
        const isAbsent = status === 'absent';
        await Notification.create({
          recipient: userId, // Dùng 'recipient'
          sender: 'Hệ thống kỷ luật',
          message: isAbsent 
            ? `❌ Vắng mặt ngày ${new Date(rehearsal.date).toLocaleDateString('vi-VN')}. Phạt: 100.000đ` 
            : `⚠️ Đi muộn ngày ${new Date(rehearsal.date).toLocaleDateString('vi-VN')}. Phạt: 50.000đ`,
          link: '/rehearsals',
          type: isAbsent ? 'error' : 'warning' // Đỏ hoặc Vàng
        });
      }
    }

    await rehearsal.save();
    res.json(rehearsal);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 4. Xóa lịch tập
router.delete('/:id', protect, async (req, res) => {
  try {
    await Rehearsal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;