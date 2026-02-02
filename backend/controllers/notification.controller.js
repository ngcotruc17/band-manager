const Notification = require('../models/Notification');

// 1. Tạo thông báo (Dùng nội bộ trong code backend)
exports.notifyAllMembers = async ({ message, link, type }) => {
  const User = require('../models/User');
  const users = await User.find();
  
  const notis = users.map(u => ({
    recipient: u._id,
    sender: 'System',
    message,
    link,
    type: type || 'info'
  }));
  
  await Notification.insertMany(notis);
};

// 2. API: Lấy thông báo của TÔI
exports.getMyNotifications = async (req, res) => {
  try {
    const notis = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }) // Mới nhất lên đầu
      .limit(20); // Lấy 20 cái gần nhất
    res.json(notis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. API: Đánh dấu đã đọc
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    // Tìm tất cả thông báo của User này mà chưa đọc -> Sửa thành Đã đọc
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};