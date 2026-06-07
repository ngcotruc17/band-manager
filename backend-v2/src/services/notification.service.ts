import Notification from '../models/Notification';
import User from '../models/User';
import { SocketService } from './socket.service';
import mongoose from 'mongoose';

interface NotificationParams {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  sender?: string;
}

export class NotificationService {
  // 1. Gửi thông báo cho 1 user cụ thể
  public static async notifyUser(userId: string | mongoose.Types.ObjectId, params: NotificationParams): Promise<void> {
    try {
      const noti = new Notification({
        recipient: userId,
        sender: params.sender || 'Hệ thống',
        message: params.message,
        link: params.link || '',
        type: params.type || 'info'
      });
      await noti.save();

      // Đẩy tin nhắn qua Socket.io trực tiếp đến thiết bị người dùng (nếu đang online)
      // Mọi user khi đăng nhập sẽ tự động lắng nghe tin nhắn cá nhân bằng cách join vào room `user_[userId]`
      SocketService.broadcast(`notification:${userId}`, {
        _id: noti._id,
        message: noti.message,
        link: noti.link,
        type: noti.type,
        createdAt: noti.createdAt
      });
    } catch (err) {
      console.error("Lỗi gửi thông báo cá nhân:", err);
    }
  }

  // 2. Gửi thông báo cho tất cả Admin
  public static async notifyAdmins(params: NotificationParams): Promise<void> {
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await this.notifyUser(admin._id.toString(), { ...params, sender: params.sender || 'Hệ thống' });
      }
    } catch (err) {
      console.error("Lỗi gửi thông báo cho admins:", err);
    }
  }

  // 3. Gửi thông báo cho toàn bộ thành viên ban nhạc
  public static async notifyAllMembers(params: NotificationParams): Promise<void> {
    try {
      const members = await User.find({ isApproved: true });
      for (const member of members) {
        await this.notifyUser(member._id.toString(), { ...params, sender: params.sender || 'Hệ thống' });
      }
    } catch (err) {
      console.error("Lỗi gửi thông báo cho toàn ban nhạc:", err);
    }
  }
}
