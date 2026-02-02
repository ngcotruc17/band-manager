const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, default: "19:00" }, // 👈 Đã thêm trường Time
  location: { type: String, required: true },
  description: { type: String },
  logistics: { type: String }, 
  cast: { type: Number, default: 0 },
  
  // Liên kết với Booking (nếu có)
  bookingRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },

  // Danh sách người tham gia
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    isSelected: { type: Boolean, default: false } // false: Chờ duyệt, true: Chính thức
  }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);