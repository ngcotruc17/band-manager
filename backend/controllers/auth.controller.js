const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Hàm tạo Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

// 1. Sửa hàm REGISTER (User tự đăng ký)
exports.register = async (req, res) => {
  try {
    const { username, password, fullName } = req.body;
    // ... validation ...
    const user = new User({
        username, 
        password: bcrypt.hashSync(password, 10),
        fullName,
        mustChangePassword: false // 👈 Tự tạo thì không cần đổi
    });
    await user.save();
    res.status(201).json({ message: 'Tạo tài khoản thành công' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// 2. Hàm ADMIN TẠO USER (Thêm hàm này nếu bạn chưa có, hoặc sửa hàm cũ)
exports.adminCreateUser = async (req, res) => {
  try {
    const { username, fullName, role } = req.body;
    // Mật khẩu mặc định 123456
    const defaultPassword = bcrypt.hashSync("123456", 10);
    
    const user = new User({
        username,
        password: defaultPassword,
        fullName,
        role: role || 'member',
        mustChangePassword: true // 👈 QUAN TRỌNG: Admin tạo thì bắt buộc đổi
    });
    await user.save();
    res.status(201).json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// 3. Sửa hàm LOGIN (Để báo hiệu cho Frontend)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.status === 'banned') return res.status(403).json({ message: 'Tài khoản bị khóa' });

      // 👇 Trả về thêm cờ requireChangePassword
      res.json({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id),
        requireChangePassword: user.mustChangePassword // 👈 Gửi cờ này về
      });
    } else {
      res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Thêm hàm ĐỔI MẬT KHẨU LẦN ĐẦU
exports.changePasswordFirstTime = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    // Cập nhật mật khẩu mới & Tắt cờ bắt buộc đổi
    user.password = bcrypt.hashSync(newPassword, 10);
    user.mustChangePassword = false; // ✅ Đã đổi xong
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công! Hãy tận hưởng." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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