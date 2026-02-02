const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Hàm tạo Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || '123456', {
    expiresIn: '30d',
  });
};

// 1. Đăng ký
exports.register = async (req, res) => {
  try {
    const fullName = req.body.fullName || req.body.fullname || req.body.name;
    let username = req.body.username || req.body.user || req.body.email;
    let email = req.body.email;
    const password = req.body.password || req.body.pass;

    if (email && !email.includes('@')) {
        username = email; 
        email = undefined; 
    }
    if (email && !username) {
        username = email.split('@')[0];
    }

    if (!fullName || (!username && !email) || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đủ thông tin" });
    }

    const query = [];
    if (username) query.push({ username });
    if (email) query.push({ email });
    
    const userExists = await User.findOne({ $or: query });
    if (userExists) {
      return res.status(400).json({ message: "Tài khoản hoặc Email đã tồn tại!" });
    }

    const user = await User.create({
      fullName,
      username,
      email, 
      password 
    });
    
    if (user) {
      res.status(201).json({
        _id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

  } catch (error) {
     res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

// 2. Đăng Nhập (ĐÃ FIX LỖI LOGIC DUYỆT)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body; 

    const user = await User.findOne({
       $or: [{ username: username }, { email: username }]
    });

    if (!user) return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });

    // 👇 SỬA LẠI CHỖ NÀY: Dùng dấu ! để bắt cả undefined
    if (!user.isApproved && user.role !== 'admin') {
        return res.status(403).json({ message: "Tài khoản chưa được duyệt! Vui lòng liên hệ Admin." });
    }

    // const isMatch = await bcrypt.compare(password, user.password); 
    const isMatch = await user.matchPassword(password); 

    if (!isMatch) return res.status(400).json({ message: "Sai tên đăng nhập hoặc mật khẩu" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      token,
      requireChangePassword: user.mustChangePassword 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Admin tạo User
exports.adminCreateUser = async (req, res) => {
  try {
    const { fullName, email, role, instrument } = req.body; 
    
    if (!email) return res.status(400).json({ message: 'Vui lòng nhập Email' });
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email đã tồn tại' });

    const username = email.split('@')[0];
    const user = new User({
        username,
        email,
        password: "123456", 
        fullName,
        role: role || 'member',
        instrument: instrument || 'Chưa phân công',
        mustChangePassword: true,
        status: 'active',
        isApproved: true // Admin tạo thì duyệt luôn
    });

    await user.save();
    res.status(201).json(user);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// 4. Đổi mật khẩu lần đầu
exports.changePasswordFirstTime = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    user.password = newPassword; 
    user.mustChangePassword = false; 
    await user.save();
    res.json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 5. Get Me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json(user);
  } catch (error) { res.status(500).json({ message: "Lỗi Server" }); }
};

// 6. Lấy danh sách tất cả User
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 7. Admin Reset mật khẩu (FIX LỖI MẤT DUYỆT)
exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user này" });

    user.password = "123456"; 
    user.mustChangePassword = true; 
    user.isApproved = true; // 👇 Đảm bảo luôn duyệt khi reset

    await user.save(); 
    res.json({ message: `Đã reset mật khẩu của ${user.fullName} về 123456 thành công!` });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 8. Duyệt thành viên
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json({ message: `Đã duyệt thành viên: ${user.fullName}` });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 9. Xóa thành viên
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json({ message: "Đã xóa thành viên khỏi hệ thống" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};