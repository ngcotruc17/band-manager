import { Router } from 'express';
import { 
  register, 
  login, 
  adminCreateUser, 
  changePasswordFirstTime, 
  getMe, 
  getAllUsers, 
  resetUserPassword, 
  approveUser, 
  deleteUser 
} from '../controllers/auth.controller';
import { protect, admin } from '../middleware/auth';

const router = Router();

// Routes công khai (Public)
router.post('/register', register);
router.post('/login', login);

// Routes yêu cầu đăng nhập (Authenticated)
router.get('/me', protect, getMe);
router.put('/change-password-first', protect, changePasswordFirstTime);

// Routes yêu cầu quyền Admin
router.post('/admin-create', protect, admin, adminCreateUser);
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id/reset-password', protect, admin, resetUserPassword);
router.put('/users/:id/approve', protect, admin, approveUser);
router.delete('/users/:id', protect, admin, deleteUser);

export default router;
