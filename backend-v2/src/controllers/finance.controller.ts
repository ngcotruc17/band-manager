import { Request, Response } from 'express';
import Show from '../models/Show';
import User from '../models/User';
import Transaction from '../models/Transaction';
import BankWebhookLog from '../models/BankWebhookLog';
import { SocketService } from '../services/socket.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateSalarySplit } from '../utils/salary';

const handleFinanceError = (res: Response, error: any, defaultMessage = "Không tìm thấy giao dịch (ID không hợp lệ)") => {
  if (error?.name === 'CastError' || error?.kind === 'ObjectId') {
    return res.status(404).json({ success: false, message: defaultMessage });
  }
  if (error?.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.status(500).json({ message: error.message });
};

export const handleBankWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      transactionId, 
      gateway, 
      amount, 
      content, 
      senderAccount, 
      senderName 
    } = req.body;

    // 1. Kiểm tra xác thực/Signature của API Key (Cấu hình SePay/Cassso trong .env)
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    const expectedSecret = process.env.WEBHOOK_SECRET;
    
    // Bắt buộc cấu hình và trùng khớp WEBHOOK_SECRET
    if (!expectedSecret || (apiKey !== expectedSecret && apiKey !== `Bearer ${expectedSecret}`)) {
       res.status(401).json({ message: "Không có quyền truy cập Webhook - Invalid Secret Key" });
       return;
    }


    const rawAmount = amount !== undefined ? amount : req.body.transferAmount;
    if (!transactionId || rawAmount === undefined || rawAmount === null || rawAmount === '' || !content) {
       res.status(400).json({ message: "Thiếu thông tin giao dịch bắt buộc" });
       return;
    }

    // 🛡️ Làm sạch và chuẩn hóa số tiền giao dịch, ngăn chặn triệt để lỗi NaN
    const parsedAmount = Number(String(rawAmount).replace(/[^0-9.-]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
       res.status(400).json({ message: "Số tiền giao dịch không hợp lệ" });
       return;
    }

    // 2. Tránh xử lý trùng lặp giao dịch (Idempotency)
    const existingLog = await BankWebhookLog.findOne({ transactionId });
    if (existingLog) {
       res.status(200).json({ message: "Giao dịch đã được đối soát từ trước", processed: true });
       return;
    }

    // Khởi tạo log giao dịch mới
    const webhookLog = new BankWebhookLog({
      transactionId,
      gateway,
      amount: parsedAmount,
      content,
      senderAccount,
      senderName,
      processed: false,
      rawPayload: req.body
    });

    // 3. Phân tích nội dung chuyển khoản để nhận dạng mã (chuẩn hoá bỏ dấu tiếng Việt)
    const cleanContent = content.toUpperCase().replace(/[-_]/g, ' ');
    const normalized = cleanContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Tìm mã SHOW: Cú pháp "SHOW [SHOW_ID]" hoặc "SHOW[SHOW_ID]"
    const showMatch = normalized.match(/SHOW\s*([A-F0-9]{24})/i);
    // Tìm mã PHAT: Cú pháp "PHAT [USER_ID]" hoặc "PHAT[USER_ID]"
    const fineMatch = normalized.match(/PHAT\s*([A-F0-9]{24})/i);

    if (showMatch) {
      const showId = showMatch[1].toLowerCase();
      const show = await Show.findById(showId);
      
      if (show) {
        // Cập nhật tình trạng đối soát của Show diễn
        show.bankReconciliation.actualReceived += parsedAmount;
        show.bankReconciliation.transactions.push(transactionId);
        
        // Nếu tổng nhận >= giá trị show diễn, tự động đánh dấu đã thanh toán xong
        if (show.bankReconciliation.actualReceived >= show.price) {
          show.bankReconciliation.isPaid = true;
          // Tự động chốt show luôn nếu khách đã thanh toán đủ và kích hoạt chia cát-xê
          if (show.status === 'confirmed') {
            show.status = 'completed';

            // Kích hoạt tính toán chia cát-xê tự động
            await show.populate('participants.user');
            const approvedParticipants = show.participants.filter(p => p.status === 'approved');

            const roleMultipliers: Record<string, number> = {};
            if (show.payoutMatrix?.roleMultipliers) {
              for (const rm of show.payoutMatrix.roleMultipliers) {
                roleMultipliers[rm.instrument] = rm.multiplier;
              }
            }

            const allowances = (show.payoutMatrix?.allowances || []).map(a => ({
              id: (a.user as any)?._id ? (a.user as any)._id.toString() : a.user.toString(),
              amount: a.amount
            }));

            const members = approvedParticipants.map(p => ({
              id: ((p.user as any)?._id || p.user).toString(),
              role: p.role || (p.user as any)?.instrument || ''
            }));

            const bandFundPercent = show.payoutMatrix?.bandFundPercent !== undefined ? show.payoutMatrix.bandFundPercent : 5;

            const splitResult = calculateSalarySplit({
              totalPrice: show.price,
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

            show.salarySplit = {
              totalPrice: splitResult.totalPrice,
              bandFundPercent,
              bandFundAmount: splitResult.bandFundAmount,
              memberAmount: avgMemberAmount,
              members: memberPayoutList
            };

            // Chi cát-xê cho từng thành viên và tăng số dư ví
            for (const p of approvedParticipants) {
              const uid = ((p.user as any)?._id || p.user).toString();
              const payout = splitResult.memberPayouts[uid] || 0;
              if (payout > 0 && p.user) {
                const expenseTrans = new Transaction({
                  title: `[Tự động] Cát-xê ${(p.user as any).fullName || 'Thành viên'} - Show: ${show.title}`,
                  amount: -payout,
                  type: 'expense',
                  category: 'show',
                  showId: show._id,
                  performedBy: (p.user as any)._id || p.user,
                  webhookLogId: webhookLog._id,
                  isAutoReconciled: true,
                  paymentStatus: 'success'
                });
                await expenseTrans.save();

                // Cập nhật số dư ví
                await User.findByIdAndUpdate(uid, { $inc: { walletBalance: payout } });
              }
            }
          }
        }
        await show.save();

        // Tạo giao dịch tài chính hệ thống
        const showTransaction = new Transaction({
          title: `[Tự động] Thanh toán khách hàng - Show: ${show.title}`,
          amount: parsedAmount,
          type: 'income',
          category: 'show',
          showId: show._id,
          performedBy: show.createdBy, // Thực hiện bởi người tạo show
          webhookLogId: webhookLog._id,
          isAutoReconciled: true,
          paymentStatus: 'success'
        });
        await showTransaction.save();

        // Lưu thông tin đối soát vào Webhook Log
        webhookLog.processed = true;
        webhookLog.referenceType = 'show';
        webhookLog.referenceId = show._id;
        await webhookLog.save();

        // Đồng bộ tin nhắn đẩy Socket.io thông báo Admin
        SocketService.broadcast('finance:reconciled', {
          type: 'show',
          showId: show._id,
          title: show.title,
          amount: parsedAmount,
          message: `💵 Hệ thống đối soát thành công: Show "${show.title}" đã nhận được ${parsedAmount.toLocaleString('vi-VN')}đ.`
        });

         res.status(200).json({ 
          message: "Đối soát Show diễn thành công", 
          processed: true, 
          showId: show._id 
        });
        return;
      } else {
        webhookLog.error = "Không tìm thấy Show diễn khớp với ID trong nội dung chuyển khoản";
      }
    } 
    else if (fineMatch) {
      const userId = fineMatch[1].toLowerCase();
      const user = await User.findById(userId);

      if (user) {
        // Tăng tổng tiền đóng phạt thực tế của thành viên
        user.totalFinePaid += parsedAmount;
        // Tự động cộng số dư ví tương ứng nếu họ nộp phạt bằng tiền túi ngoài ví
        // Hoặc trừ trực tiếp trong ví nếu ví bị âm
        user.walletBalance += parsedAmount;
        await user.save();

        // Ghi nhận giao dịch đóng phạt vào Quỹ chung của band
        const fineTransaction = new Transaction({
          title: `[Tự động] Đóng phạt quỹ chuyên cần - Thành viên: ${user.fullName}`,
          amount: parsedAmount,
          type: 'income',
          category: 'fine',
          performedBy: user._id,
          webhookLogId: webhookLog._id,
          isAutoReconciled: true,
          paymentStatus: 'success'
        });
        await fineTransaction.save();

        webhookLog.processed = true;
        webhookLog.referenceType = 'fine';
        webhookLog.referenceId = user._id;
        await webhookLog.save();

        // Đẩy Socket.io thông báo thời gian thực
        SocketService.broadcast('finance:reconciled', {
          type: 'fine',
          userId: user._id,
          userName: user.fullName,
          amount: parsedAmount,
          message: `💸 Thành viên ${user.fullName} đã đóng phạt ${parsedAmount.toLocaleString('vi-VN')}đ thành công.`
        });

         res.status(200).json({ 
          message: "Đối soát đóng phạt thành viên thành công", 
          processed: true, 
          userId: user._id 
        });
        return;
      } else {
        webhookLog.error = "Không tìm thấy thành viên khớp với ID trong nội dung đóng phạt";
      }
    } else {
      webhookLog.error = "Nội dung chuyển khoản không chứa cú pháp đối soát hợp lệ (SHOW [ID] hoặc PHAT [ID])";
    }

    // Lưu log lỗi nếu rơi vào trường hợp không xử lý được mã
    webhookLog.processed = false;
    webhookLog.referenceType = 'unknown';
    await webhookLog.save();

     res.status(200).json({ 
      message: "Giao dịch không khớp mã đối soát tự động", 
      processed: false,
      error: webhookLog.error 
    });
  } catch (error: any) {
    console.error("❌ Lỗi xử lý Bank Webhook:", error);
     res.status(500).json({ message: "Lỗi xử lý server nội bộ", error: error.message });
  }
};

export const getTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const transactions = await Transaction.find()
      .sort({ date: -1 })
      .populate('performedBy', 'fullName');
      
    const totalFund = transactions.reduce((acc, curr) => acc + curr.amount, 0);
    res.json({ totalFund, transactions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, amount, type, category } = req.body;
    if (!req.user) {
      res.status(401).json({ message: "Chưa xác thực" });
      return;
    }
    const finalAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

    const newTrans = new Transaction({
      title,
      amount: finalAmount,
      type,
      category,
      performedBy: req.user._id
    });

    await newTrans.save();
    res.status(201).json(newTrans);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa' });
  } catch (error: any) {
    handleFinanceError(res, error);
  }
};

export const getWebhookLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const logs = await BankWebhookLog.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
