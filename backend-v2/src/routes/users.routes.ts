import { Router } from 'express';
import { updateProfile } from '../controllers/user.controller';
import { getAllUsers, adminCreateUser } from '../controllers/auth.controller';
import { protect, admin } from '../middleware/auth';
import User from '../models/User';

const router = Router();

// Cập nhật profile (Mọi người dùng đã đăng nhập)
router.put('/profile', protect, updateProfile);

// Lấy danh sách thành viên (Chỉ Admin)
router.get('/', protect, admin, getAllUsers);

// Admin tạo tài khoản thành viên mới
router.post('/', protect, admin, adminCreateUser);

// Admin chỉnh sửa thông tin / vai trò thành viên
router.put('/:id', protect, admin, async (req, res): Promise<any> => {
  try {
    const { status, role, instrument, fullName, phone } = req.body;

    if (role) {
      const validRoles = ['admin', 'manager', 'staff', 'lecturer', 'student', 'member', 'system', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Vai trò không hợp lệ!" });
      }
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (role !== undefined) updateData.role = role;
    if (instrument !== undefined) updateData.instrument = instrument;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    return res.json(user);
  } catch (err: any) { 
    if (err?.name === 'CastError' || err?.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng (ID không hợp lệ)" });
    }
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
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
    if (err?.name === 'CastError' || err?.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng (ID không hợp lệ)" });
    }
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ message: err.message }); 
  }
});

export default router;
