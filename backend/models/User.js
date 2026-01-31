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
  
  // 🔥 QUAN TRỌNG: Mặc định là 'pending' (Chờ duyệt)
  status: { 
    type: String, 
    enum: ['pending', 'active', 'banned'], 
    default: 'pending' 
  },
  
  instrument: { type: String, default: 'Chưa phân công' },
  createdAt: { type: Date, default: Date.now }
});

// Mã hóa mật khẩu
userSchema.pre('save', async function () { 
  if (!this.isModified('password')) return; 
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);