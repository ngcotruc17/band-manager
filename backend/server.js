const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Đảm bảo đã cài: npm install cors
const connectDB = require('./config/db');
const path = require('path');
const dashboardRoutes = require('./routes/dashboard.routes');

dotenv.config();
connectDB();

const app = express();

// --- 👇 SỬA ĐOẠN NÀY ĐỂ FIX LỖI CORS ---
app.use(cors({
  origin: [
    'http://localhost:5173',      // Cho phép máy cá nhân (Dev)
    'https://sacband.vercel.app', // Cho phép web trên Vercel (Production)
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
  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại port ${PORT}`));