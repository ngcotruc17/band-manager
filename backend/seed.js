// backend/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // Đảm bảo đường dẫn đúng

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('DB Connected');
    // Xóa user cũ nếu cần
    // await User.deleteMany({}); 
    
    // Tạo Admin
    const admin = new User({
      username: 'admin',
      password: '123', // Password chưa hash (model sẽ tự hash)
      fullName: 'Trưởng Band',
      role: 'admin',
      instrument: 'All'
    });

    await admin.save();
    console.log('Đã tạo User Admin: username: admin / pass: 123');
    process.exit();
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });