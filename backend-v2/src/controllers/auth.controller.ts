import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { NotificationService } from '../services/notification.service';
import { AuthenticatedRequest } from '../middleware/auth';

const generateToken = (id: any): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'mat_khau_bi_mat_cua_ban_123456', { expiresIn: '30d' });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, username, password, email, phone } = req.body;
    if (!fullName || !username || !password) {
       res.status(400).json({ message: "Vui lòng nhập đủ: Họ tên, Username, Mật khẩu" });
       return;
    }
    const query: any[] = [{ username }];
    if (email) query.push({ email });
    
    const userExists = await User.findOne({ $or: query });
    if (userExists) {
       res.status(400).json({ message: "Tên đăng nhập hoặc Email đã tồn tại!" });
       return;
    }

    const user = await User.create({
      fullName,
      username,
      email: email || undefined,
      phone: phone || "",
      password
    });
    
    if (user) {
      // Gửi thông báo cho Admin
      await NotificationService.notifyAdmins({ 
        message: `👤 Thành viên mới đăng ký: ${fullName}. Đang chờ bạn duyệt!`, 
        link: '/members',
        type: 'warning'
      });

      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi Server: " + error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) {
       res.status(400).json({ message: "Sai thông tin tên đăng nhập hoặc email" });
       return;
    }
    if (!user.isApproved && user.role !== 'admin') {
       res.status(403).json({ message: "Tài khoản của bạn chưa được duyệt hoạt động!" });
       return;
    }
    const isMatch = await user.matchPassword(password); 
    if (!isMatch) {
       res.status(400).json({ message: "Mật khẩu không chính xác" });
       return;
    }
    
    res.json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      token: generateToken(user._id),
      mustChangePassword: user.mustChangePassword
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const adminCreateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, role, instrument } = req.body; 
    if (!email || !fullName) {
       res.status(400).json({ message: "Vui lòng nhập Email và Họ tên" });
       return;
    }
    const username = email.split('@')[0];
    const user = new User({
      username,
      email,
      password: "123456",
      fullName,
      role: role || 'member',
      instrument: instrument || 'Chưa phân công',
      mustChangePassword: true,
      status: 'active',
      isApproved: true
    });
    await user.save();
    res.status(201).json(user);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const changePasswordFirstTime = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { newPassword } = req.body;
    if (!req.user) {
       res.status(401).json({ message: "Không tìm thấy người dùng" });
       return;
    }
    const user = await User.findById(req.user._id);
    if (!user) {
       res.status(404).json({ message: "Không tìm thấy tài khoản" });
       return;
    }
    user.password = newPassword; 
    user.mustChangePassword = false; 
    await user.save();
    res.json({ message: "Đổi mật khẩu thành công!" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
       res.status(401).json({ message: "Chưa xác thực" });
       return;
    }
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi Server" });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
       res.status(404).json({ message: "Không tìm thấy người dùng" });
       return;
    }
    user.password = "123456"; 
    user.mustChangePassword = true; 
    user.isApproved = true; 
    await user.save(); 
    res.json({ message: `Đã reset mật khẩu của ${user.fullName}` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const approveUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!user) {
       res.status(404).json({ message: "Không tìm thấy thành viên" });
       return;
    }
    // Gửi thông báo cho User được duyệt
    await NotificationService.notifyUser(user._id.toString(), { 
      message: "🎉 Chúc mừng! Tài khoản của bạn đã được duyệt. Hãy bắt đầu hoạt động cùng Sắc Band!", 
      type: 'success' 
    });
    res.json({ message: `Đã duyệt thành viên: ${user.fullName}` });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa thành viên khỏi ban nhạc" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
