const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Hàm tạo Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || '123456', {
    expiresIn: '30d',
  });
};

// 1. Đăng ký (Phiên bản "Bắt Dính" mọi trường hợp)
exports.register = async (req, res) => {
  try {
    console.log("👉 Dữ liệu Register nhận được:", req.body); // In ra để debug nếu lỗi

    // 1. BẮT DÍNH DỮ LIỆU (Chấp nhận nhiều kiểu tên biến từ Frontend)
    // Frontend gửi fullName, fullname hay name đều nhận được hết
    const fullName = req.body.fullName || req.body.fullname || req.body.name;
    
    // Frontend gửi username, user, hay lỡ nhập username vào ô email... bắt hết!
    let username = req.body.username || req.body.user || req.body.email;
    let email = req.body.email;
    const password = req.body.password || req.body.pass;

    // 2. XỬ LÝ LOGIC THÔNG MINH
    // Nếu dữ liệu ở ô 'email' không phải là email thật (vd: "nct") -> Coi nó là username
    if (email && !email.includes('@')) {
        username = email; 
        email = undefined; // Xóa email đi để không bị lỗi định dạng
    }
    // Nếu có email thật mà chưa có username -> Tự tạo username từ email
    if (email && !username) {
        username = email.split('@')[0];
    }

    // 3. KIỂM TRA ĐẦU VÀO (Chỉ cần Tên + Pass + (Username HOẶC Email))
    if (!fullName || (!username && !email) || !password) {
      console.log("❌ Thiếu thông tin quan trọng:", { fullName, username, email });
      return res.status(400).json({ message: "Vui lòng nhập đủ thông tin (Tên, Tài khoản, Mật khẩu)" });
    }

    // 4. Check trùng (Tìm trong cả username và email)
    const query = [];
    if (username) query.push({ username });
    if (email) query.push({ email });
    
    const userExists = await User.findOne({ $or: query });

    if (userExists) {
      return res.status(400).json({ message: "Tài khoản hoặc Email đã tồn tại!" });
    }

    // 5. Tạo User
    const user = await User.create({
      fullName,
      username,
      email, // Có thể null (nếu đăng ký bằng username)
      password 
    });
    
    // Trả về kết quả
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
     console.error("🔥 Lỗi Đăng Ký:", error);
     res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

// 2. Đăng nhập (Login)
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

// 3. Admin tạo User
exports.adminCreateUser = async (req, res) => {
  try {
    const { fullName, email, role, instrument } = req.body; 
    
    // Logic tạo user của admin
    // Nếu không nhập email thì lấy tạm username + @fake.com để không lỗi (hoặc sửa model cho phép null)
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

// 6. Lấy danh sách tất cả User (Cho trang Quản lý nhân sự)
exports.getAllUsers = async (req, res) => {
  try {
    // Lấy tất cả user trừ password, sắp xếp người mới nhất lên đầu
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Admin Reset mật khẩu thành viên (Về mặc định 123456)
exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) return res.status(404).json({ message: "Không tìm thấy user này" });

    // Đặt lại mật khẩu mặc định
    user.password = "123456"; 
    
    // 👇 QUAN TRỌNG: Bật cờ này lên để khi login nó bắt đổi pass ngay
    user.mustChangePassword = true; 

    await user.save(); // Model sẽ tự động mã hóa password "123456"

    res.json({ message: `Đã reset mật khẩu của ${user.fullName} về 123456 thành công!` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 8. Duyệt thành viên (Approve)
exports.approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json({ message: `Đã duyệt thành viên: ${user.fullName}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 9. Xóa thành viên
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });
    res.json({ message: "Đã xóa thành viên khỏi hệ thống" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};