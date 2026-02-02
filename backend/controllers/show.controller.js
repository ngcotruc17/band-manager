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