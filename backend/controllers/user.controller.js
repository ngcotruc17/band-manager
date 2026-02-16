const User = require('../models/User');

// Cập nhật hồ sơ cá nhân
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Cập nhật các trường thông tin (giữ nguyên cũ nếu không gửi lên)
    user.fullName = req.body.fullName || user.fullName;
    user.phone = req.body.phone || user.phone;
    user.instrument = req.body.instrument || user.instrument;

    // Riêng Email phải kiểm tra trùng nếu người dùng thay đổi
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ message: "Email này đã được sử dụng bởi tài khoản khác." });
      }
      user.email = req.body.email;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      instrument: updatedUser.instrument,
      token: req.headers.authorization.split(" ")[1] // Trả lại token để client dùng tiếp
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};