const mongoose = require('mongoose');

const RehearsalSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  location: { type: String, default: 'Phòng tập quen' },
  content: { type: String, required: true }, // Tập bài gì
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { 
      type: String, 
      enum: ['pending', 'present', 'late', 'absent'], 
      default: 'pending' 
    },
    fine: { type: Number, default: 0 } // Tiền phạt
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rehearsal', RehearsalSchema);