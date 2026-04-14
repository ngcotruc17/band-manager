const Notification = require('../models/Notification');
const User = require('../models/User');

// 1. Thông báo cho TOÀN BỘ thành viên
exports.notifyAllMembers = async ({ message, link, type }) => {
  try {
    const users = await User.find({ isApproved: true });
    const notis = users.map(u => ({
      recipient: u._id,
      message,
      link,
      type: type || 'info'
    }));
    await Notification.insertMany(notis);
  } catch (e) { console.error("Lỗi gửi thông báo tổng:", e); }
};

// 2. Thông báo cho TẤT CẢ ADMIN
exports.notifyAdmins = async ({ message, link, type }) => {
  try {
    const admins = await User.find({ role: 'admin' });
    const notis = admins.map(a => ({
      recipient: a._id,
      message,
      link,
      type: type || 'warning'
    }));
    await Notification.insertMany(notis);
  } catch (e) { console.error("Lỗi gửi thông báo admin:", e); }
};

// 3. Thông báo cho 1 USER cụ thể
exports.notifyUser = async (userId, { message, link, type }) => {
  try {
    await Notification.create({
      recipient: userId,
      message,
      link,
      type: type || 'success'
    });
  } catch (e) { console.error("Lỗi gửi thông báo cá nhân:", e); }
};

// 4. API: Lấy thông báo của TÔI
exports.getMyNotifications = async (req, res) => {
  try {
    const notis = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notis);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 5. API: Đánh dấu đã đọc
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'Đã đọc hết' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};