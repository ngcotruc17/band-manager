const nodemailer = require('nodemailer');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const fmtMoney = (val) => new Intl.NumberFormat('vi-VN').format(val || 0) + 'đ';

// 1. Gửi mail cho TOÀN BỘ thành viên khi có Show mới
const sendNewShowEmail = async (show) => {
  try {
    const users = await User.find({ email: { $exists: true, $ne: null }, isApproved: true });
    const emails = users.map(u => u.email).filter(email => email && email.includes('@'));
    if (emails.length === 0) return;

    // Link web (Bạn đổi link này khi deploy)
    const webUrl = `https://sacband.vercel.app/bookings/${show._id}`;

    const mailOptions = {
      from: `"Sắc Band Manager" <${process.env.EMAIL_USER}>`,
      bcc: emails,
      subject: `🔥 SHOW MỚI: ${show.title}`,
      html: `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#F8FAFC;padding:40px 0;">
          <tbody>
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="500" style="background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">
                  <tbody>
                    <!-- Header -->
                    <tr>
                      <td align="center" style="background-color:#4F46E5;padding:30px 20px;">
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:1px;">SẮC BAND</div>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding:40px 30px;">
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;color:#1E293B;margin-bottom:10px;">🎸 Có show mới anh em ơi!</div>
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#64748B;line-height:22px;margin-bottom:25px;">Admin vừa duyệt một show diễn mới. Anh em kiểm tra thông tin và đăng ký tham gia ngay nhé.</div>
                        
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F1F5F9;border-radius:12px;padding:20px;">
                          <tbody>
                            <tr>
                              <td style="padding-bottom:15px;border-bottom:1px solid #E2E8F0;">
                                <div style="font-family:sans-serif;font-size:16px;font-weight:800;color:#4F46E5;">${show.title}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:15px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td width="80" style="font-family:sans-serif;font-size:13px;color:#64748B;padding-bottom:8px;">📅 Ngày:</td>
                                    <td style="font-family:sans-serif;font-size:13px;font-weight:600;color:#1E293B;padding-bottom:8px;">${new Date(show.date).toLocaleDateString('vi-VN')}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-family:sans-serif;font-size:13px;color:#64748B;padding-bottom:8px;">⏰ Giờ:</td>
                                    <td style="font-family:sans-serif;font-size:13px;font-weight:600;color:#1E293B;padding-bottom:8px;">${show.time}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-family:sans-serif;font-size:13px;color:#64748B;padding-bottom:8px;">📍 Địa điểm:</td>
                                    <td style="font-family:sans-serif;font-size:13px;font-weight:600;color:#1E293B;padding-bottom:8px;">${show.location}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-family:sans-serif;font-size:13px;color:#64748B;">💰 Cát-xê:</td>
                                    <td style="font-family:sans-serif;font-size:15px;font-weight:800;color:#059669;">${fmtMoney(show.price)}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:30px;">
                          <tr>
                            <td align="center">
                              <a href="${webUrl}" style="background-color:#1E293B;color:#ffffff;display:inline-block;padding:16px 32px;border-radius:10px;text-decoration:none;font-family:sans-serif;font-size:14px;font-weight:700;">ĐĂNG KÝ THAM GIA 🚀</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding:0 30px 40px 30px;text-align:center;">
                        <div style="font-family:sans-serif;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">Email tự động từ Sắc Band Manager</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      `
    };
    await transporter.sendMail(mailOptions);
  } catch (error) { console.error("Lỗi mail show mới:", error); }
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
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F0FDF4;padding:40px 0;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="500" style="background-color:#ffffff;border-radius:16px;border:1px solid #DCFCE7;">
                <tr>
                  <td align="center" style="background-color:#10B981;padding:30px;border-radius:16px 16px 0 0;">
                    <div style="font-family:sans-serif;color:#ffffff;font-size:20px;font-weight:800;">CHÚC MỪNG 🎉</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 30px;text-align:center;">
                    <div style="font-family:sans-serif;font-size:16px;color:#1E293B;margin-bottom:10px;">Chào <b>${userName}</b>,</div>
                    <div style="font-family:sans-serif;font-size:14px;color:#475569;line-height:22px;">Admin đã <b>DUYỆT</b> bạn vào đội hình chính thức cho show diễn:</div>
                    <div style="font-family:sans-serif;font-size:18px;font-weight:800;color:#059669;margin:20px 0;padding:15px;background-color:#F0FDF4;border-radius:10px;border:1px dashed #10B981;">${showTitle}</div>
                    <div style="font-family:sans-serif;font-size:13px;color:#64748B;">Hãy chuẩn bị bài vở thật kỹ nhé!</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `
    };
    await transporter.sendMail(mailOptions);
  } catch (error) { console.error("Lỗi mail duyệt:", error); }
};

module.exports = { sendNewShowEmail, sendApproveEmail };