const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Lấy token
      token = req.headers.authorization.split(' ')[1];

      // 2. Giải mã
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '123456');

      // 3. Tìm user
      // Lưu ý: Select trừ password ra để nhẹ gánh
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: "Không tìm thấy người dùng" });
      }

      // 4. KIỂM TRA DUYỆT (Logic chuẩn)
      // Nếu chưa duyệt (false hoặc undefined) VÀ không phải admin -> CHẶN
      if (!req.user.isApproved && req.user.role !== 'admin') {
         return res.status(403).json({ message: "Tài khoản chưa được duyệt hoặc đang bị khóa." });
      }

      // ⚠️ QUAN TRỌNG: Không được chặn mustChangePassword ở đây!
      // Nếu chặn thì làm sao người ta gọi API để đổi mật khẩu được?
      
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Token không hợp lệ, vui lòng đăng nhập lại" });
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