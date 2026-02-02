const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  
  // 👇 THÊM DÒNG NÀY (Quan trọng):
  email: { type: String, required: true, unique: true },

  // 👇 Sửa lại Username: Cho phép null hoặc bỏ yêu cầu bắt buộc nếu bạn chỉ đăng ký bằng Email
  username: { type: String, unique: true, sparse: true }, 

  password: { type: String, required: true },
  
  role: { 
    type: String, 
    enum: ['admin', 'member', 'viewer'], 
    default: 'member' 
  },
  
  status: { 
    type: String, 
    enum: ['pending', 'active', 'banned'], 
    default: 'pending' 
  },

  mustChangePassword: { type: Boolean, default: false },
  instrument: { type: String, default: 'Chưa phân công' },
  createdAt: { type: Date, default: Date.now }
});

// Middleware mã hóa mật khẩu (Giữ nguyên)
userSchema.pre('save', async function (next) { 
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Hàm kiểm tra mật khẩu (Giữ nguyên)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);