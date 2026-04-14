const Rehearsal = require('../models/Rehearsal');
const Show = require('../models/Show');
const User = require('../models/User');

exports.getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Đưa về đầu ngày hôm nay (00:00:00)
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    // 1. TÍNH QUỸ PHẠT (Giữ nguyên)
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

    // 3. LẤY SHOW SẮP TỚI (Dùng logic JS để đảm bảo đồng bộ)
    // Lấy các show có ngày diễn từ hôm nay trở về sau và chưa hoàn thành/hủy
    const upcomingShows = allShows
      .filter(s => {
        const d = new Date(s.date);
        d.setHours(23, 59, 59, 999); // Cho phép hiện show trong suốt cả ngày hôm đó
        return d >= today && (s.status === 'pending' || s.status === 'confirmed');
      })
      .slice(0, 5); // Chỉ lấy 5 show gần nhất

    // 4. LẤY LỊCH TẬP TIẾP THEO
    const nextRehearsal = await Rehearsal.findOne({ 
      date: { $gte: today } 
    }).sort({ date: 1 });

    // 5. ĐẾM THÀNH VIÊN
    const totalMembers = await User.countDocuments({ isApproved: true });

    // Trả về dữ liệu
    res.json({
      totalPendingFine,
      totalRevenue,
      estimatedRevenue,
      showsThisMonth,
      totalMembers,
      upcomingShows,
      nextRehearsal
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.json({ message: "Lỗi tải dữ liệu" });
  }
};