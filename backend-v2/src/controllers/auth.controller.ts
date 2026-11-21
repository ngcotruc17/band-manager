import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { NotificationService } from '../services/notification.service';
import { AuthenticatedRequest } from '../middleware/auth';

export const generateToken = (id: any, tokenVersion: number = 0): string => {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET || 'mat_khau_bi_mat_cua_ban_123456', { expiresIn: '30d' });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, username, password, email, phone, role, instrument } = req.body;
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

    // Cho phép người dùng đăng ký theo phân vai (Sinh viên, Giảng viên, Cán bộ phòng ban)
    const validRoles = ['student', 'lecturer', 'manager', 'staff', 'member'];
    const assignedRole = role && validRoles.includes(role) ? role : 'student';

    const user = await User.create({
      fullName,
      username,
      email: email || undefined,
      phone: phone || "",
      password,
      role: assignedRole,
      instrument: instrument && typeof instrument === 'string' ? instrument.trim() : 'Chưa phân công'
    });
    
    if (user) {
      // Gửi thông báo cho Admin & Cán bộ
      await NotificationService.notifyAdmins({ 
        message: `👤 Thành viên mới đăng ký (${user.role}): ${fullName}. Đang chờ bạn duyệt!`, 
        link: '/members',
        type: 'warning'
      });

      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.tokenVersion ?? 0),
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
    if (!username || typeof username !== 'string' || !password || typeof password !== 'string' || !username.trim() || !password.trim()) {
      res.status(400).json({ success: false, message: "Tên đăng nhập và mật khẩu phải là chuỗi ký tự hợp lệ!" });
      return;
    }
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) {
       res.status(400).json({ message: "Sai thông tin tên đăng nhập hoặc email" });
       return;
    }
    if (user.status === 'banned') {
       res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
       return;
    }
    if (!user.isApproved && user.role !== 'admin' && user.role !== 'system') {
       res.status(403).json({ message: "Tài khoản của bạn chưa được duyệt hoạt động!" });
       return;
    }

    // --- R1: Check Account Lockout ---
    const now = Date.now();
    if (user.lockUntil && new Date(user.lockUntil).getTime() > now) {
      const lockDate = new Date(user.lockUntil);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timeStr = `${pad(lockDate.getHours())}:${pad(lockDate.getMinutes())}:${pad(lockDate.getSeconds())}`;
      res.status(429).json({
        success: false,
        message: `Tài khoản bị tạm khóa đến [${timeStr}] do nhập sai mật khẩu quá 5 lần`
      });
      return;
    }

    const isMatch = await user.matchPassword(password); 
    if (!isMatch) {
      // If previous lock has expired, reset counter before incrementing
      let attempts = user.failedLoginAttempts || 0;
      if (user.lockUntil && new Date(user.lockUntil).getTime() <= now) {
        attempts = 0;
      }
      attempts += 1;
      user.failedLoginAttempts = attempts;

      if (attempts >= 5) {
        const lockUntilDate = new Date(now + 15 * 60 * 1000); // 15 minutes lockout
        user.lockUntil = lockUntilDate;
        await user.save();

        const pad = (n: number) => n.toString().padStart(2, '0');
        const timeStr = `${pad(lockUntilDate.getHours())}:${pad(lockUntilDate.getMinutes())}:${pad(lockUntilDate.getSeconds())}`;
        res.status(429).json({
          success: false,
          message: `Tài khoản bị tạm khóa đến [${timeStr}] do nhập sai mật khẩu quá 5 lần`
        });
        return;
      } else {
        user.lockUntil = null;
        await user.save();
        res.status(400).json({
          success: false,
          message: "Mật khẩu không chính xác",
          failedLoginAttempts: attempts
        });
        return;
      }
    }
    
    // --- R1: Reset lockout counter and lockUntil on successful login ---
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    res.json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      token: generateToken(user._id, user.tokenVersion ?? 0),
      mustChangePassword: user.mustChangePassword
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const generateRandomPassword = (length = 8): string => {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const all = uppers + lowers + numbers;

  const bytes = crypto.randomBytes(length);
  const pwd = [
    uppers[bytes[0] % uppers.length],
    lowers[bytes[1] % lowers.length],
    numbers[bytes[2] % numbers.length],
  ];
  for (let i = 3; i < length; i++) {
    pwd.push(all[bytes[i] % all.length]);
  }
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = bytes[i % bytes.length] % (i + 1);
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }
  return pwd.join('');
};

export const adminCreateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, username, phone, role, instrument } = req.body; 
    if (!fullName || !fullName.trim()) {
       res.status(400).json({ message: "Vui lòng nhập Họ và tên thành viên" });
       return;
    }

    // Phân vai: sinh viên, giảng viên, quản trị viên, v.v.
    const validRoles = ['admin', 'manager', 'staff', 'lecturer', 'student', 'member'];
    const assignedRole = role && validRoles.includes(role) ? role : 'student';

    // Tạo username nếu chưa có
    let chosenUsername = username?.trim();
    if (!chosenUsername) {
      if (email && email.includes('@')) {
        chosenUsername = email.split('@')[0].trim().toLowerCase();
      } else {
        chosenUsername = fullName
          .trim()
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");
      }
    }
    if (!chosenUsername) {
      chosenUsername = `user${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Đảm bảo username không trùng lặp
    let finalUsername = chosenUsername;
    let counter = 1;
    while (await User.findOne({ username: finalUsername })) {
      finalUsername = `${chosenUsername}${Math.floor(100 + Math.random() * 900)}`;
      counter++;
      if (counter > 10) {
        finalUsername = `${chosenUsername}_${Date.now().toString().slice(-4)}`;
        break;
      }
    }

    // Kiểm tra email nếu có
    if (email && email.trim()) {
      const emailExists = await User.findOne({ email: email.trim().toLowerCase() });
      if (emailExists) {
        res.status(400).json({ message: "Email này đã được sử dụng bởi thành viên khác!" });
        return;
      }
    }

    // Cấp mật khẩu ngẫu nhiên an toàn (8 ký tự)
    const rawPassword = generateRandomPassword(8);

    const user = new User({
      username: finalUsername,
      email: email && email.trim() ? email.trim().toLowerCase() : undefined,
      phone: phone ? phone.trim() : "",
      password: rawPassword, // Được băm qua pre('save') bằng bcrypt
      fullName: fullName.trim(),
      role: assignedRole,
      instrument: instrument ? instrument.trim() : 'Chưa phân công',
      mustChangePassword: true,
      status: 'active',
      isApproved: true
    });

    await user.save();

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      instrument: user.instrument,
      mustChangePassword: user.mustChangePassword,
      status: user.status,
      isApproved: user.isApproved,
      tempPassword: rawPassword,
      message: "Tạo tài khoản thành viên thành công!"
    });
  } catch (e: any) {
    res.status(500).json({ message: "Lỗi tạo tài khoản: " + e.message });
  }
};

export const changePasswordFirstTime = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { newPassword } = req.body;
    if (!req.user) {
       res.status(401).json({ message: "Không tìm thấy người dùng" });
       return;
    }
    if (!newPassword || newPassword.length < 6) {
       res.status(400).json({ message: "Mật khẩu mới phải có tối thiểu 6 ký tự!" });
       return;
    }
    const user = await User.findById(req.user._id);
    if (!user) {
       res.status(404).json({ message: "Không tìm thấy tài khoản" });
       return;
    }
    user.password = newPassword; 
    user.mustChangePassword = false; 
    user.tokenVersion = (user.tokenVersion || 0) + 1; // R3: Invalidate previous tokens
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
    const rawPassword = generateRandomPassword(8);
    user.password = rawPassword; 
    user.mustChangePassword = true; 
    user.isApproved = true; 
    user.tokenVersion = (user.tokenVersion || 0) + 1; // R3: Invalidate previous tokens
    await user.save(); 
    res.json({ 
      message: `Đã reset mật khẩu của ${user.fullName}`,
      tempPassword: rawPassword,
      username: user.username,
      fullName: user.fullName
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const approveUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true, status: 'active' }, { new: true });
    if (!user) {
       res.status(404).json({ message: "Không tìm thấy thành viên" });
       return;
    }
    // Gửi thông báo cho User được duyệt
    await NotificationService.notifyUser(user._id.toString(), { 
      message: "🎉 Chúc mừng! Tài khoản của bạn đã được duyệt. Hãy bắt đầu hoạt động cùng FPTU Band!", 
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
