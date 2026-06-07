import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import connectDB from './config/db';
import financeRoutes from './routes/finance.routes';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import showRoutes from './routes/show.routes';
import bookingRoutes from './routes/booking.routes';
import eventRoutes from './routes/event.routes';
import commentRoutes from './routes/comment.routes';
import libraryRoutes from './routes/library.routes';
import rehearsalsRoutes from './routes/rehearsals.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationRoutes from './routes/notification.routes';
import { SocketService } from './services/socket.service';

dotenv.config();

// Kết nối cơ sở dữ liệu
connectDB();

const app = express();
const server = http.createServer(app);

// Khởi tạo WebSockets
const io = SocketService.init(server);

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://sacband.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cung cấp các file tĩnh (beat, sheet)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Kiểm tra trạng thái máy chủ
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: "Sắc Band Backend v2.0 is fully operational! 🚀" });
});

// Khai báo Routes
app.use('/api/finance', financeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/rehearsals', rehearsalsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Khởi chạy máy chủ
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Sắc Band Server v2.0 đang chạy tại cổng ${PORT}`);
});

