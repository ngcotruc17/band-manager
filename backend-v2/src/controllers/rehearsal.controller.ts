import { Response } from 'express';
import Rehearsal from '../models/Rehearsal';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { sendNewRehearsalEmail } from '../utils/sendEmail';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';
import { SocketService } from '../services/socket.service';
import { calculateDistanceMeters } from '../utils/geo';

const handleRehearsalError = (res: Response, error: any, defaultMessage = "Không tìm thấy lịch tập (ID không hợp lệ)") => {
  if (error?.name === 'CastError' || error?.kind === 'ObjectId') {
    return res.status(404).json({ success: false, message: defaultMessage });
  }
  if (error?.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.status(500).json({ message: error.message });
};

export const getRehearsals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const allUsers = await User.find({ isApproved: true }).select('_id fullName email');
    const dbRehearsals = await Rehearsal.find().sort({ date: -1 }).lean();

    const rehearsals = dbRehearsals.map(rehearsal => {
      const currentAttendance = rehearsal.attendance || [];
      
      const mergedAttendance = allUsers.map(user => {
        const existingRecord = currentAttendance.find(a => 
          a.user && a.user.toString() === user._id.toString()
        );

        if (existingRecord) {
          return { ...existingRecord, user: user };
        } else {
          return {
            user: user,
            status: 'pending',
            fine: 0
          };
        }
      });

      return { ...rehearsal, attendance: mergedAttendance };
    });

    res.json(rehearsals);
  } catch (error: any) {
    handleRehearsalError(res, error);
  }
};

export const createRehearsal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { date, time, location, content } = req.body;
    
    const users = await User.find({ isApproved: true });
    const attendanceList = users.map(u => ({
      user: u._id,
      status: 'pending',
      fine: 0
    }));

    const newRehearsal = new Rehearsal({
      date, time, location, content,
      attendance: attendanceList
    });

    await newRehearsal.save();
    sendNewRehearsalEmail(newRehearsal).catch(err => console.error("Lỗi gửi mail lịch tập mới:", err));
    res.status(201).json(newRehearsal);
  } catch (error: any) {
    handleRehearsalError(res, error, "Không thể tạo lịch tập do dữ liệu không hợp lệ");
  }
};

export const updateAttendance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { attendance } = req.body; 
    const rehearsal = await Rehearsal.findById(req.params.id);
    
    if (!rehearsal) {
      res.status(404).json({ message: "Không tìm thấy lịch tập" });
      return;
    }

    rehearsal.attendance = attendance;
    await rehearsal.save();
    
    res.json(rehearsal);
  } catch (error: any) {
    handleRehearsalError(res, error);
  }
};

export const deleteRehearsal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await Rehearsal.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa lịch tập" });
  } catch (error: any) {
    handleRehearsalError(res, error);
  }
};

export const generateQRToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rehearsal = await Rehearsal.findById(req.params.id);
    if (!rehearsal) {
      res.status(404).json({ message: "Không tìm thấy lịch tập" });
      return;
    }
    const token = jwt.sign(
      { rehearsalId: rehearsal._id }, 
      process.env.JWT_SECRET || 'mat_khau_bi_mat_cua_ban_123456', 
      { expiresIn: '5m' }
    );
    res.json({ token });
  } catch (error: any) {
    handleRehearsalError(res, error);
  }
};

export const checkin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { token, coords } = req.body;
    if (!token) {
      res.status(400).json({ message: "Thiếu mã check-in token" });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: "Chưa xác thực" });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'mat_khau_bi_mat_cua_ban_123456');
    } catch (err) {
      res.status(400).json({ success: false, message: "Mã QR đã hết hạn hoặc không hợp lệ. Vui lòng quét lại!" });
      return;
    }

    if (decoded.rehearsalId !== req.params.id) {
      res.status(400).json({ message: "Mã QR không trùng khớp với buổi tập này" });
      return;
    }

    const rehearsal = await Rehearsal.findById(req.params.id);
    if (!rehearsal) {
      res.status(404).json({ message: "Không tìm thấy lịch tập" });
      return;
    }

    // 📍 Kiểm tra khoảng cách GPS nếu phòng tập có thiết lập toạ độ
    if (
      rehearsal.gpsLocation &&
      typeof rehearsal.gpsLocation.latitude === 'number' &&
      typeof rehearsal.gpsLocation.longitude === 'number'
    ) {
      if (
        !coords ||
        typeof coords.latitude !== 'number' ||
        typeof coords.longitude !== 'number'
      ) {
        res.status(400).json({
          success: false,
          message: "Buổi tập yêu cầu xác thực vị trí GPS. Vui lòng bật định vị trên thiết bị hoặc gửi yêu cầu duyệt thủ công (GPS Bypass)."
        });
        return;
      }

      const allowedRadius = rehearsal.gpsLocation.radius || 30;
      const distance = calculateDistanceMeters(
        rehearsal.gpsLocation.latitude,
        rehearsal.gpsLocation.longitude,
        coords.latitude,
        coords.longitude
      );
      if (isNaN(distance) || distance > allowedRadius) {
        res.status(400).json({
          success: false,
          message: `Vị trí điểm danh không hợp lệ. Bạn đang ở cách phòng tập ${Math.round(distance || 9999)}m (cho phép tối đa ${allowedRadius}m).`,
          distance: Math.round(distance || 9999),
          allowedRadius
        });
        return;
      }
    }

    let record = rehearsal.attendance.find(a => a.user && a.user.toString() === req.user?._id.toString());
    if (!record) {
      rehearsal.attendance.push({ user: req.user._id, status: 'pending', fine: 0 } as any);
      record = rehearsal.attendance[rehearsal.attendance.length - 1];
    }

    if (record.status !== 'pending') {
      res.status(400).json({ message: "Bạn đã được điểm danh trước đó rồi!" });
      return;
    }

    let isLate = false;
    try {
      const timeStr = rehearsal.time || "";
      const startTimePart = timeStr.split('-')[0].trim(); // VD: "19:00"
      const [startHour, startMin] = startTimePart.split(':').map(Number);
      
      const rehearsalDate = new Date(rehearsal.date);
      const startDateTime = new Date(
        rehearsalDate.getFullYear(),
        rehearsalDate.getMonth(),
        rehearsalDate.getDate(),
        startHour,
        startMin
      );

      const now = new Date();
      const diffMs = now.getTime() - startDateTime.getTime();
      
      // Cho phép trễ tối đa 15 phút
      if (diffMs > 15 * 60 * 1000) {
        isLate = true;
      }
    } catch (e) {
      console.error("Lỗi parse thời gian tập:", e);
    }

    record.status = isLate ? 'late' : 'present';
    record.checkInTime = new Date();
    record.method = 'qr';
    if (isLate) {
      record.fine = 50000; // Phạt đi trễ 50k
    } else {
      record.fine = 0;
    }

    await rehearsal.save();

    res.json({
      message: isLate ? "Điểm danh thành công! Bạn đi trễ và bị phạt 50.000đ" : "Điểm danh thành công! Bạn đi tập đúng giờ.",
      status: record.status,
      fine: record.fine
    });
  } catch (error: any) {
    handleRehearsalError(res, error);
  }
};

export const getLeaderboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const allUsers = await User.find({ isApproved: true }).select('_id fullName').lean();
    const rehearsals = await Rehearsal.find().lean();

    const stats = allUsers.map(user => {
      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;
      let totalFines = 0;

      rehearsals.forEach(rehearsal => {
        const record = (rehearsal.attendance || []).find(a => a.user && a.user.toString() === user._id.toString());
        if (record) {
          if (record.status === 'present') presentCount++;
          else if (record.status === 'late') lateCount++;
          else if (record.status === 'absent') absentCount++;
          
          totalFines += record.fine || 0;
        }
      });

      const totalActiveSessions = presentCount + lateCount + absentCount;
      const attendanceRate = totalActiveSessions > 0 
        ? Math.round((presentCount / totalActiveSessions) * 100) 
        : 100;

      return {
        userId: user._id,
        fullName: user.fullName,
        presentCount,
        lateCount,
        absentCount,
        totalFines,
        attendanceRate
      };
    });

    const attendanceLeaderboard = [...stats].sort((a, b) => b.attendanceRate - a.attendanceRate);
    const fineLeaderboard = [...stats].sort((a, b) => b.totalFines - a.totalFines);

    res.json({
      attendanceLeaderboard,
      fineLeaderboard
    });
  } catch (error: any) {
    handleRehearsalError(res, error);
  }
};

export const requestGPSBypass = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const rehearsal = await Rehearsal.findById(id);
    if (!rehearsal) {
      res.status(404).json({ message: "Không tìm thấy buổi tập" });
      return;
    }
    
    if (!req.user) {
      res.status(401).json({ message: "Chưa xác thực" });
      return;
    }

    const dateStr = new Date(rehearsal.date).toLocaleDateString('vi-VN');
    
    // Gửi thông báo đến toàn bộ Admin
    await NotificationService.notifyAdmins({
      message: `🚨 [Điểm danh GPS Bypass] Thành viên ${req.user.fullName} yêu cầu duyệt có mặt thủ công cho buổi tập ngày ${dateStr} (${rehearsal.time}) do sự cố định vị.`,
      link: '/bookings',
      type: 'warning'
    });

    // Phát tín hiệu WebSocket cho Admin
    SocketService.broadcast('gps-bypass:requested', {
      rehearsalId: rehearsal._id,
      userId: req.user._id,
      fullName: req.user.fullName,
      time: rehearsal.time,
      date: dateStr
    });

    res.json({ message: "Yêu cầu duyệt báo danh thủ công đã được gửi tới Ban quản trị!" });
  } catch (error: any) {
    handleRehearsalError(res, error);
  }
};
