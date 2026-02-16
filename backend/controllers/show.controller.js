const Show = require('../models/Show');
const User = require('../models/User'); 
// 👇 Import bộ gửi mail vừa tạo
const { sendNewShowEmail, sendApproveEmail } = require('../utils/sendEmail'); 

// 1. Lấy danh sách Show (Mới nhất lên đầu)
exports.getShows = async (req, res) => {
  try {
    const shows = await Show.find().sort({ date: 1 }); // Sắp xếp theo ngày diễn gần nhất
    res.json(shows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Tạo Show mới
exports.createShow = async (req, res) => {
  try {
    const newShow = new Show({
      ...req.body,
      createdBy: req.user.id
    });
    await newShow.save();
    res.status(201).json(newShow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Xóa Show
exports.deleteShow = async (req, res) => {
  try {
    await Show.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa show" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Cập nhật trạng thái (Dùng cho nút Duyệt/Hủy nhanh)
exports.updateShowStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Lấy show cũ để so sánh trạng thái
    const oldShow = await Show.findById(req.params.id);
    if (!oldShow) return res.status(404).json({ message: "Không tìm thấy show" });

    const updatedShow = await Show.findByIdAndUpdate(req.params.id, { status }, { new: true });

    // 👇 LOGIC GỬI MAIL: Nếu chuyển từ 'pending' -> 'confirmed' (Admin duyệt show)
    if (oldShow.status === 'pending' && status === 'confirmed') {
        // Chạy bất đồng bộ (không dùng await) để server phản hồi nhanh, mail gửi ngầm
        sendNewShowEmail(updatedShow).catch(err => console.error(err));
    }

    res.json(updatedShow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Lấy chi tiết 1 Show
exports.getShowById = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('participants.user', 'fullName email'); 

    if (!show) return res.status(404).json({ message: "Không tìm thấy show" });
    res.json(show);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Đăng ký / Hủy đăng ký
exports.joinShow = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ message: "Không tìm thấy show" });

    // Logic kiểm tra quyền đăng ký
    if (show.status === 'pending') return res.status(400).json({ message: "Show chưa được duyệt, chưa thể đăng ký!" });
    if (show.status === 'completed' || show.status === 'cancelled') return res.status(400).json({ message: "Show đã kết thúc hoặc bị hủy." });
    
    // Nếu đã chốt sổ (isRegistrationClosed = true) thì không cho đăng ký mới
    const isJoined = show.participants.find(p => p.user.toString() === req.user.id);
    if (show.isRegistrationClosed && !isJoined) {
      return res.status(400).json({ message: "Show đã chốt danh sách, không nhận thêm đăng ký." });
    }

    if (isJoined) {
      // Hủy đăng ký
      show.participants = show.participants.filter(p => p.user.toString() !== req.user.id);
      await show.save();
      return res.json({ message: "Đã hủy đăng ký" });
    } else {
      // Đăng ký mới -> Trạng thái luôn là 'pending' (Chờ duyệt)
      show.participants.push({ user: req.user.id, status: 'pending' });
      await show.save();
      return res.json({ message: "Đã gửi yêu cầu tham gia, vui lòng chờ Admin duyệt!" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Duyệt thành viên (Chỉ Admin) -> CÓ GỬI MAIL
exports.approveParticipant = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    const participant = show.participants.find(p => p.user.toString() === req.body.userId);
    
    if (participant) {
      participant.status = 'approved'; // Chuyển sang chính thức
      await show.save();

      // 👇 LOGIC GỬI MAIL: Báo user đã được duyệt
      // Tìm thông tin user để lấy email
      const user = await User.findById(req.body.userId);
      if (user && user.email) {
          sendApproveEmail(user.email, show.title, user.fullName).catch(err => console.error(err));
      }

      res.json({ message: "Đã duyệt thành viên" });
    } else {
      res.status(404).json({ message: "Không tìm thấy thành viên trong danh sách đăng ký" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. Từ chối/Xóa thành viên (Chỉ Admin)
exports.removeParticipant = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    show.participants = show.participants.filter(p => p.user.toString() !== req.body.userId);
    await show.save();
    res.json({ message: "Đã xóa thành viên khỏi show" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 9. Bật/Tắt Chốt sổ đăng ký (Chỉ Admin)
exports.toggleRegistration = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    show.isRegistrationClosed = !show.isRegistrationClosed;
    await show.save();
    res.json({ message: show.isRegistrationClosed ? "Đã chốt sổ đăng ký" : "Đã mở lại đăng ký", isRegistrationClosed: show.isRegistrationClosed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 10. Cập nhật thông tin Show (Sửa tên, giá, ngày...)
exports.updateShow = async (req, res) => {
  try {
    const updatedShow = await Show.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true } 
    );
    if (!updatedShow) return res.status(404).json({ message: "Không tìm thấy show" });
    res.json(updatedShow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 11. Thêm bài hát vào Setlist
exports.addSongToSetlist = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ message: "Không tìm thấy show" });

    const { title, link, note } = req.body;
    
    // Thêm vào mảng setlist
    show.setlist.push({ 
      title, 
      link, 
      note,
      addedBy: req.user.id 
    });

    await show.save();
    await show.populate('setlist.addedBy', 'fullName');
    
    res.json(show.setlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 12. Xóa bài hát khỏi Setlist
exports.removeSongFromSetlist = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    // Lọc bỏ bài hát có _id tương ứng
    show.setlist = show.setlist.filter(item => item._id.toString() !== req.params.songId);
    await show.save();
    res.json(show.setlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};