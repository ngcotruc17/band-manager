const Rehearsal = require('../models/Rehearsal');
const User = require('../models/User');

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