import { Router } from 'express';
import { 
  getRehearsals, 
  createRehearsal, 
  updateAttendance, 
  deleteRehearsal, 
  generateQRToken, 
  checkin, 
  getLeaderboard
} from '../controllers/rehearsal.controller';
import { protect, admin } from '../middleware/auth';

const router = Router();

// Lọc bảng xếp hạng chuyên cần (Đặt phía trên tuyến :id để tránh trùng lặp tham số)
router.get('/leaderboard', protect, getLeaderboard);

router.get('/', protect, getRehearsals);
router.post('/', protect, admin, createRehearsal);
router.put('/:id/attendance', protect, admin, updateAttendance);
router.delete('/:id', protect, admin, deleteRehearsal);
router.get('/:id/qr-token', protect, generateQRToken);
router.post('/:id/checkin', protect, checkin);

export default router;
