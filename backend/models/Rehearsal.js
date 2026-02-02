const mongoose = require('mongoose');

const rehearsalSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  time: { type: String, required: true }, // VD: "19:00 - 21:00"
  location: { type: String, required: true },
  content: { type: String }, // Nội dung tập
  
  // Danh sách điểm danh (Tự động thêm tất cả thành viên vào đây)
  attendance: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link tới bảng User
    status: { 
      type: String, 
      enum: ['present', 'late', 'absent', 'pending'], 
      default: 'pending' 
    },
    fine: { type: Number, default: 0 } // Tiền phạt
  }]
}, { timestamps: true });

module.exports = mongoose.model('Rehearsal', rehearsalSchema);