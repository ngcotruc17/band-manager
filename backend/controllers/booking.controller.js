const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { sendNewShowEmail } = require('../utils/sendEmail'); 
const { notifyAllMembers } = require('./notification.controller'); // Import thông báo

// 1. Get Bookings
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 2. Create Booking
exports.createBooking = async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
    await newBooking.save();

    await Event.create({
      title: `Show: ${newBooking.customerName}`,
      date: newBooking.date,
      location: 'Chưa cập nhật (Cập nhật sau)',
      bookingRef: newBooking._id
    });

    res.status(201).json(newBooking);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

// 3. Update Status (Duyệt -> Gửi Mail + Thông báo Web)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (status === 'approved') {
      const event = await Event.findOne({ bookingRef: booking._id });
      if (event) {
        // 1. Gửi Email
        sendNewShowEmail(event); 

        // 2. Gửi Thông báo Web
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

// 4. Delete Booking
exports.deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    await Event.findOneAndDelete({ bookingRef: req.params.id });
    res.json({ message: 'Đã xóa booking và show liên quan' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};