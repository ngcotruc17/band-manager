const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const connectDB = require('./config/db');
const path = require('path');
const dashboardRoutes = require('./routes/dashboard.routes');
const fs = require('fs');

dotenv.config();
connectDB();

const app = express();

// 1. Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(process.cwd(), 'uploads'); // Dùng process.cwd() an toàn hơn
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
    console.log("📂 Đã tạo thư mục 'uploads' thành công!");
}

app.use(cors({
  origin: [
    'http://localhost:5173',      
    'https://sacband.vercel.app', 
    'http://localhost:3000'       
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true 
}));

app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: "Server is awake! ☕" });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Cấu hình đường dẫn tĩnh cho file Upload (QUAN TRỌNG)
// Dùng process.cwd() để trùng khớp với nơi Multer lưu file
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/events', require('./routes/event.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/rehearsals', require('./routes/rehearsals.routes'));
app.use('/api/finance', require('./routes/finance.routes'));
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/comments', require('./routes/comment.routes'));
app.use('/api/library', require('./routes/library.routes'));
app.use('/api/shows', require('./routes/show.routes'));
app.use('/api/songs', require('./routes/song.routes')); // (Nếu bạn dùng file riêng)
  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại port ${PORT}`));