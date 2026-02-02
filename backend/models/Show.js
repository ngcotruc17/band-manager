const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Tên Show
  customerName: { type: String, required: true }, // Tên khách
  phone: { type: String }, // SĐT
  
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  
  price: { type: Number, default: 0 }, // Tổng cát-xê
  deposit: { type: Number, default: 0 }, // Đã cọc
  
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  
  notes: { type: String }, // Ghi chú
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Ai tạo show này
}, { timestamps: true });

module.exports = mongoose.model('Show', showSchema);