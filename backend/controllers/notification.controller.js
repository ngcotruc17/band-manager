const Notification = require('../models/Notification');
const User = require('../models/User');

// --- HÀM HELPER (ĐỂ CÁC FILE KHÁC GỌI) ---
// 1. Gửi cho 1 người
exports.notifyUser = async ({ recipientId, message, link, type }) => {
  try {
    await Notification.create({ recipient: recipientId, message, link, type });
  } catch (error) { console.error("Lỗi tạo noti:", error); }
};

// 2. Gửi cho TOÀN BỘ MEMBER (Trừ admin)
exports.notifyAllMembers = async ({ message, link, type }) => {
  try {
    const members = await User.find({ role: 'member' });
    const notifications = members.map(u => ({
      recipient: u._id,
      message,
      link,
      type: type || 'info'
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
  } catch (error) { console.error("Lỗi tạo noti hàng loạt:", error); }
};

// 3. Gửi cho ADMIN
exports.notifyAdmin = async ({ message, link, type }) => {
  try {
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map(u => ({
      recipient: u._id,
      message,
      link,
      type: type || 'warning'
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
  } catch (error) { console.error("Lỗi tạo noti admin:", error); }
};


// --- HÀM API (CHO FRONTEND GỌI) ---
exports.getMyNotifications = async (req, res) => {
  try {
    const notis = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(20);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ notifications: notis, unreadCount });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ message: error.message }); }
};