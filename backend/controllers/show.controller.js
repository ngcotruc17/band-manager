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

// 5. Lấy chi tiết 1 Show (Đã thêm populate để hiện tên người tham gia)
exports.getShowById = async (req, res) => {
  try {
    // 👇 QUAN TRỌNG: Thêm .populate() để lấy thông tin user từ ID
    const show = await Show.findById(req.params.id)
      .populate('participants.user', 'fullName email'); 

    if (!show) return res.status(404).json({ message: "Không tìm thấy show" });
    res.json(show);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Đăng ký / Hủy đăng ký Show
exports.joinShow = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) return res.status(404).json({ message: "Không tìm thấy show" });

    // Kiểm tra đã đăng ký chưa
    const isJoined = show.participants.find(p => p.user.toString() === req.user.id);
    
    if (isJoined) {
      // Có rồi -> Xóa (Hủy)
      show.participants = show.participants.filter(p => p.user.toString() !== req.user.id);
      await show.save();
      return res.json({ message: "Đã hủy đăng ký" });
    } else {
      // Chưa -> Thêm vào
      show.participants.push({ user: req.user.id });
      await show.save();
      return res.json({ message: "Đăng ký thành công" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};