import { Router } from 'express';
import { updateProfile } from '../controllers/user.controller';
import { getAllUsers } from '../controllers/auth.controller';
import { protect, admin } from '../middleware/auth';
import User from '../models/User';

const router = Router();

// Cập nhật profile (Mọi người dùng đã đăng nhập)
router.put('/profile', protect, updateProfile);

// Lấy danh sách thành viên (Chỉ Admin)
router.get('/', protect, admin, getAllUsers);

// Admin chỉnh sửa thông tin thành viên khác
router.put('/:id', protect, admin, async (req, res): Promise<any> => {
  try {
    const { status, role, instrument } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { status, role, instrument }, 
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    return res.json(user);
  } catch (err: any) { 
    return res.status(500).json({ message: err.message }); 
  }
});

// Admin xóa thành viên
router.delete('/:id', protect, admin, async (req, res): Promise<any> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    return res.json({ message: 'Đã xóa thành viên' });
  } catch (err: any) { 
    return res.status(500).json({ message: err.message }); 
  }
});

export default router;
