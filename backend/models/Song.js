const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  name: { type: String, required: true },
  note: String, // Ghi chú (VD: Hát tone Nam, vào nhịp 2)
  sheetUrl: String, // Đường dẫn file PDF
  beatUrl: String,  // Đường dẫn file MP3
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' } // Thuộc về Event nào
}, { timestamps: true });

module.exports = mongoose.model('Song', songSchema);