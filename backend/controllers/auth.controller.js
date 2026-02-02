const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Hàm tạo Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || '123456', {
    expiresIn: '30d',
  });
};

// 1. Đăng ký (Register)
exports.register = async (req, res) => {
  try {
    let { fullName, email, username, password } = req.body;

    // Nếu người dùng nhập username vào ô email (hoặc ngược lại)
    if (!email && username) {
        email = username; 
    }

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đủ thông tin" });
    }

    // Tự động tạo username nếu chưa có
    if (!username) {
        username = email.includes('@') ? email.split('@')[0] : email;
    }

    // Check trùng
    const userExists = await User.findOne({ 
        $or: [{ email: email }, { username: username }] 
    });
    
    if (userExists) {
      return res.status(400).json({ message: "Tài khoản hoặc Email đã tồn tại" });
    }

    // Tạo User (Model sẽ tự mã hóa password)
    const user = await User.create({
      fullName,
      email,     
      username,
      password 
    });
    
    if (user) {
      res.status(201).json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }

  } catch (error) {
     console.error("Lỗi đăng ký:", error);
     res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

// 2. Đăng nhập (Login) - CÁI BẠN ĐANG THIẾU
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Tìm user bằng email HOẶC username
    const user = await User.findOne({
        $or: [
            { email: username }, 
            { username: username }
        ]
    });

    // Kiểm tra password
    if (user && (await user.matchPassword(password))) {
      
      if (user.status === 'banned') return res.status(403).json({ message: 'Tài khoản bị khóa' });
      if (user.status === 'pending') return res.status(403).json({ message: 'Tài khoản chưa được duyệt!' });

      res.json({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        requireChangePassword: user.mustChangePassword 
      });
    } else {
      res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
    }
  } catch (error) {
    console.error("Lỗi Login:", error);
    res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

// 3. Admin tạo User - CÁI BẠN ĐANG THIẾU
exports.adminCreateUser = async (req, res) => {
  try {
    const { fullName, email, role, instrument } = req.body; 

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email đã tồn tại' });

    const username = email.split('@')[0];

    // Password mặc định 123456
    const user = new User({
        username,
        email,
        password: "123456", 
        fullName,
        role: role || 'member',
        instrument: instrument || 'Chưa phân công',
        mustChangePassword: true,
        status: 'active'
    });

    await user.save();
    res.status(201).json(user);
  } catch (e) { 
      res.status(500).json({ message: e.message }); 
  }
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Lấy thông tin bản thân (Get Me)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server" });
  }
};