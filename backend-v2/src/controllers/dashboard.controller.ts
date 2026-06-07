import { Request, Response } from 'express';
import Rehearsal from '../models/Rehearsal';
import Show from '../models/Show';
import User from '../models/User';

export const getDashboardData = async (req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    // 1. TÍNH QUỸ PHẠT
    const rehearsals = await Rehearsal.find();
    const totalPendingFine = rehearsals.reduce((acc, curr) => {
      const sessionFines = (curr.attendance || []).reduce((sum, member) => sum + (member.fine || 0), 0);
      return acc + sessionFines;
    }, 0);

    // 2. TÍNH TOÁN SHOW
    const allShows = await Show.find().sort({ date: 1 });
    
    // Doanh thu thực nhận (Chỉ tính show đã hoàn thành)
    const totalRevenue = allShows
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (s.price || 0), 0);

    // Doanh thu dự kiến (Mọi show chưa hủy)
    const estimatedRevenue = allShows
      .filter(s => s.status !== 'cancelled')
      .reduce((sum, s) => sum + (s.price || 0), 0);

    // Đếm Show trong tháng này
    const showsThisMonth = allShows.filter(s => {
      const d = new Date(s.date);
      return d >= startOfMonth && d <= endOfMonth && s.status !== 'cancelled';
    }).length;

    // 3. LẤY SHOW SẮP TỚI
    const upcomingShows = allShows
      .filter(s => {
        const d = new Date(s.date);
        d.setHours(23, 59, 59, 999);
        return d >= today && (s.status === 'pending' || s.status === 'confirmed');
      })
      .slice(0, 5);

    // 4. LẤY LỊCH TẬP TIẾP THEO
    const nextRehearsal = await Rehearsal.findOne({ 
      date: { $gte: today } 
    }).sort({ date: 1 });

    // 5. ĐẾM THÀNH VIÊN
    const totalMembers = await User.countDocuments({ isApproved: true });

    // 6. TÍNH DOANH THU THỰC TẾ THEO THÁNG (T1 - T6)
    const currentYear = today.getFullYear();
    const monthlyRevenue = Array(6).fill(0).map((_, i) => {
      const total = allShows
        .filter(s => {
          const d = new Date(s.date);
          return d.getFullYear() === currentYear && d.getMonth() === i && s.status === 'completed';
        })
        .reduce((sum, s) => sum + (s.price || 0), 0);
      return {
        month: `T${i + 1}`,
        amount: Number((total / 1000000).toFixed(2)) // Triệu VND
      };
    });

    res.json({
      totalPendingFine,
      totalRevenue,
      estimatedRevenue,
      showsThisMonth,
      totalMembers,
      upcomingShows,
      nextRehearsal,
      monthlyRevenue
    });

  } catch (error: any) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Lỗi tải dữ liệu: " + error.message });
  }
};
