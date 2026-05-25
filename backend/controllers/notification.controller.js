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

// 6. Admin gửi thông báo tùy chỉnh lên Navbar + Email
exports.sendCustomNotification = async (req, res) => {
  try {
    const { title, content, recipientType } = req.body;
    if (!title || !content || !recipientType) {
      return res.status(400).json({ message: "Vui lòng điền đủ: Tiêu đề, Nội dung, Đối tượng nhận" });
    }

    const { sendCustomAdminEmail } = require('../utils/sendEmail');
    let recipients = [];
    let recipientEmails = [];

    if (recipientType === 'all') {
      const users = await User.find({ isApproved: true });
      recipients = users;
      recipientEmails = users.map(u => u.email).filter(email => email && email.includes('@'));
    } else {
      const user = await User.findById(recipientType);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy thành viên nhận thông báo" });
      }
      recipients = [user];
      if (user.email && user.email.includes('@')) {
        recipientEmails = [user.email];
      }
    }

    if (recipients.length === 0) {
      return res.status(400).json({ message: "Không tìm thấy người nhận hợp lệ" });
    }

    const plainTextContent = content.replace(/<[^>]*>/g, '');
    const notis = recipients.map(u => ({
      recipient: u._id,
      sender: req.user.fullName || 'Ban Quản Trị',
      message: `📢 [Thông báo]: ${title} - ${plainTextContent.substring(0, 80)}${plainTextContent.length > 80 ? '...' : ''}`,
      link: '#', // Có thể để rỗng hoặc dẫn tới nơi phù hợp
      type: 'info'
    }));
    await Notification.insertMany(notis);

    if (recipientEmails.length > 0) {
      sendCustomAdminEmail(title, content, recipientEmails).catch(err => console.error("Lỗi gửi mail tùy chỉnh:", err));
    }

    res.json({ message: "Đã gửi thông báo thành công!" });
  } catch (error) {
    console.error("Lỗi gửi thông báo tùy chỉnh:", error);
    res.status(500).json({ message: error.message });
  }
};