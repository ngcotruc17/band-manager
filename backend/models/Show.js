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
  isRegistrationClosed: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, default: 'Thành viên' },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
    joinedAt: { type: Date, default: Date.now }
  }],

  // 👇 THÊM ĐOẠN NÀY: Danh sách bài hát (Setlist)
  setlist: [{
    title: { type: String, required: true }, // Tên bài
    link: { type: String }, // Link beat/sheet (Drive/Youtube)
    note: { type: String }, // Ghi chú (Tone, điệu...)
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // Tự động phân chia cát-xê
  salarySplit: {
    totalPrice: { type: Number, default: 0 },
    bandFundPercent: { type: Number, default: 10 },
    bandFundAmount: { type: Number, default: 0 },
    memberAmount: { type: Number, default: 0 },
    members: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      amount: { type: Number, default: 0 }
    }]
  }

}, { timestamps: true });

module.exports = mongoose.model('Show', showSchema);