const Show = require('../models/Show');

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
    const show = await Show.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(show);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Lấy chi tiết 1 Show
exports.getShowById = async (req, res) => {
  try {
    // 👇 QUAN TRỌNG: Dòng này biến ID thành thông tin User (Lấy tên và email)
    const show = await Show.findById(req.params.id)
      .populate('participants.user', 'fullName email'); 

    if (!show) return res.status(404).json({ message: "Không tìm thấy show" });
    res.json(show);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Đăng ký / Hủy đăng ký (Logic mới)
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
      // Hủy đăng ký (Rời show)
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

// 7. Duyệt thành viên (Chỉ Admin)
exports.approveParticipant = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    const participant = show.participants.find(p => p.user.toString() === req.body.userId);
    
    if (participant) {
      participant.status = 'approved'; // Chuyển sang chính thức
      await show.save();
      res.json({ message: "Đã duyệt thành viên" });
    } else {
      res.status(404).json({ message: "Không tìm thấy thành viên" });
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