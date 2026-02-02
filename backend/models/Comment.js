const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  
  // 👇 Sửa thành 'event' cho khớp với Controller của bạn
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);