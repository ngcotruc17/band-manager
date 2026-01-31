const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, default: 'Chưa cập nhật' },
  
  eventType: { 
    type: String, 
    enum: ['restaurant', 'festival', 'private', 'practice'],
    default: 'private'
  },
  
  bookingRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  logistics: { type: String, default: '' },
  
  // --- THÊM DÒNG NÀY: CÁT-XÊ (Mặc định là 0) ---
  cast: { type: Number, default: 0 }, 
  
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    isSelected: { type: Boolean, default: false }
  }]

}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);