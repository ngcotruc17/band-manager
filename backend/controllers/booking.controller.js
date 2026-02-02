const Booking = require('../models/Booking');
const Event = require('../models/Event');

// 1. Lấy danh sách Booking (Kèm TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI)
exports.getBookings = async (req, res) => {
  try {
    // --- 🔥 LOGIC TỰ ĐỘNG TÍNH TOÁN "ĐÃ DIỄN" 🔥 ---
    const now = new Date();
    
    // Tìm các booking đang "Approved" (Đã duyệt)
    const activeBookings = await Booking.find({ status: 'approved' });
    const events = await Event.find({ bookingRef: { $in: activeBookings.map(b => b._id) } });

    // Duyệt qua từng booking để check giờ
    const updates = activeBookings.map(async (booking) => {
      // Tìm event tương ứng để lấy giờ chính xác (vì booking đôi khi ko lưu giờ)
      const event = events.find(e => e.bookingRef && e.bookingRef.toString() === booking._id.toString());
      
      // Lấy ngày diễn
      const showDate = new Date(booking.date);
      
      // Lấy giờ diễn (Ưu tiên lấy từ Event, nếu không có lấy từ Booking, không có nữa thì mặc định 23:59)
      const timeStr = event?.time || "23:59"; 
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      // Set giờ cho ngày diễn
      showDate.setHours(hours || 23, minutes || 59, 0);

      // Nếu Thời gian hiện tại > Thời gian diễn => Chuyển sang "completed"
      if (now > showDate) {
        booking.status = 'completed';
        await booking.save();
      }
    });

    // Chờ cập nhật xong hết mới trả về danh sách
    await Promise.all(updates);
    // ------------------------------------------------

    // Lấy danh sách mới nhất đã cập nhật
    const bookings = await Booking.find().sort({ date: -1 }); // Mới nhất lên đầu
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Tạo Booking Mới
exports.createBooking = async (req, res) => {
  try {
    const { customerName, contactInfo, date, time } = req.body;

    const newBooking = new Booking({
      customerName,
      contactInfo,
      date,
      status: 'pending'
    });
    await newBooking.save();

    const newEvent = new Event({
      title: customerName,
      date: date,
      time: time || "19:00",
      location: "Chưa cập nhật (Cập nhật sau)",
      description: `SĐT: ${contactInfo}`,
      bookingRef: newBooking._id
    });
    await newEvent.save();

    res.status(201).json(newBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 3. Cập nhật trạng thái
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 4. Xóa Booking
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      await Event.findOneAndDelete({ bookingRef: booking._id });
      await Booking.findByIdAndDelete(req.params.id);
    }
    res.json({ message: 'Đã xóa booking và event liên quan' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};