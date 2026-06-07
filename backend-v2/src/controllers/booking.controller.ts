import { Response } from 'express';
import Booking from '../models/Booking';
import Event from '../models/Event';
import { AuthenticatedRequest } from '../middleware/auth';

export const getBookings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    
    // Tìm các booking đang "Approved" (Đã duyệt)
    const activeBookings = await Booking.find({ status: 'approved' });
    const events = await Event.find({ bookingRef: { $in: activeBookings.map(b => b._id) } });

    // Duyệt qua từng booking để check giờ
    const updates = activeBookings.map(async (booking) => {
      const event = events.find(e => e.bookingRef && e.bookingRef.toString() === booking._id.toString());
      const showDate = new Date(booking.date);
      const timeStr = event?.time || "23:59"; 
      const [hours, minutes] = timeStr.split(':').map(Number);
      
      showDate.setHours(hours || 23, minutes || 59, 0);

      if (now > showDate) {
        booking.status = 'completed';
        await booking.save();
      }
    });

    await Promise.all(updates);

    const bookings = await Booking.find().sort({ date: -1 });
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    res.json(booking);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteBooking = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      await Event.findOneAndDelete({ bookingRef: booking._id });
      await Booking.findByIdAndDelete(req.params.id);
    }
    res.json({ message: 'Đã xóa booking và event liên quan' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
