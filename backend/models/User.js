const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  
  // 👇 Email: sparse=true để cho phép null (user cũ chưa có email)
  email: { type: String, unique: true, sparse: true }, 
  phone: { type: String, default: "" }, // Thêm SĐT

  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
  status: { type: String, enum: ['pending', 'active', 'banned'], default: 'pending' },
  mustChangePassword: { type: Boolean, default: false },
  instrument: { type: String, default: 'Chưa phân công' },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function () { 
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);