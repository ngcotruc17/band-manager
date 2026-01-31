const mongoose = require('mongoose');

const librarySongSchema = new mongoose.Schema({
  name: { type: String, required: true },
  note: { type: String, default: '' },
  sheetUrl: { type: String, default: '' },
  beatUrl: { type: String, default: '' },
  category: { type: String, default: 'Nhạc Trẻ' }, // Phân loại (nếu thích)
}, { timestamps: true });

module.exports = mongoose.model('LibrarySong', librarySongSchema);