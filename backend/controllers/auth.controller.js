const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Hàm tạo Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || '123456', {
    expiresIn: '30d',
  });
};

// 1. Đăng ký tài khoản
exports.register = async (req, res) => { // 👈 Bỏ tham số 'next' để tránh lỗi
  try {
    const { fullName, email, password } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đủ thông tin" });
    }

    // Kiểm tra trùng email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email này đã được sử dụng" });
    }

    // Tạo user mới
    // (Password sẽ được mã hóa tự động nếu bạn đã làm pre-save hook trong Model User)
    const user = await User.create({
      fullName,
      email,
      password
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id), // Trả về token luôn để tự đăng nhập
      });
    } else {
      res.status(400).json({ message: "Không thể tạo tài khoản" });
    }
  } catch (error) {
    console.error("Lỗi đăng ký:", error.message);
    // 👇 Đây là chỗ fix lỗi "next is not a function": Trả lỗi trực tiếp
    res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

// 2. Admin tạo User
exports.adminCreateUser = async (req, res) => {
  try {
    const { username, fullName, role } = req.body;
    const userExists = await User.findOne({ username });
    if (userExists) return res.status(400).json({ message: 'Tài khoản đã tồn tại' });

    // Mật khẩu mặc định 123456
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123456", salt);
    
    const user = new User({
        username,
        password: hashedPassword,
        fullName,
        role: role || 'member',
        mustChangePassword: true, // Bắt buộc đổi pass
        status: 'active' // Admin tạo thì active luôn
    });
    await user.save();
    res.status(201).json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// 3. Đăng nhập (Phiên bản Fix Lỗi Bcrypt)
exports.login = async (req, res) => {
  console.log("👉 BẮT ĐẦU LOGIN..."); // Dòng này để kiểm tra xem code mới đã chạy chưa

  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    // 👇 CHỖ NÀY SỬA: Gọi trực tiếp require('bcryptjs') để so sánh
    // Không cần quan tâm const bcrypt ở đầu file có hay không nữa
    const isMatch = user && (await require('bcryptjs').compare(password, user.password));

    if (isMatch) {
      if (user.status === 'banned') return res.status(403).json({ message: 'Tài khoản bị khóa' });
      if (user.status === 'pending') return res.status(403).json({ message: 'Tài khoản đang chờ duyệt!' });

      console.log("✅ Login thành công cho user:", user.username);

      res.json({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id), // Đảm bảo hàm generateToken đã khai báo ở trên
        requireChangePassword: user.mustChangePassword 
      });
    } else {
      console.log("❌ Sai mật khẩu hoặc không tìm thấy user");
      res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }
  } catch (error) {
    console.error("🔥 LỖI LOGIN CHI TIẾT:", error); // Nó sẽ hiện lỗi ra Terminal
    res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

// 4. Đổi mật khẩu lần đầu
exports.changePasswordFirstTime = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false; 
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server" });
  }
};