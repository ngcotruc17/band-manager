const nodemailer = require('nodemailer');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '')
  }
});

const fmtMoney = (val) => new Intl.NumberFormat('vi-VN').format(val || 0) + 'đ';

// 1. Gửi mail cho TOÀN BỘ thành viên khi có Show mới
const sendNewShowEmail = async (show) => {
  try {
    const users = await User.find({ email: { $exists: true, $ne: null }, isApproved: true });
    const emails = users.map(u => u.email).filter(email => email && email.includes('@'));
    if (emails.length === 0) return;

    // Link web
    const webUrl = `https://sacband.vercel.app/bookings/${show._id}`;

    const mailOptions = {
      from: `"Sắc Band Manager" <${process.env.EMAIL_USER}>`,
      bcc: emails,
      subject: `🎸 SHOW MỚI ĐÃ LÊN LỊCH: ${show.title}`,
      html: `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#F8FAFC;padding:40px 0;margin:0;">
          <tbody>
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="550" style="background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);">
                  <tbody>
                    <!-- Header -->
                    <tr>
                      <td align="center" style="background-gradient: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); background-color:#4F46E5; padding:40px 20px;">
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:2px;text-shadow:0 2px 4px rgba(0,0,0,0.1);">SẮC BAND</div>
                        <div style="font-family:sans-serif;color:#E0E7FF;font-size:12px;font-weight:700;margin-top:8px;text-transform:uppercase;letter-spacing:1px;">Booking Manager</div>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding:40px 35px;">
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:900;color:#1E293B;margin-bottom:12px;">🎸 Lịch diễn mới mở đăng ký!</div>
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#64748B;line-height:24px;margin-bottom:28px;">Admin vừa cập nhật lịch trình biểu diễn mới. Anh em kiểm tra chi tiết và click đăng ký đi diễn ngay nhé.</div>
                        
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F8FAFC;border:1px solid #F1F5F9;border-radius:16px;padding:25px;">
                          <tbody>
                            <tr>
                              <td style="padding-bottom:18px;border-bottom:2px dashed #E2E8F0;">
                                <div style="font-family:sans-serif;font-size:17px;font-weight:900;color:#4F46E5;">${show.title}</div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:18px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td width="90" style="font-family:sans-serif;font-size:13px;color:#94A3B8;padding-bottom:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">📅 Ngày:</td>
                                    <td style="font-family:sans-serif;font-size:14px;font-weight:800;color:#1E293B;padding-bottom:10px;">${new Date(show.date).toLocaleDateString('vi-VN')}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-family:sans-serif;font-size:13px;color:#94A3B8;padding-bottom:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">⏰ Giờ:</td>
                                    <td style="font-family:sans-serif;font-size:14px;font-weight:800;color:#1E293B;padding-bottom:10px;">${show.time}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-family:sans-serif;font-size:13px;color:#94A3B8;padding-bottom:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">📍 Địa điểm:</td>
                                    <td style="font-family:sans-serif;font-size:14px;font-weight:800;color:#1E293B;padding-bottom:10px;">${show.location}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-family:sans-serif;font-size:13px;color:#94A3B8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">💰 Cát-xê:</td>
                                    <td style="font-family:sans-serif;font-size:16px;font-weight:900;color:#059669;">${fmtMoney(show.price)}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
 
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:35px;">
                          <tr>
                            <td align="center">
                              <a href="${webUrl}" style="background-color:#1E293B;color:#ffffff;display:inline-block;padding:16px 40px;border-radius:12px;text-decoration:none;font-family:sans-serif;font-size:14px;font-weight:800;letter-spacing:1px;box-shadow:0 4px 6px -1px rgba(30,41,59,0.2);text-transform:uppercase;transition:all 0.2s ease;">ĐĂNG KÝ THAM GIA 🚀</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding:0 35px 40px 35px;text-align:center;border-top:1px solid #F1F5F9;padding-top:20px;">
                        <div style="font-family:sans-serif;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Email tự động gửi từ Sắc Band Manager</div>
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
      subject: `✅ BẠN ĐÃ ĐƯỢC DUYỆT ĐI SHOW: ${showTitle}`,
      html: `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F8FAFC;padding:40px 0;margin:0;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="500" style="background-color:#ffffff;border-radius:24px;border:1px solid #DCFCE7;box-shadow:0 10px 15px -3px rgba(0,0,0,0.02);">
                <tr>
                  <td align="center" style="background-color:#10B981;padding:35px;border-radius:24px 24px 0 0;">
                    <div style="font-family:sans-serif;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:1px;">CHÚC MỪNG 🎉</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 35px;text-align:center;">
                    <div style="font-family:sans-serif;font-size:15px;color:#1E293B;margin-bottom:12px;text-align:left;">Chào <b>${userName}</b>,</div>
                    <div style="font-family:sans-serif;font-size:14px;color:#475569;line-height:24px;text-align:left;margin-bottom:20px;">Admin đã **DUYỆT** bạn vào đội hình chính thức biểu diễn cho show diễn sau:</div>
                    
                    <div style="font-family:sans-serif;font-size:18px;font-weight:900;color:#047857;margin:25px 0;padding:20px;background-color:#F0FDF4;border-radius:16px;border:1px dashed #10B981;">
                      ${showTitle}
                    </div>
                    
                    <div style="font-family:sans-serif;font-size:13px;color:#64748B;line-height:20px;background-color:#F8FAFC;padding:15px;border-radius:12px;border:1px solid #E2E8F0;">
                      🎶 Hãy sẵn sàng bài vở thật kỹ và chuẩn bị đạo cụ biểu diễn đầy đủ nhé! Hẹn gặp bạn tại show diễn!
                    </div>
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

// 3. Gửi mail thông báo khi LỊCH TẬP MỚI được lên
const sendNewRehearsalEmail = async (rehearsal) => {
  try {
    const users = await User.find({ email: { $exists: true, $ne: null }, isApproved: true });
    const emails = users.map(u => u.email).filter(email => email && email.includes('@'));
    if (emails.length === 0) return;

    const mailOptions = {
      from: `"Sắc Band Manager" <${process.env.EMAIL_USER}>`,
      bcc: emails,
      subject: `⚡ LỊCH TẬP RÁP MỚI: Ngày ${new Date(rehearsal.date).toLocaleDateString('vi-VN')}`,
      html: `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#F8FAFC;padding:40px 0;margin:0;">
          <tbody>
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="550" style="background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);">
                  <tbody>
                    <!-- Header -->
                    <tr>
                      <td align="center" style="background-color:#6366F1; padding:35px 20px;">
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;font-size:24px;font-weight:900;letter-spacing:1.5px;">SẮC BAND</div>
                        <div style="font-family:sans-serif;color:#E0E7FF;font-size:11px;font-weight:700;margin-top:6px;text-transform:uppercase;letter-spacing:1px;">Lịch Tập Nhóm</div>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding:40px 35px;">
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:900;color:#1E293B;margin-bottom:12px;">🎸 Lên lịch tập ráp mới!</div>
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#64748B;line-height:24px;margin-bottom:25px;">Admin vừa chốt thời gian tập luyện ráp band. Anh em chủ động sắp xếp thời gian đi đầy đủ nhé.</div>
                        
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F8FAFC;border:1px solid #F1F5F9;border-radius:16px;padding:25px;">
                          <tbody>
                            <tr>
                              <td style="padding-bottom:18px;border-bottom:2px dashed #E2E8F0;">
                                <div style="font-family:sans-serif;font-size:16px;font-weight:800;color:#1E293B;">Nội dung tập: <span style="color:#6366F1;">${rehearsal.content || 'Tập ráp thường kỳ'}</span></div>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding-top:18px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                  <tr>
                                    <td width="90" style="font-family:sans-serif;font-size:13px;color:#94A3B8;padding-bottom:10px;font-weight:700;text-transform:uppercase;">📅 Ngày:</td>
                                    <td style="font-family:sans-serif;font-size:14px;font-weight:800;color:#1E293B;padding-bottom:10px;">${new Date(rehearsal.date).toLocaleDateString('vi-VN')}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-family:sans-serif;font-size:13px;color:#94A3B8;padding-bottom:10px;font-weight:700;text-transform:uppercase;">⏰ Giờ ráp:</td>
                                    <td style="font-family:sans-serif;font-size:14px;font-weight:800;color:#1E293B;padding-bottom:10px;">${rehearsal.time}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-family:sans-serif;font-size:13px;color:#94A3B8;font-weight:700;text-transform:uppercase;">📍 Phòng tập:</td>
                                    <td style="font-family:sans-serif;font-size:14px;font-weight:800;color:#1E293B;">${rehearsal.location}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <div style="margin-top:25px;font-family:sans-serif;font-size:12px;color:#EF4444;font-weight:700;background-color:#FEF2F2;border:1px solid #FEE2E2;padding:12px 18px;border-radius:12px;text-align:center;">
                          ⚠️ Đi muộn quá 15 phút sẽ tự động bị phạt 50k vào quỹ!
                        </div>
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
  } catch (error) { console.error("Lỗi mail lịch tập mới:", error); }
};

// 4. Gửi mail thông báo cho từng cá nhân khi CÁT-XÊ ĐÃ CHIA
const sendSalarySplitEmail = async (show) => {
  try {
    if (!show.salarySplit || !show.salarySplit.members || show.salarySplit.members.length === 0) return;

    for (const member of show.salarySplit.members) {
      // Tìm email của thành viên
      const user = await User.findById(member.user);
      if (!user || !user.email || !user.email.includes('@')) continue;

      const memberAmount = member.amount || 0;
      
      const mailOptions = {
        from: `"Sắc Band Manager" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `💸 CÁT-XÊ ĐÃ CHIA VỀ TÀI KHOẢN: Show "${show.title}"`,
        html: `
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F8FAFC;padding:40px 0;margin:0;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="520" style="background-color:#ffffff;border-radius:24px;border:1px solid #E2E8F0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.03);">
                  <tr>
                    <td align="center" style="background-color:#059669;padding:35px;border-radius:24px 24px 0 0;">
                      <div style="font-family:sans-serif;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:1.5px;">CÁT-XÊ ĐÃ VỀ 💰</div>
                      <div style="font-family:sans-serif;color:#D1FAE5;font-size:12px;font-weight:700;margin-top:8px;text-transform:uppercase;">Show Hoàn Thành</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px 35px;text-align:center;">
                      <div style="font-family:sans-serif;font-size:15px;color:#1E293B;margin-bottom:12px;text-align:left;">Chào <b>${user.fullName}</b>,</div>
                      <div style="font-family:sans-serif;font-size:14px;color:#475569;line-height:24px;text-align:left;margin-bottom:20px;">Show diễn của chúng ta đã được tính toán dòng tiền. Cát-xê cụ thể được phân bổ cho bạn như sau:</div>
                      
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ECFDF5;border:1px solid #D1FAE5;border-radius:16px;padding:20px;margin:25px 0;text-align:left;">
                        <tr>
                          <td style="font-family:sans-serif;font-size:13px;color:#065F46;padding-bottom:8px;font-weight:700;">Tên Show diễn:</td>
                          <td style="font-family:sans-serif;font-size:14px;font-weight:800;color:#1E293B;padding-bottom:8px;">${show.title}</td>
                        </tr>
                        <tr>
                          <td style="font-family:sans-serif;font-size:13px;color:#065F46;padding-bottom:8px;font-weight:700;">Tổng Doanh Thu:</td>
                          <td style="font-family:sans-serif;font-size:14px;font-weight:800;color:#1E293B;padding-bottom:8px;">${fmtMoney(show.salarySplit.totalPrice)}</td>
                        </tr>
                        <tr>
                          <td style="font-family:sans-serif;font-size:13px;color:#065F46;padding-bottom:8px;font-weight:700;">Trích Quỹ Band (${show.salarySplit.bandFundPercent}%):</td>
                          <td style="font-family:sans-serif;font-size:14px;font-weight:800;color:#DC2626;padding-bottom:8px;">-${fmtMoney(show.salarySplit.bandFundAmount)}</td>
                        </tr>
                        <tr>
                          <td style="font-family:sans-serif;font-size:13px;color:#065F46;font-weight:700;">Cát-xê của bạn:</td>
                          <td style="font-family:sans-serif;font-size:17px;font-weight:900;color:#059669;">${fmtMoney(memberAmount)}</td>
                        </tr>
                      </table>
                      
                      <div style="font-family:sans-serif;font-size:13px;color:#64748B;line-height:22px;background-color:#F8FAFC;padding:15px;border-radius:12px;border:1px solid #E2E8F0;">
                        💸 Khoản tiền trên đã được cập nhật vào lịch sử tài chính của ban nhạc. Thủ quỹ sẽ thực hiện thanh toán trực tiếp cho bạn trong thời gian sớm nhất!
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        `
      };
      await transporter.sendMail(mailOptions);
    }
  } catch (error) { console.error("Lỗi gửi mail cát-xê hoàn thành:", error); }
};

// 5. Gửi mail thông báo tùy chỉnh từ Admin
const sendCustomAdminEmail = async (subject, contentHtml, recipientEmails) => {
  try {
    if (!recipientEmails || recipientEmails.length === 0) return;
    
    const mailOptions = {
      from: `"Sắc Band Manager" <${process.env.EMAIL_USER}>`,
      subject: `[THÔNG BÁO] ${subject}`,
      html: `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;background-color:#F8FAFC;padding:40px 0;margin:0;">
          <tbody>
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="800" style="max-width: 800px; width: 95%; background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.05);">
                  <tbody>
                    <!-- Header -->
                    <tr>
                      <td align="center" style="background: linear-gradient(135deg, #6366F1 0%, #EC4899 100%); background-color:#6366F1; padding:40px 20px;">
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;font-size:24px;font-weight:900;letter-spacing:1.5px;text-shadow:0 2px 4px rgba(0,0,0,0.1);">SẮC BAND</div>
                        <div style="font-family:sans-serif;color:#E0E7FF;font-size:11px;font-weight:700;margin-top:6px;text-transform:uppercase;letter-spacing:1px;">Thông Báo Từ Admin</div>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding:40px 35px;">
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:18px;font-weight:900;color:#1E293B;margin-bottom:18px;">${subject}</div>
                        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;color:#334155;line-height:26px;white-space:pre-wrap;">${contentHtml}</div>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding:0 35px 40px 35px;text-align:center;border-top:1px solid #F1F5F9;padding-top:20px;">
                        <div style="font-family:sans-serif;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Email tự động gửi từ hệ thống Sắc Band Manager</div>
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

    if (recipientEmails.length === 1) {
      mailOptions.to = recipientEmails[0];
    } else {
      mailOptions.bcc = recipientEmails;
    }

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Lỗi gửi mail tùy chỉnh:", error);
  }
};

module.exports = { 
  sendNewShowEmail, 
  sendApproveEmail, 
  sendNewRehearsalEmail, 
  sendSalarySplitEmail,
  sendCustomAdminEmail
};