const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '123456');

      // Lấy user, bỏ qua password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: "Không tìm thấy người dùng" });
      }

      // 👇 LOGIC QUAN TRỌNG: Dùng dấu ! để bắt cả trường hợp undefined (user cũ)
      // Nếu chưa duyệt VÀ không phải admin -> CHẶN
      if (!req.user.isApproved && req.user.role !== 'admin') {
         return res.status(403).json({ message: "Tài khoản chưa được duyệt." });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Token không hợp lệ" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Bạn chưa đăng nhập" });
  }
};

// Middleware Admin (Giữ nguyên)
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Chỉ Admin mới có quyền này" });
  }
};