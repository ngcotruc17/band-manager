const Rehearsal = require('../models/Rehearsal');
const Show = require('../models/Show');
const User = require('../models/User');

exports.getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    // Đặt giờ về 00:00:00 để so sánh ngày chính xác
    today.setHours(0, 0, 0, 0); 
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // 1. TÍNH QUỸ PHẠT (Từ Lịch tập)
    const rehearsals = await Rehearsal.find();
    const totalPendingFine = rehearsals.reduce((acc, curr) => {
        const sessionFines = (curr.attendance || []).reduce((sum, member) => sum + (member.fine || 0), 0);
        return acc + sessionFines;
    }, 0);

    // 2. TÍNH TOÁN SHOW (Từ Booking)
    const allShows = await Show.find();
    
    // Doanh thu thực nhận (Chỉ tính show đã hoàn thành)
    const totalRevenue = allShows
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + (s.price || 0), 0);

    // Doanh thu dự kiến (Tất cả show trừ show hủy - Bao gồm cả Pending & Confirmed)
    const estimatedRevenue = allShows
      .filter(s => s.status !== 'cancelled')
      .reduce((sum, s) => sum + (s.price || 0), 0);

    // Đếm Show trong tháng này
    const showsThisMonth = allShows.filter(s => {
      const d = new Date(s.date);
      return d >= startOfMonth && d <= endOfMonth && s.status !== 'cancelled';
    }).length;

    // 3. LẤY SHOW SẮP TỚI (Để hiển thị list bên dưới)
    // Lấy show có ngày >= hôm nay VÀ chưa hoàn thành/hủy
    const upcomingShows = await Show.find({ 
      date: { $gte: today }, 
      status: { $in: ['pending', 'confirmed'] } 
    }).sort({ date: 1 }).limit(5); // Lấy 5 show gần nhất

    // 4. LẤY LỊCH TẬP TIẾP THEO
    const nextRehearsal = await Rehearsal.findOne({ 
      date: { $gte: today } 
    }).sort({ date: 1 });

    // 5. ĐẾM THÀNH VIÊN
    const totalMembers = await User.countDocuments({ isApproved: true });

    // Trả về tất cả dữ liệu
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
    res.status(500).json({ message: "Lỗi Server khi tải Dashboard" });
  }
};