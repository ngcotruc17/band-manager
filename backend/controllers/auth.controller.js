const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { notifyAdmins } = require('./notification.controller'); // 👈 Thêm dòng này

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || '123456', { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    const { fullName, username, password, email, phone } = req.body;
    if (!fullName || !username || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đủ: Họ tên, Username, Mật khẩu" });
    }
    const query = [{ username }];
    if (email) query.push({ email });
    const userExists = await User.findOne({ $or: query });
    if (userExists) return res.status(400).json({ message: "Tên đăng nhập hoặc Email đã tồn tại!" });

    const user = await User.create({
      fullName, username, email: email || undefined, phone: phone || "", password 
    });
    
    if (user) {
      // 👇 GỬI THÔNG BÁO CHO ADMIN
      await notifyAdmins({ 
        message: `👤 Thành viên mới đăng ký: ${fullName}. Đang chờ bạn duyệt!`, 
        link: '/members',
        type: 'warning'
      });

      res.status(201).json({
        _id: user.id, fullName: user.fullName, username: user.username,
        email: user.email, role: user.role, token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }
  } catch (error) { res.status(500).json({ message: "Lỗi Server: " + error.message }); }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ $or: [{ username: username }, { email: username }] });
    if (!user) return res.status(400).json({ message: "Sai thông tin" });
    if (!user.isApproved && user.role !== 'admin') return res.status(403).json({ message: "Tài khoản chưa được duyệt!" });
    const isMatch = await user.matchPassword(password); 
    if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu" });
    res.json({ _id: user._id, username: user.username, fullName: user.fullName, role: user.role, token: generateToken(user._id), mustChangePassword: user.mustChangePassword });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.adminCreateUser = async (req, res) => {
  try {
    const { fullName, email, role, instrument } = req.body; 
    const username = email.split('@')[0];
    const user = new User({ username, email, password: "123456", fullName, role: role || 'member', instrument: instrument || 'Chưa phân công', mustChangePassword: true, status: 'active', isApproved: true });
    await user.save();
    res.status(201).json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.changePasswordFirstTime = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.user.id);
    user.password = newPassword; user.mustChangePassword = false; 
    await user.save();
    res.json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) { res.status(500).json({ message: "Lỗi Server" }); }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    user.password = "123456"; user.mustChangePassword = true; user.isApproved = true; 
    await user.save(); 
    res.json({ message: `Đã reset mật khẩu của ${user.fullName}` });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    // 👇 THÔNG BÁO CHO USER RẰNG HỌ ĐÃ ĐƯỢC DUYỆT
    const { notifyUser } = require('./notification.controller');
    await notifyUser(user._id, { message: "🎉 Chúc mừng! Tài khoản của bạn đã được duyệt. Hãy bắt đầu thôi!", type: 'success' });
    res.json({ message: `Đã duyệt thành viên: ${user.fullName}` });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa thành viên" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};