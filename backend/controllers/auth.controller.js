const User = require('../models/User');
const jwt = require('jsonwebtoken');

// --- HÀM ĐĂNG KÝ ---
exports.register = async (req, res) => {
  try {
    const { username, password, fullName } = req.body; 

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const user = await User.create({ 
      username, 
      password, 
      fullName 
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role, // Trả về role
        message: "Đăng ký thành công"
      });
    } else {
      res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- HÀM ĐĂNG NHẬP ---
exports.login = async (req, res) => {
  try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });

      if (user && (user.matchPassword ? await user.matchPassword(password) : user.password === password)) {
          res.json({
              _id: user._id,
              username: user.username,
              fullName: user.fullName,
              role: user.role, // <--- QUAN TRỌNG: Gửi role về cho web biết
              token: generateToken(user._id),
          });
      } else {
          res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
      }
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};