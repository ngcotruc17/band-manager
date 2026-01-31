const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { sendNewShowEmail } = require('../utils/sendEmail'); 
const { notifyAllMembers } = require('./notification.controller'); 

// 1. Get Bookings
exports.getBookings = async (req, res) => {
  try {
    // 🔥 SỬA DÒNG NÀY: Sort theo date (tăng dần) để hiện show sắp tới
    // (Thay vì createdAt là show mới tạo)
    const bookings = await Booking.find().sort({ date: 1 });
    
    res.json(bookings);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ... Các hàm create, update, delete giữ nguyên như của bạn là OK rồi ...
exports.createBooking = async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();

    await Event.create({
      title: `${newBooking.customerName}`,
      date: newBooking.date,
      location: 'Chưa cập nhật (Cập nhật sau)',
      bookingRef: newBooking._id
    });

    res.status(201).json(newBooking);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (status === 'approved') {
      const event = await Event.findOne({ bookingRef: booking._id });
      if (event) {
        // Gửi Email nếu có hàm này
        if (typeof sendNewShowEmail === 'function') sendNewShowEmail(event); 

        // Gửi thông báo
        await notifyAllMembers({
          message: `🔥 Show mới: ${event.title}. Đăng ký ngay!`,
          link: `/events/${event._id}`,
          type: 'success'
        });
      }
    }

    res.json(booking);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    await Event.findOneAndDelete({ bookingRef: req.params.id });
    res.json({ message: 'Đã xóa booking và show liên quan' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};