exports.getDashboardData = async (req, res) => {
  console.log("🚀 DASHBOARD ĐANG ĐƯỢC GỌI...");

  let responseData = {
    balance: 0,
    pendingFines: 0, // 👈 Thêm biến này
    rehearsals: [],
    upcomingEvents: [],
    historyEvents: []
  };

  try {
    const now = new Date();

    // --- 1. XỬ LÝ SHOW ---
    try {
      const Event = require('../models/Event');
      const allEvents = await Event.find().populate('bookingRef').sort({ date: 1 });
      // ... (Giữ nguyên logic show cũ của bạn) ...
      allEvents.forEach(event => {
        const showDate = new Date(event.date);
        let hour = 23, minute = 59;
        if (event.time && typeof event.time === 'string' && event.time.includes(':')) {
           const parts = event.time.split(':');
           hour = parseInt(parts[0]) || 23;
           minute = parseInt(parts[1]) || 59;
        }
        showDate.setHours(hour, minute, 0);

        if (showDate < now) {
           responseData.historyEvents.push(event);
        } else {
           const status = event.bookingRef ? event.bookingRef.status : 'approved';
           if (status !== 'cancelled' && status !== 'rejected') {
               responseData.upcomingEvents.push(event);
           }
        }
      });
      responseData.historyEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (err) { console.error("❌ Lỗi Show:", err.message); }

    // --- 2. XỬ LÝ LỊCH TẬP & TÍNH PHẠT 🔥 ---
    try {
      const Rehearsal = require('../models/Rehearsal');
      
      // A. Lấy 3 lịch tập sắp tới để hiện ra Widget
      responseData.rehearsals = await Rehearsal.find({ date: { $gte: now } })
        .sort({ date: 1 }).limit(3);

      // B. Tính tổng tiền phạt (Quét tất cả lịch tập)
      const allRehearsals = await Rehearsal.find();
      let totalFines = 0;
      allRehearsals.forEach(r => {
        if (r.attendees) {
            r.attendees.forEach(p => {
                // 👇 CẤU HÌNH GIÁ TIỀN PHẠT Ở ĐÂY
                if (p.status === 'late') totalFines += 50000;   // Đi muộn: 50k
                if (p.status === 'absent') totalFines += 100000; // Vắng mặt: 100k
            });
        }
      });
      responseData.pendingFines = totalFines;

    } catch (err) { }

    // --- 3. XỬ LÝ TÀI CHÍNH ---
    try {
      const Transaction = require('../models/Transaction');
      const transactions = await Transaction.find(); 
      responseData.balance = transactions.reduce((sum, t) => sum + t.amount, 0);
    } catch (err) { }

    res.json(responseData);

  } catch (error) {
    console.error("🔥 LỖI SERVER DASHBOARD:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};