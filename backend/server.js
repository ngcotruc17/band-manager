const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Đảm bảo đã cài: npm install cors
const connectDB = require('./config/db');
const path = require('path');
const dashboardRoutes = require('./routes/dashboard.routes');
const commentRoutes = require('./routes/comment.routes');
const fs = require('fs');

dotenv.config();
connectDB();

const app = express();

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
    console.log("📂 Đã tạo thư mục 'uploads' thành công!");
}

// --- 👇 SỬA ĐOẠN NÀY ĐỂ FIX LỖI CORS ---
app.use(cors({
  origin: [
    'http://localhost:5173',      // Cho phép máy cá nhân (Dev)
    'https://sacband.vercel.app', // 👈 THÊM DÒNG NÀY: Link web của bạn trên Vercel
    'http://localhost:3000'       // (Dự phòng)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // Cho phép gửi cookie/token nếu có
}));
// ----------------------------------------

// Route đánh thức server (Ping)
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: "Server is awake! ☕" });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/events', require('./routes/event.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/rehearsals', require('./routes/rehearsals.routes'));
app.use('/api/finance', require('./routes/finance.routes'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/comments', require('./routes/comment.routes'));
app.use('/api/library', require('./routes/library.routes'));
app.use('/api/shows', require('./routes/show.routes'));
  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại port ${PORT}`));