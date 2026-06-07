import { Router } from 'express';
import { 
  getMyNotifications, 
  markAsRead, 
  markAllRead, 
  sendCustomNotification 
} from '../controllers/notification.controller';
import { protect, admin } from '../middleware/auth';

const router = Router();

router.get('/', protect, getMyNotifications);
router.put('/read-all', protect, markAllRead);
router.put('/:id/read', protect, markAsRead);
router.post('/custom', protect, admin, sendCustomNotification);

export default router;
