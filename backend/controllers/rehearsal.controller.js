const Rehearsal = require('../models/Rehearsal');
const User = require('../models/User');

// 1. Lấy danh sách lịch tập
exports.getRehearsals = async (req, res) => {
  try {
    const rehearsals = await Rehearsal.find()
      .populate('attendees.user', 'username fullName avatar')
      .sort({ date: 1 }); // Xếp theo ngày tăng dần
    res.json(rehearsals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Tạo lịch tập mới (Tự động thêm thành viên)
exports.createRehearsal = async (req, res) => {
  try {
    const { date, time, location, content } = req.body;

    // 👇 TỰ ĐỘNG LẤY TẤT CẢ USER ĐANG HOẠT ĐỘNG
    // Để khi tạo lịch là có sẵn danh sách người để điểm danh luôn
    const allUsers = await User.find({ status: { $ne: 'banned' } });
    
    const attendeesList = allUsers.map(user => ({
        user: user._id,
        status: 'unknown' // Mặc định là chưa biết
    }));

    const newRehearsal = new Rehearsal({
      date,
      time,
      location,
      content,
      attendees: attendeesList // Gắn danh sách vào
    });

    await newRehearsal.save();
    res.status(201).json(newRehearsal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 3. Điểm danh (Mark Attendance)
exports.markAttendance = async (req, res) => {
  try {
    const { id } = req.params; // ID buổi tập
    const { userId, status } = req.body; // ID thành viên & Trạng thái (present/late/absent)

    // Tìm buổi tập
    const rehearsal = await Rehearsal.findById(id);
    if (!rehearsal) return res.status(404).json({ message: "Không tìm thấy lịch tập" });

    // Tìm người trong danh sách attendees
    const memberIndex = rehearsal.attendees.findIndex(a => a.user.toString() === userId);

    if (memberIndex > -1) {
      // Nếu có rồi -> Cập nhật
      rehearsal.attendees[memberIndex].status = status;
    } else {
      // Nếu chưa có (ví dụ thành viên mới vào sau khi tạo lịch) -> Thêm mới vào
      rehearsal.attendees.push({ user: userId, status: status });
    }

    await rehearsal.save();
    res.json(rehearsal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// 4. Xóa lịch tập
exports.deleteRehearsal = async (req, res) => {
  try {
    await Rehearsal.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa lịch tập' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};