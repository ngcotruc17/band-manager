import { Request, Response } from 'express';
import Show from '../models/Show';
import User from '../models/User';
import Transaction from '../models/Transaction';
import BankWebhookLog from '../models/BankWebhookLog';
import { SocketService } from '../services/socket.service';
import { AuthenticatedRequest } from '../middleware/auth';

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
    if (process.env.WEBHOOK_SECRET && apiKey !== process.env.WEBHOOK_SECRET) {
       res.status(401).json({ message: "Không có quyền truy cập Webhook" });
       return;
    }

    if (!transactionId || !amount || !content) {
       res.status(400).json({ message: "Thiếu thông tin giao dịch bắt buộc" });
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
      amount: Number(amount),
      content,
      senderAccount,
      senderName,
      processed: false,
      rawPayload: req.body
    });

    // 3. Phân tích nội dung chuyển khoản để nhận dạng mã
    const cleanContent = content.toUpperCase().replace(/[-_]/g, ' ');
    
    // Tìm mã SHOW: Cú pháp "SHOW [SHOW_ID]"
    const showMatch = cleanContent.match(/SHOW\s+([A-F0-9]{24})/i);
    // Tìm mã PHAT: Cú pháp "PHAT [USER_ID]"
    const fineMatch = cleanContent.match(/PHAT\s+([A-F0-9]{24})/i);

    if (showMatch) {
      const showId = showMatch[1].toLowerCase();
      const show = await Show.findById(showId);
      
      if (show) {
        // Cập nhật tình trạng đối soát của Show diễn
        show.bankReconciliation.actualReceived += Number(amount);
        show.bankReconciliation.transactions.push(transactionId);
        
        // Nếu tổng nhận >= giá trị show diễn, tự động đánh dấu đã thanh toán xong
        if (show.bankReconciliation.actualReceived >= show.price) {
          show.bankReconciliation.isPaid = true;
          // Tự động chốt show luôn nếu khách đã thanh toán đủ
          if (show.status === 'confirmed') {
            show.status = 'completed';
          }
        }
        await show.save();

        // Tạo giao dịch tài chính hệ thống
        const showTransaction = new Transaction({
          title: `[Tự động] Thanh toán khách hàng - Show: ${show.title}`,
          amount: Number(amount),
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
          amount: Number(amount),
          message: `💵 Hệ thống đối soát thành công: Show "${show.title}" đã nhận được ${Number(amount).toLocaleString('vi-VN')}đ.`
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
        user.totalFinePaid += Number(amount);
        // Tự động cộng số dư ví tương ứng nếu họ nộp phạt bằng tiền túi ngoài ví
        // Hoặc trừ trực tiếp trong ví nếu ví bị âm
        user.walletBalance += Number(amount);
        await user.save();

        // Ghi nhận giao dịch đóng phạt vào Quỹ chung của band
        const fineTransaction = new Transaction({
          title: `[Tự động] Đóng phạt quỹ chuyên cần - Thành viên: ${user.fullName}`,
          amount: Number(amount),
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
          amount: Number(amount),
          message: `💸 Thành viên ${user.fullName} đã đóng phạt ${Number(amount).toLocaleString('vi-VN')}đ thành công.`
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
    res.status(500).json({ message: error.message });
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
