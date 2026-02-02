const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // 👇 Cho phép chấp nhận nhiều kiểu tên
  fullName: { type: String, required: true },
  
  // 👇 Email không bắt buộc (sparse: true) để user nhập username vẫn OK
  email: { type: String, unique: true, sparse: true }, 

  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
  status: { type: String, enum: ['pending', 'active', 'banned'], default: 'pending' },
  mustChangePassword: { type: Boolean, default: false },
  instrument: { type: String, default: 'Chưa phân công' },
  createdAt: { type: Date, default: Date.now }
});

// 🔥 SỬA ĐOẠN NÀY ĐỂ HẾT LỖI "next is not a function"
// (Bỏ chữ 'next' trong ngoặc và bỏ dòng next() ở cuối)
userSchema.pre('save', async function () { 
  if (!this.isModified('password')) {
    return; // Đã xong, tự động thoát
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // Không cần gọi next() nữa vì hàm async tự hiểu khi nào xong
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);