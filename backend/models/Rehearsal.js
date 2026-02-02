const mongoose = require('mongoose');

const rehearsalSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  content: { type: String, required: true },
  
  // Danh sách điểm danh
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { 
      type: String, 
      enum: ['present', 'late', 'absent', 'unknown'], 
      default: 'unknown' 
    },
    note: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Rehearsal', rehearsalSchema);