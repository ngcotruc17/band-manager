const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  contactInfo: { type: String, required: true },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'completed', 'cancelled'], // Thêm trạng thái completed, cancelled
    default: 'pending' 
  },
  note: { type: String, default: '' } // Thêm ghi chú nếu cần
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);