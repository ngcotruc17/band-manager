const express = require('express');
const router = express.Router();
const Rehearsal = require('../models/Rehearsal');
const User = require('../models/User');
// 👇 SỬA DÒNG NÀY: Dùng dấu ngoặc nhọn { protect } để lấy đúng hàm cần thiết
const { protect } = require('../middleware/auth'); 

// 1. Lấy danh sách lịch tập (Thay 'auth' bằng 'protect')
router.get('/', protect, async (req, res) => {
  try {
    const list = await Rehearsal.find().sort({ date: -1 }).populate('attendees.user', 'fullName username');
    res.json(list);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. Tạo lịch tập mới (Thay 'auth' bằng 'protect')
router.post('/', protect, async (req, res) => {
  try {
    const allUsers = await User.find(); 
    const attendees = allUsers.map(u => ({
      user: u._id,
      status: 'pending',
      fine: 0
    }));

    const newRehearsal = new Rehearsal({
      date: req.body.date,
      location: req.body.location,
      content: req.body.content,
      attendees: attendees
    });

    const saved = await newRehearsal.save();
    const populated = await Rehearsal.findById(saved._id).populate('attendees.user', 'fullName username');
    res.json(populated);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. Điểm danh (Thay 'auth' bằng 'protect')
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
    }

    await rehearsal.save();
    res.json(rehearsal);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// 4. Xóa lịch tập (Thay 'auth' bằng 'protect')
router.delete('/:id', protect, async (req, res) => {
  try {
    await Rehearsal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;