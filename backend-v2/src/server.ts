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

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env, validateEnv } from './config/env';

dotenv.config();

// Kiểm tra biến môi trường
validateEnv();

// Kết nối cơ sở dữ liệu
connectDB();

const app = express();
const server = http.createServer(app);

// Khởi tạo WebSockets
const io = SocketService.init(server);

// 🛡️ Security Headers với Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Tương thích với audio streaming và SVG inline
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 🛡️ CORS Linh hoạt - Phải được đăng ký TRƯỚC Rate Limiter và Routes!
const isAllowedOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin) return callback(null, true);

  if (!env.IS_PRODUCTION) {
    return callback(null, true);
  }

  if (env.CORS_ALLOWED_ORIGINS.includes(origin)) {
    return callback(null, true);
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)
    ) {
      return callback(null, true);
    }
  } catch {
    // Ignore
  }

  callback(new Error('Not allowed by CORS'));
};

app.use(cors({
  origin: isAllowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

// 🛡️ Rate Limiting chống tấn công Brute-force & Spam (Đăng ký SAU CORS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 300, // 300 requests / 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Quá nhiều yêu cầu từ IP của bạn, vui lòng thử lại sau 15 phút!" }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 50, // 50 lần thử / 15 phút
  message: { message: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút!" }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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

// Khởi chạy máy chủ trên 0.0.0.0 để lắng nghe tất cả IP trong mạng LAN
const PORT = Number(process.env.PORT) || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sắc Band Server v2.0 đang chạy tại cổng ${PORT} (0.0.0.0)`);
});

