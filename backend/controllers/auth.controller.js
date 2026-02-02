const User = require('../models/User');
const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs'); // Không cần import ở đây nếu Model đã tự xử lý

// Hàm tạo Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || '123456', {
    expiresIn: '30d',
  });
};

// 1. Đăng ký tài khoản (Người dùng tự đăng ký)
exports.register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đủ thông tin" });
    }

    // Check trùng email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email này đã được sử dụng" });
    }

    // Tạo username từ email (ví dụ: nct@gmail.com -> nct)
    // Thêm số ngẫu nhiên để tránh trùng (nct123)
    let baseUsername = email.split('@')[0];
    let username = baseUsername;
    let counter = 1;
    
    // Vòng lặp kiểm tra nếu username đã tồn tại thì thêm số
    while (await User.findOne({ username })) {
        username = baseUsername + counter;
        counter++;
    }

    // 👇 CHỈ CẦN TRUYỀN PASSWORD GỐC, MODEL SẼ TỰ MÃ HÓA
    const user = await User.create({
      fullName,
      email,
      username,
      password 
    });
    
    // 👇 PHẦN QUAN TRỌNG BẠN ĐANG THIẾU: TRẢ VỀ DỮ LIỆU
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

// 2. Admin tạo User (Thêm nhạc công/thành viên)
exports.adminCreateUser = async (req, res) => {
  try {
    // 👇 Admin phải nhập thêm Email cho user đó
    const { fullName, email, role, instrument } = req.body; 

    // Kiểm tra trùng email
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email đã tồn tại' });

    // Tạo username tự động từ email
    const username = email.split('@')[0];

    // 👇 KHÔNG DÙNG BCRYPT Ở ĐÂY. Để Model tự làm.
    // Mật khẩu mặc định là "123456"
    const user = new User({
        username,
        email,
        password: "123456", // Model sẽ tự mã hóa thành $2a$10$....
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

// 3. Đăng nhập
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body; // username ở đây có thể là email hoặc tên đăng nhập

    // 👇 Tìm kiếm linh hoạt: Cho phép nhập Email HOẶC Username để login
    const user = await User.findOne({
        $or: [
            { email: username }, 
            { username: username }
        ]
    });

    // Kiểm tra pass bằng hàm của Model (Tránh lỗi import bcrypt loằng ngoằng)
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
    res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

// 4. Đổi mật khẩu lần đầu
exports.changePasswordFirstTime = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.user.id); // req.user lấy từ middleware protect

    if (!user) return res.status(404).json({ message: "User không tồn tại" });

    // 👇 CHỈ GÁN PASSWORD MỚI, KHÔNG MÃ HÓA THỦ CÔNG
    user.password = newPassword; // Model pre('save') sẽ tự mã hóa
    user.mustChangePassword = false; 
    
    await user.save(); // Lúc này pre('save') sẽ chạy

    res.json({ message: "Đổi mật khẩu thành công!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Get Me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server" });
  }
};