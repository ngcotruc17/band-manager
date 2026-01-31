const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 1. Lấy token
      token = req.headers.authorization.split(' ')[1];

      // 2. Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      // 3. Tìm user trong DB (để check trạng thái mới nhất)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'Không tìm thấy người dùng' });
      }

      // 🔥 CHỐT CHẶN TUYỆT ĐỐI 🔥
      // Nếu trạng thái là pending hoặc banned -> CHẶN NGAY LẬP TỨC
      if (user.status === 'pending') {
        return res.status(403).json({ message: 'Tài khoản chưa được duyệt! Vui lòng chờ Admin. ⛔' });
      }
      if (user.status === 'banned') {
        return res.status(403).json({ message: 'Tài khoản đã bị KHÓA! 🚫' });
      }

      // 4. Nếu active thì cho qua
      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Phiên đăng nhập hết hạn hoặc lỗi Token' });
    }
  } else {
    res.status(401).json({ message: 'Không có quyền truy cập' });
  }
};