const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  note: { type: String }, // Ghi chú (Tone/Nhịp)
  sheetUrl: { type: String }, // Đường dẫn file PDF
  beatUrl: { type: String },  // Đường dẫn file MP3
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Song', songSchema);