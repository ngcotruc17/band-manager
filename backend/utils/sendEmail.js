const nodemailer = require('nodemailer');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

// Cấu hình Transporter (Người đưa thư)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. Gửi mail cho TOÀN BỘ thành viên khi có Show mới
const sendNewShowEmail = async (show) => {
  try {
    // Chỉ lấy những user có email hợp lệ
    const users = await User.find({ email: { $exists: true, $ne: null } });
    
    const emails = users
        .map(u => u.email)
        .filter(email => email && email.includes('@')); // Lọc kỹ lại lần nữa

    if (emails.length === 0) {
        console.log("⚠️ Không tìm thấy email nào để gửi.");
        return;
    }

    const mailOptions = {
      from: `"Sắc Band Manager" <${process.env.EMAIL_USER}>`,
      bcc: emails, // Dùng BCC để bảo mật danh sách email (người nhận không thấy email người khác)
      subject: `🔥 SHOW MỚI: ${show.title} - Đăng ký ngay!`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d00000; text-align: center;">🎸 Có Show Mới Anh Em Ơi!</h2>
          <p>Admin vừa duyệt và mở đăng ký cho show mới. Vào xí chỗ ngay kẻo hết slot!</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${show.title}</h3>
            <p><strong>📅 Ngày:</strong> ${new Date(show.date).toLocaleDateString('vi-VN')}</p>
            <p><strong>⏰ Giờ:</strong> ${show.time}</p>
            <p><strong>📍 Địa điểm:</strong> ${show.location}</p>
            <p><strong>💰 Cát-xê dự kiến:</strong> ${show.price ? show.price.toLocaleString() : 0}đ</p>
          </div>

          <div style="text-align: center;">
            <a href="https://sacband.vercel.app/bookings/${show._id}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              👉 Vào Web Đăng Ký Ngay
            </a>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #888; text-align: center;">Email tự động từ hệ thống Sắc Band.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Đã gửi thông báo show mới tới ${emails.length} người.`);
  } catch (error) {
    console.error("❌ Lỗi gửi email show mới:", error);
  }
};

// 2. Gửi mail cho 1 NGƯỜI khi được duyệt đi show
const sendApproveEmail = async (userEmail, showTitle, userName) => {
  try {
    if (!userEmail || !userEmail.includes('@')) return;

    const mailOptions = {
      from: `"Sắc Band Manager" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `✅ BẠN ĐÃ ĐƯỢC DUYỆT: ${showTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #4ade80; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a; text-align: center;">🎉 Chúc mừng ${userName}!</h2>
          <p>Admin đã <strong>DUYỆT</strong> bạn vào đội hình chính thức cho show: <strong>${showTitle}</strong>.</p>
          
          <div style="background: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p>Hãy nhớ lịch tập và chuẩn bị bài vở kỹ càng nhé!</p>
          </div>

          <div style="text-align: center; margin-top: 15px;">
             <a href="https://sacband.vercel.app/bookings" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Xem Lịch Diễn
            </a>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #888; text-align: center;">Email tự động từ hệ thống Sắc Band.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Đã gửi mail duyệt tới ${userEmail}`);
  } catch (error) {
    console.error("❌ Lỗi gửi email duyệt:", error);
  }
};

module.exports = { sendNewShowEmail, sendApproveEmail };