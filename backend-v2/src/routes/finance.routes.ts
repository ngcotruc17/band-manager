import { Router } from 'express';
import { 
  handleBankWebhook, 
  getTransactions, 
  createTransaction, 
  deleteTransaction, 
  getWebhookLogs 
} from '../controllers/finance.controller';
import { protect, admin } from '../middleware/auth';

const router = Router();

// Endpoint webhook đối soát ngân hàng động (không yêu cầu JWT token do ngân hàng gọi bên ngoài, bảo mật bằng WEBHOOK_SECRET)
router.post('/bank-webhook', handleBankWebhook);

// Các API nghiệp vụ tài chính ban nhạc
router.get('/', protect, getTransactions);
router.post('/', protect, createTransaction);
router.delete('/:id', protect, deleteTransaction);
router.get('/webhooks', protect, admin, getWebhookLogs);

export default router;
