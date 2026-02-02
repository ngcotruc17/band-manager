const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  // Mình thêm trường 'name' vào đây để hỗ trợ code cũ của bạn nếu cần
  title: { type: String, required: true },
  name: { type: String }, 

  note: { type: String }, // Ghi chú (Tone/Nhịp)
  sheetUrl: { type: String }, // Đường dẫn file PDF
  beatUrl: { type: String },  // Đường dẫn file MP3
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // 👇 Đã thêm dấu phẩy ở cuối dòng này
  createdAt: { type: Date, default: Date.now }, 
  
  // 👇 Dòng này giờ sẽ chạy ngon lành
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' } 
});

module.exports = mongoose.model('Song', songSchema);