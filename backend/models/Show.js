const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  title: { type: String, required: true },
  customerName: { type: String, required: true },
  phone: { type: String },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, default: 0 },
  deposit: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // 👇 THÊM: Cờ khóa đăng ký (Chốt sổ thành viên)
  isRegistrationClosed: { type: Boolean, default: false },

  // 👇 SỬA: Thêm trạng thái duyệt cho từng người
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, default: 'Thành viên' },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' }, // pending: Chờ duyệt, approved: Đã duyệt
    joinedAt: { type: Date, default: Date.now }
  }]

}, { timestamps: true });

module.exports = mongoose.model('Show', showSchema);