import { Response } from 'express';
import Show from '../models/Show';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { sendNewShowEmail, sendApproveEmail, sendSalarySplitEmail } from '../utils/sendEmail';
import { NotificationService } from '../services/notification.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateSalarySplit } from '../utils/salary';

const handleShowError = (res: Response, error: any, defaultMessage = "Không tìm thấy Show (ID không hợp lệ)") => {
  if (error?.name === 'CastError' || error?.kind === 'ObjectId') {
    return res.status(404).json({ success: false, message: defaultMessage });
  }
  if (error?.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.status(500).json({ message: error.message });
};

export const getShows = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const sortOrder = req.query.sort === 'asc' ? 1 : -1;
    const shows = await Show.find().sort({ date: sortOrder });
    res.json(shows);
  } catch (error: any) {
    handleShowError(res, error);
  }
};

export const createShow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const isManagerOrAdmin = req.user?.role === 'admin' || req.user?.role === 'manager' || req.user?.role === 'staff';
    const status = isManagerOrAdmin ? (req.body.status || 'confirmed') : 'pending';
    
    const newShow = new Show({ 
      ...req.body, 
      status, 
      createdBy: req.user?._id 
    });
    await newShow.save();

    // Thông báo cho ban quản lý nếu Giảng viên / Sinh viên tạo yêu cầu book show
    if (!isManagerOrAdmin) {
      const creatorTitle = req.user?.role === 'lecturer' ? 'Giảng viên' : 'Sinh viên';
      await NotificationService.notifyAdmins({
        message: `📅 Đơn đặt show mới từ ${creatorTitle} ${req.user?.fullName || ''}: "${newShow.title}". Vui lòng kiểm tra và duyệt xếp lịch!`,
        link: `/bookings`,
        type: 'info'
      });
    }

    res.status(201).json(newShow);
  } catch (error: any) {
    handleShowError(res, error, "Không thể tạo show do dữ liệu không hợp lệ");
  }
};

export const deleteShow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await Show.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa show" });
  } catch (error: any) {
    handleShowError(res, error);
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
      const totalPrice = oldShow.price || 0;
      const bandFundPercent = oldShow.payoutMatrix?.bandFundPercent !== undefined ? oldShow.payoutMatrix.bandFundPercent : 5;

      const roleMultipliers: Record<string, number> = {};
      if (oldShow.payoutMatrix?.roleMultipliers) {
        for (const rm of oldShow.payoutMatrix.roleMultipliers) {
          roleMultipliers[rm.instrument] = rm.multiplier;
        }
      }

      const allowances = (oldShow.payoutMatrix?.allowances || []).map(a => ({
        id: (a.user as any)?._id ? (a.user as any)._id.toString() : a.user.toString(),
        amount: a.amount
      }));

      const members = approvedParticipants.map(p => ({
        id: ((p.user as any)?._id || p.user).toString(),
        role: p.role || (p.user as any)?.instrument || ''
      }));

      const splitResult = calculateSalarySplit({
        totalPrice,
        bandFundPercent,
        members,
        roleMultipliers,
        allowances
      });

      const memberPayoutList = approvedParticipants.map(p => {
        const uid = ((p.user as any)?._id || p.user).toString();
        return {
          user: (p.user as any)?._id || p.user,
          amount: splitResult.memberPayouts[uid] || 0
        };
      });

      const avgMemberAmount = approvedParticipants.length > 0 
        ? Math.round(splitResult.remainingPool / approvedParticipants.length) 
        : 0;

      salarySplit = {
        totalPrice: splitResult.totalPrice,
        bandFundPercent,
        bandFundAmount: splitResult.bandFundAmount,
        memberAmount: avgMemberAmount,
        members: memberPayoutList
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

        // 2. Chi cát-xê cho từng thành viên tham gia & cập nhật ví
        for (const p of approvedParticipants) {
          const uid = ((p.user as any)?._id || p.user).toString();
          const payout = splitResult.memberPayouts[uid] || 0;
          if (payout > 0 && p.user) {
            const expenseTrans = new Transaction({
              title: `Cát-xê ${(p.user as any).fullName || 'Thành viên'} - Show: ${oldShow.title}`,
              amount: -payout,
              type: 'expense',
              category: 'show',
              showId: oldShow._id,
              performedBy: (p.user as any)._id || p.user
            });
            await expenseTrans.save();

            // Tăng số dư ví của thành viên
            await User.findByIdAndUpdate(uid, { $inc: { walletBalance: payout } });
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
    handleShowError(res, error); 
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
    handleShowError(res, error);
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

    // 🔒 Kiểm tra trạng thái và thời hạn đóng đăng ký của Show
    if (show.status === 'completed' || show.status === 'cancelled') {
      res.status(400).json({ success: false, message: "Show diễn đã kết thúc hoặc bị hủy, không thể thay đổi đăng ký" });
      return;
    }

    if (show.isRegistrationClosed) {
      res.status(400).json({ success: false, message: "Đăng ký tham gia show diễn này đã đóng" });
      return;
    }

    const lockHours = show.lockRegistrationHours !== undefined ? show.lockRegistrationHours : 24;
    const showDate = new Date(show.date).getTime();
    const now = Date.now();
    const lockTime = showDate - lockHours * 60 * 60 * 1000;
    if (now >= lockTime) {
      res.status(400).json({ success: false, message: `Đã hết hạn đăng ký (khóa trước giờ diễn ${lockHours} tiếng)` });
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
    handleShowError(res, error);
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
    handleShowError(res, error);
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
    handleShowError(res, error);
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
    handleShowError(res, error);
  }
};

export const updateShow = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const updated = await Show.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error: any) {
    handleShowError(res, error);
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
    handleShowError(res, error);
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
    handleShowError(res, error);
  }
};
