const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người nhận
  sender: { type: String, default: 'Hệ thống' }, // Người gửi (hoặc System)
  message: { type: String, required: true }, // Nội dung
  link: { type: String, default: '' }, // Link khi bấm vào (VD: /events/123)
  isRead: { type: Boolean, default: false }, // Đã đọc chưa
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);