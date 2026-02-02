const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

dotenv.config();
connectDB();

const app = express();
// Route đánh thức server (Ping)
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: "Server is awake! ☕" });
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/events', require('./routes/event.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

// Các route khác tạm thời comment lại nếu chưa có file
app.use('/api/rehearsals', require('./routes/rehearsals.routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại port ${PORT}`));