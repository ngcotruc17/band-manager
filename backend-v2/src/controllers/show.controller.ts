import { Response } from 'express';
import Show from '../models/Show';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { sendNewShowEmail, sendApproveEmail, sendSalarySplitEmail } from '../utils/sendEmail';
import { NotificationService } from '../services/notification.service';
import { AuthenticatedRequest } from '../middleware/auth';

export const getShows = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const shows = await Show.find().sort({ date: 1 });
    res.json(shows);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createShow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const newShow = new Show({ ...req.body, createdBy: req.user?._id });
    await newShow.save();
    res.status(201).json(newShow);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteShow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await Show.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa show" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateShowStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const oldShow = await Show.findById(req.params.id).populate('participants.user');
    if (!oldShow) {
      res.status(404).json({ message: "Không tìm thấy Show" });
      return;
    }

    // Luôn xóa các giao dịch tài chính cũ liên quan đến show này để tránh bị lặp
    await Transaction.deleteMany({ showId: req.params.id });

    let salarySplit = {
      totalPrice: 0,
      bandFundPercent: 5,
      bandFundAmount: 0,
      memberAmount: 0,
      members: [] as Array<{ user: any; amount: number }>
    };

    if (status === 'completed') {
      const approvedParticipants = oldShow.participants.filter(p => p.status === 'approved');
      const N = approvedParticipants.length;
      const totalPrice = oldShow.price || 0;
      const bandFundPercent = 5;
      const bandFundAmount = Math.round(totalPrice * (bandFundPercent / 100));
      const remainingAmount = totalPrice - bandFundAmount;
      const memberAmount = N > 0 ? Math.round(remainingAmount / N) : 0;

      salarySplit = {
        totalPrice,
        bandFundPercent,
        bandFundAmount,
        memberAmount,
        members: approvedParticipants.map(p => ({
          user: (p.user as any)._id,
          amount: memberAmount
        }))
      };

      // Tạo các bản ghi giao dịch
      if (totalPrice > 0 && req.user) {
        // 1. Giao dịch thu nhập (Tổng tiền show)
        const incomeTrans = new Transaction({
          title: `Doanh thu Show: ${oldShow.title}`,
          amount: totalPrice,
          type: 'income',
          category: 'show',
          showId: oldShow._id,
          performedBy: req.user._id
        });
        await incomeTrans.save();

        // 2. Chi cát-xê cho từng thành viên tham gia
        for (const p of approvedParticipants) {
          if (memberAmount > 0 && p.user) {
            const expenseTrans = new Transaction({
              title: `Cát-xê ${(p.user as any).fullName || 'Thành viên'} - Show: ${oldShow.title}`,
              amount: -memberAmount,
              type: 'expense',
              category: 'show',
              showId: oldShow._id,
              performedBy: (p.user as any)._id
            });
            await expenseTrans.save();
          }
        }
      }
    }

    const updatedShow = await Show.findByIdAndUpdate(
      req.params.id, 
      { status, salarySplit }, 
      { new: true }
    ).populate('participants.user', 'fullName email');

    if (!updatedShow) {
      res.status(404).json({ message: "Không tìm thấy Show để cập nhật" });
      return;
    }

    // GỬI THÔNG BÁO CHO CẢ BAND KHI ADMIN DUYỆT SHOW
    if (oldShow.status === 'pending' && status === 'confirmed') {
      sendNewShowEmail(updatedShow).catch(err => console.error(err));
      await NotificationService.notifyAllMembers({ 
        message: `🎸 SHOW MỚI: "${updatedShow.title}" đã mở đăng ký. Tham gia ngay!`, 
        link: `/bookings/${updatedShow._id}`,
        type: 'info'
      });
    }

    // GỬI THÔNG BÁO KHI SHOW HOÀN THÀNH VÀ CHIA CÁT-XÊ
    if (status === 'completed' && updatedShow.price > 0) {
      await NotificationService.notifyAllMembers({
        message: `🎉 SHOW HOÀN THÀNH: "${updatedShow.title}" đã được thanh toán & chia cát-xê!`,
        link: `/bookings/${updatedShow._id}`,
        type: 'success'
      });
      sendSalarySplitEmail(updatedShow).catch(err => console.error("Lỗi gửi mail chia cát-xê:", err));
    }

    res.json(updatedShow);
  } catch (error: any) { 
    console.error("Lỗi trong updateShowStatus:", error);
    res.status(500).json({ message: error.message }); 
  }
};

export const getShowById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const show = await Show.findById(req.params.id).populate('participants.user', 'fullName email username role instrument');
    if (!show) {
      res.status(404).json({ message: "Không tìm thấy Show" });
      return;
    }
    res.json(show);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const joinShow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Chưa xác thực" });
      return;
    }
    const show = await Show.findById(req.params.id);
    if (!show) {
      res.status(404).json({ message: "Không tìm thấy Show" });
      return;
    }

    const isJoined = show.participants.find(p => p.user.toString() === req.user?._id.toString());
    if (isJoined) {
      show.participants = show.participants.filter(p => p.user.toString() !== req.user?._id.toString()) as any;
      await show.save();
      res.json({ message: "Đã hủy đăng ký" });
    } else {
      show.participants.push({ 
        user: req.user._id, 
        status: 'pending', 
        role: req.user.instrument || 'Thành viên',
        joinedAt: new Date()
      } as any);
      await show.save();
      
      await NotificationService.notifyAdmins({ 
        message: `🙋 ${req.user.fullName} vừa đăng ký tham gia show: ${show.title}`, 
        link: `/bookings/${show._id}`,
        type: 'info'
      });
      res.json({ message: "Đã đăng ký tham gia, vui lòng chờ Admin duyệt!" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const approveParticipant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      res.status(404).json({ message: "Không tìm thấy Show" });
      return;
    }

    const participant = show.participants.find(p => p.user.toString() === req.body.userId);
    if (participant) {
      participant.status = 'approved'; 
      await show.save();
      const user = await User.findById(req.body.userId);
      if (user && user.email) {
        sendApproveEmail(user.email, show.title, user.fullName).catch(err => console.error(err));
      }
      
      if (user) {
        await NotificationService.notifyUser(user._id.toString(), { 
          message: `✅ Bạn đã được duyệt vào đội hình chính thức cho show: ${show.title}!`, 
          link: `/bookings/${show._id}`,
          type: 'success'
        });
      }

      res.json({ message: "Đã duyệt thành viên" });
    } else {
      res.status(404).json({ message: "Không tìm thấy thành viên trong danh sách đăng ký" });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const removeParticipant = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      res.status(404).json({ message: "Không tìm thấy Show" });
      return;
    }
    show.participants = show.participants.filter(p => p.user.toString() !== req.body.userId) as any;
    await show.save();
    res.json({ message: "Đã xóa khỏi show" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleRegistration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      res.status(404).json({ message: "Không tìm thấy Show" });
      return;
    }
    show.isRegistrationClosed = !show.isRegistrationClosed;
    await show.save();
    res.json({ message: "Đã thay đổi trạng thái đăng ký" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateShow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const updated = await Show.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addSongToSetlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      res.status(404).json({ message: "Không tìm thấy Show" });
      return;
    }
    show.setlist.push({ ...req.body, addedBy: req.user?._id });
    await show.save();
    res.json(show.setlist);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const removeSongFromSetlist = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      res.status(404).json({ message: "Không tìm thấy Show" });
      return;
    }
    show.setlist = show.setlist.filter(item => (item as any)._id.toString() !== req.params.songId);
    await show.save();
    res.json(show.setlist);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
