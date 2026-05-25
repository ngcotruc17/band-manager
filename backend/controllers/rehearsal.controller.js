const Rehearsal = require('../models/Rehearsal');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 1. Lấy danh sách lịch tập (Tự động đồng bộ thành viên)
exports.getRehearsals = async (req, res) => {
  try {
    const allUsers = await User.find({ isApproved: true }).select('_id fullName email');
    let rehearsals = await Rehearsal.find().sort({ date: -1 }).lean();

    // Logic đồng bộ: Lấy danh sách User hiện tại làm chuẩn
    rehearsals = rehearsals.map(rehearsal => {
        const currentAttendance = rehearsal.attendance || [];
        
        const mergedAttendance = allUsers.map(user => {
            // Check xem user này đã được điểm danh chưa
            const existingRecord = currentAttendance.find(a => 
                a.user && a.user.toString() === user._id.toString()
            );

            if (existingRecord) {
                // Có rồi thì lấy lại trạng thái cũ
                return { ...existingRecord, user: user };
            } else {
                // Chưa có (người mới) thì tạo mới
                return {
                    user: user,
                    status: 'pending',
                    fine: 0
                };
            }
        });

        return { ...rehearsal, attendance: mergedAttendance };
    });

    res.json(rehearsals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Tạo lịch tập mới 
exports.createRehearsal = async (req, res) => {
  try {
    const { date, time, location, content } = req.body;
    
    // Vẫn tạo danh sách ban đầu để lưu vào DB
    const users = await User.find({ isApproved: true });
    const attendanceList = users.map(u => ({
      user: u._id,
      status: 'pending',
      fine: 0
    }));

    const newRehearsal = new Rehearsal({
      date, time, location, content,
      attendance: attendanceList
    });

    await newRehearsal.save();
    res.status(201).json(newRehearsal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Cập nhật điểm danh
exports.updateAttendance = async (req, res) => {
  try {
    const { attendance } = req.body; 
    const rehearsal = await Rehearsal.findById(req.params.id);
    
    if (!rehearsal) return res.status(404).json({ message: "Không tìm thấy lịch tập" });

    rehearsal.attendance = attendance;
    await rehearsal.save();
    
    res.json(rehearsal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Xóa lịch tập
exports.deleteRehearsal = async (req, res) => {
  try {
    await Rehearsal.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa lịch tập" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Tạo token QR điểm danh ngắn hạn (5 phút)
exports.generateQRToken = async (req, res) => {
  try {
    const rehearsal = await Rehearsal.findById(req.params.id);
    if (!rehearsal) {
      return res.status(404).json({ message: "Không tìm thấy lịch tập" });
    }
    const token = jwt.sign(
      { rehearsalId: rehearsal._id }, 
      process.env.JWT_SECRET || 'secretkey', 
      { expiresIn: '5m' }
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Điểm danh tự động qua QR
exports.checkin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Thiếu mã check-in token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    } catch (err) {
      return res.status(401).json({ message: "Mã QR đã hết hạn hoặc không hợp lệ. Vui lòng quét lại!" });
    }

    if (decoded.rehearsalId !== req.params.id) {
      return res.status(400).json({ message: "Mã QR không trùng khớp với buổi tập này" });
    }

    const rehearsal = await Rehearsal.findById(req.params.id);
    if (!rehearsal) {
      return res.status(404).json({ message: "Không tìm thấy lịch tập" });
    }

    let record = rehearsal.attendance.find(a => a.user && a.user.toString() === req.user.id);
    if (!record) {
      record = { user: req.user.id, status: 'pending', fine: 0 };
      rehearsal.attendance.push(record);
      record = rehearsal.attendance[rehearsal.attendance.length - 1];
    }

    if (record.status !== 'pending') {
      return res.status(400).json({ message: "Bạn đã được điểm danh trước đó rồi!" });
    }

    let isLate = false;
    try {
      const timeStr = rehearsal.time || "";
      const startTimePart = timeStr.split('-')[0].trim(); // VD: "19:00"
      const [startHour, startMin] = startTimePart.split(':').map(Number);
      
      const rehearsalDate = new Date(rehearsal.date);
      const startDateTime = new Date(
        rehearsalDate.getFullYear(),
        rehearsalDate.getMonth(),
        rehearsalDate.getDate(),
        startHour,
        startMin
      );

      const now = new Date();
      const diffMs = now.getTime() - startDateTime.getTime();
      
      // Cho phép trễ tối đa 15 phút
      if (diffMs > 15 * 60 * 1000) {
        isLate = true;
      }
    } catch (e) {
      console.error("Lỗi parse thời gian tập:", e);
    }

    record.status = isLate ? 'late' : 'present';
    if (isLate) {
      record.fine = 50000; // Phạt đi trễ 50k
    } else {
      record.fine = 0;
    }

    await rehearsal.save();

    res.json({
      message: isLate ? "Điểm danh thành công! Bạn đi trễ và bị phạt 50.000đ" : "Điểm danh thành công! Bạn đi tập đúng giờ.",
      status: record.status,
      fine: record.fine
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Lấy bảng xếp hạng điểm danh và phạt (Leaderboard)
exports.getLeaderboard = async (req, res) => {
  try {
    const allUsers = await User.find({ isApproved: true }).select('_id fullName').lean();
    const rehearsals = await Rehearsal.find().lean();

    const stats = allUsers.map(user => {
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let totalFines = 0;

      rehearsals.forEach(rehearsal => {
        const record = (rehearsal.attendance || []).find(a => a.user && a.user.toString() === user._id.toString());
        if (record) {
          if (record.status === 'present') presentCount++;
          else if (record.status === 'late') lateCount++;
          else if (record.status === 'absent') absentCount++;
          
          totalFines += record.fine || 0;
        }
      });

      const totalActiveSessions = presentCount + lateCount + absentCount;
      const attendanceRate = totalActiveSessions > 0 
        ? Math.round((presentCount / totalActiveSessions) * 100) 
        : 100;

      return {
        userId: user._id,
        fullName: user.fullName,
        presentCount,
        lateCount,
        absentCount,
        totalFines,
        attendanceRate
      };
    });

    const attendanceLeaderboard = [...stats].sort((a, b) => b.attendanceRate - a.attendanceRate);
    const fineLeaderboard = [...stats].sort((a, b) => b.totalFines - a.totalFines);

    res.json({
      attendanceLeaderboard,
      fineLeaderboard
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};