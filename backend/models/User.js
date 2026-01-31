const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, default: 'member', enum: ['admin', 'member'] } 
});

// --- SỬA LẠI: BỎ HẲN BIẾN 'next' ĐỂ HẾT LỖI ---
userSchema.pre('save', async function () { // <--- Xóa chữ 'next' ở đây
  // 1. Nếu mật khẩu không bị thay đổi thì thoát luôn, không làm gì cả
  if (!this.isModified('password')) {
    return; 
  }

  // 2. Mã hóa mật khẩu
  // Vì dùng async/await nên không cần gọi next() nữa, Mongoose tự hiểu
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Hàm kiểm tra mật khẩu (Giữ nguyên)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);