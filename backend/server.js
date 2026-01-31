const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Load config
dotenv.config();

// Connect DB
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth.routes');
const bookingRoutes = require('./routes/booking.routes');
const eventRoutes = require('./routes/event.routes');
const notificationRoutes = require('./routes/notification.routes');
const libraryRoutes = require('./routes/library.routes');
const commentRoutes = require('./routes/comment.routes'); // <--- 1. IMPORT

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/comments', commentRoutes); // <--- 2. ĐĂNG KÝ
app.use('/api/rehearsals', require('./routes/rehearsals')); // <--- 3. ĐĂNG KÝ ROUTE LỊCH TẬP

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));