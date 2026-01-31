const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Hàm tạo Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

// 1. ĐĂNG KÝ
exports.register = async (req, res) => {
  const { fullName, username, password } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại ❌' });

    const user = await User.create({ fullName, username, password }); 

    if (user) {
      res.status(201).json({ message: "Đăng ký thành công! Vui lòng chờ Admin duyệt. ⏳" });
    } else {
      res.status(400).json({ message: 'Dữ liệu lỗi' });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 2. ĐĂNG NHẬP
exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user && (await user.matchPassword(password))) {
      
      if (user.status === 'pending') return res.status(403).json({ message: 'Tài khoản đang chờ duyệt! ⏳' });
      if (user.status === 'banned') return res.status(403).json({ message: 'Tài khoản bị KHÓA! 🚫' });

      res.json({
        _id: user._id,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Sai thông tin đăng nhập ❌' });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. LẤY THÔNG TIN (GET ME)
exports.getMe = async (req, res) => {
  // req.user có được nhờ middleware protect
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
};

// 4. 🔥 CỨU HỘ ADMIN (Reset mật khẩu) 🔥
exports.rescueAdmin = async (req, res) => {
  try {
    let admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      admin = new User({ username: 'admin', fullName: 'Super Admin', password: '123456' });
    } else {
      admin.password = '123456'; 
    }
    admin.role = 'admin';
    admin.status = 'active'; 
    await admin.save();
    
    res.send("✅ ĐÃ CỨU HỘ THÀNH CÔNG! <br> Tài khoản: <b>admin</b> <br> Mật khẩu: <b>123456</b>");
  } catch (error) {
    res.status(500).send("Lỗi cứu hộ: " + error.message);
  }
};