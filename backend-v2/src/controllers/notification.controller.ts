import { Response } from 'express';
import Notification from '../models/Notification';
import User from '../models/User';
import { sendCustomAdminEmail } from '../utils/sendEmail';
import { AuthenticatedRequest } from '../middleware/auth';

export const getMyNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa xác thực" });
      return;
    }
    const notis = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notis);
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const markAllRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa xác thực" });
      return;
    }
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'Đã đọc hết' });
  } catch (error: any) { 
    res.status(500).json({ message: error.message }); 
  }
};

export const sendCustomNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, content, recipientType } = req.body;
    if (!title || !content || !recipientType) {
      res.status(400).json({ message: "Vui lòng điền đủ: Tiêu đề, Nội dung, Đối tượng nhận" });
      return;
    }

    let recipients: any[] = [];
    let recipientEmails: string[] = [];

    if (recipientType === 'all') {
      const users = await User.find({ isApproved: true });
      recipients = users;
      recipientEmails = users.map(u => u.email).filter(email => email && email.includes('@')) as string[];
    } else {
      const user = await User.findById(recipientType);
      if (!user) {
        res.status(404).json({ message: "Không tìm thấy thành viên nhận thông báo" });
        return;
      }
      recipients = [user];
      if (user.email && user.email.includes('@')) {
        recipientEmails = [user.email];
      }
    }

    if (recipients.length === 0) {
      res.status(400).json({ message: "Không tìm thấy người nhận hợp lệ" });
      return;
    }

    const plainTextContent = content.replace(/<[^>]*>/g, '');
    const senderName = req.user ? req.user.fullName : 'Ban Quản Trị';
    const notis = recipients.map(u => ({
      recipient: u._id,
      sender: senderName,
      message: `📢 [Thông báo]: ${title} - ${plainTextContent.substring(0, 80)}${plainTextContent.length > 80 ? '...' : ''}`,
      link: '#',
      type: 'info'
    }));
    await Notification.insertMany(notis);

    if (recipientEmails.length > 0) {
      sendCustomAdminEmail(title, content, recipientEmails).catch(err => console.error("Lỗi gửi mail tùy chỉnh:", err));
    }

    res.json({ message: "Đã gửi thông báo thành công!" });
  } catch (error: any) {
    console.error("Lỗi gửi thông báo tùy chỉnh:", error);
    res.status(500).json({ message: error.message });
  }
};
