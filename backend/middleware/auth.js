const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 1. Middleware xác thực đăng nhập (Protect)
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Lấy token
      token = req.headers.authorization.split(' ')[1];

      // 2. Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      // 3. Tìm user trong DB
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'Không tìm thấy người dùng' });
      }

      // 🔥 CHỐT CHẶN: Kiểm tra trạng thái
      if (user.status === 'pending') {
        return res.status(403).json({ message: 'Tài khoản chưa được duyệt! Vui lòng chờ Admin. ⛔' });
      }
      if (user.status === 'banned') {
        return res.status(403).json({ message: 'Tài khoản đã bị KHÓA! 🚫' });
      }

      // 4. Cho qua
      req.user = user;
      next();
    } catch (error) {
      console.error('Lỗi Auth:', error.message);
      res.status(401).json({ message: 'Phiên đăng nhập hết hạn hoặc lỗi Token' });
    }
  } else {
    res.status(401).json({ message: 'Không có quyền truy cập (Thiếu Token)' });
  }
};

// 👇 2. Middleware kiểm tra quyền Admin (CÁI BẠN ĐANG THIẾU)
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // Là Admin thì cho qua
  } else {
    res.status(403).json({ message: 'Chỉ Admin mới có quyền thực hiện thao tác này! 👮‍♂️' });
  }
};