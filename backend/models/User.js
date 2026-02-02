const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  role: { 
    type: String, 
    enum: ['admin', 'member', 'viewer'], 
    default: 'member' 
  },
  
  // 🔥 Trạng thái tài khoản
  status: { 
    type: String, 
    enum: ['pending', 'active', 'banned'], 
    default: 'pending' 
  },

  // 👇 MỚI THÊM: Cờ đánh dấu cần đổi mật khẩu lần đầu
  // Mặc định là false (cho người dùng tự đăng ký).
  // Nếu Admin tạo user, Controller sẽ set cái này thành true.
  mustChangePassword: { type: Boolean, default: false },
  
  instrument: { type: String, default: 'Chưa phân công' },
  createdAt: { type: Date, default: Date.now }
});

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function (next) { 
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Hàm kiểm tra mật khẩu
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);