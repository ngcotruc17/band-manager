const nodemailer = require('nodemailer');
const User = require('../models/User');

const sendNewShowEmail = async (eventData) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const users = await User.find({});
    
    // --- ĐOẠN ĐÃ SỬA LỖI ---
    const emails = users
      .map(u => u.username)
      // Thêm điều kiện (email && ...) để đảm bảo có dữ liệu rồi mới check @
      .filter(email => email && email.includes('@')); 
    // -----------------------

    if (emails.length === 0) {
      console.log("⚠️ Không tìm thấy email hợp lệ nào để gửi.");
      return;
    }

    const mailOptions = {
      from: `"Band Manager" <${process.env.EMAIL_USER}>`,
      to: emails,
      subject: `🔥 CÓ SHOW MỚI: ${eventData.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #2563eb; text-align: center;">🎸 Show Mới Đã Được Duyệt!</h2>
          <p>Chào anh em,</p>
          <p>Admin vừa chốt một kèo mới. Anh em vào đăng ký ngay kẻo lỡ nhé!</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>🎤 Show:</strong> ${eventData.title}</p>
            <p><strong>📅 Ngày:</strong> ${new Date(eventData.date).toLocaleDateString('vi-VN')}</p>
            <p><strong>📍 Địa điểm:</strong> ${eventData.location}</p>
          </div>

          <div style="text-align: center;">
            <a href="http://localhost:5173/dashboard" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              👉 Vào Web Đăng Ký Ngay
            </a>
          </div>
          <p style="margin-top: 20px; font-size: 12px; color: #888; text-align: center;">Email này được gửi tự động từ hệ thống Band Manager.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Đã gửi email thông báo thành công!");

  } catch (error) {
    console.error("❌ Lỗi gửi email:", error);
  }
};

module.exports = { sendNewShowEmail };