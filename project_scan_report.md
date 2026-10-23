# 🎸 Comprehensive Project Audit & Scanning Report: Sắc Band Manager Ecosystem (v2.0)

> **Quét toàn diện:** Tháng 10/2026  
> **Phiên bản:** v2.0.0 (TypeScript + Next.js 16 + Express 5 + WebSockets)  
> **Trạng thái Codebase:** ✅ Build & Test Passed 100% (Backend 0 lỗi, Frontend 17 routes OK)

---

## 📍 1. Executive Summary

**Sắc Band Manager** (`band-booking-app`) là hệ thống quản lý toàn diện cho ban nhạc chuyên nghiệp với các nghiệp vụ:
- Quản lý lịch biểu diễn (Show) & danh sách nhạc công tham gia
- Tự động hóa phân bổ cát-xê theo ma trận vai trò & trích Quỹ Band
- Điểm danh tập luyện (Rehearsal) bằng mã QR Token động (JWT) & GPS
- Giá đỡ hợp âm sân khấu trực tiếp (**Live Stand**) đồng bộ thời gian thực qua WebSockets (Socket.io)
- Tự động đối soát giao dịch ngân hàng qua Webhook (SePay / Cassso syntax: `SHOW <ID>`, `PHAT <ID>`)
- Kho lưu trữ Sheet nhạc PDF & Beat demo MP3 kèm Trình phát Audio toàn cục (Global Audio Player)

---

## 🏗️ 2. Cấu Trúc Monorepo Hiện Tại

```
d:\ProjectVSC\band-booking-app
├── 📁 backend-v2/                # Server chính (Express 5 + TypeScript + MongoDB + Socket.io)
│   ├── src/
│   │   ├── config/               # db.ts (MongoDB), env.ts (Strict Env validation)
│   │   ├── controllers/          # 11 Controllers (Auth, Show, Rehearsal, Finance, Library...)
│   │   ├── middleware/           # auth.ts (JWT RBAC Guard), upload.ts (Multer storage)
│   │   ├── models/               # 10 Mongoose Schemas (User, Show, Rehearsal, Transaction...)
│   │   ├── routes/               # 11 Express Routers
│   │   ├── services/             # SocketService (WebSockets), NotificationService
│   │   ├── utils/                # sendEmail.ts (Nodemailer HTML templates)
│   │   └── __tests__/            # run-tests.ts, auth.test.ts, finance.test.ts
│   ├── uploads/                  # Thư mục lưu file beat MP3 và sheet PDF
│   ├── .env                      # File cấu hình môi trường bảo mật (đã gitignore)
│   └── .env.example              # Mẫu cấu hình môi trường chuẩn
│
├── 📁 frontend-v2/               # Web App chính (Next.js 16 + React 19 + Tailwind CSS v4)
│   ├── src/
│   │   ├── app/                  # Next.js App Router (17 routes)
│   │   │   ├── bookings/         # Quản lý Show & Rehearsal tabs
│   │   │   ├── bookings/[id]/    # Chi tiết Show, Setlist & Copy text cho Zalo
│   │   │   ├── checkin/          # Quét QR Camera & Điểm danh đa chế độ
│   │   │   ├── checkin/[rehearsalId]/ # Dynamic route điểm danh theo buổi tập
│   │   │   ├── rehearsals/       # Hub lịch tập & Quản lý QR token
│   │   │   ├── live-stand/       # Live Stage Teleprompter, đổi Tone & Auto-scroll
│   │   │   ├── library/          # Kho Beat & Sheet PDF
│   │   │   ├── repertoire/       # Danh mục bài hát & Lập setlist
│   │   │   ├── finance/          # Quản lý Quỹ, Thu/Chi, Log đối soát Webhook
│   │   │   ├── members/          # Danh sách nhân sự & Duyệt thành viên
│   │   │   ├── notifications/    # Trung tâm thông báo & Broadcast
│   │   │   ├── dashboard/        # Bảng điều khiển KPI & Doanh thu
│   │   │   ├── login/            # Đăng nhập bảo mật
│   │   │   ├── register/         # Đăng ký thành viên mới
│   │   │   └── change-password/  # Bắt buộc đổi mật khẩu lần đầu
│   │   ├── components/           # Navbar, GlobalAudioPlayer, BookingModal, ProfileModal
│   │   ├── context/              # AuthContext, AudioContext
│   │   └── services/             # api.ts (Axios client hỗ trợ LAN IP & JWT)
│   └── .env.example              # Mẫu cấu hình môi trường Frontend
│
├── 📄 package.json               # Root monorepo workspace scripts
└── 📄 README.md                  # Hướng dẫn kiến trúc & tài liệu dự án
```

---

## 🛠️ 3. Các Điểm Cải Tiến & Vá Lỗi Đã Thực Hiện

1. **Sửa lỗi định tuyến dynamic Next.js App Router**:
   - Thư mục bị encode `%5BrehearsalId%5D` đã được đổi tên thành `[rehearsalId]`. Route dynamic `ƒ /checkin/[rehearsalId]` hiện hoạt động chính xác.
2. **Sửa lỗi trích xuất `rehearsalId` trong `checkin/page.tsx`**:
   - Hỗ trợ đầy đủ tham số `searchParams.get("rehearsalId")` từ link QR Code tạo bởi Admin.
3. **Khai báo route bị thiếu**:
   - Gắn route `POST /api/rehearsals/:id/gps-bypass` cho controller `requestGPSBypass`.
4. **Nâng cấp Regex đối soát Bank Webhook**:
   - Nới lỏng khoảng trắng với `SHOW\s*([A-F0-9]{24})` và `PHAT\s*([A-F0-9]{24})` để nhận diện cả trường hợp không có dấu cách trong nội dung chuyển khoản.
5. **Đồng bộ nhận diện mạng LAN IP cho sân khấu**:
   - Cập nhật [live-stand/page.tsx](file:///d:/ProjectVSC/band-booking-app/frontend-v2/src/app/live-stand/page.tsx) và [AudioContext.tsx](file:///d:/ProjectVSC/band-booking-app/frontend-v2/src/context/AudioContext.tsx) nhận diện dải IP LAN để chạy WebSocket và phát Audio trực tiếp từ máy chủ nội bộ.
6. **Môi trường email**:
   - Cập nhật [sendEmail.ts](file:///d:/ProjectVSC/band-booking-app/backend-v2/src/utils/sendEmail.ts) dùng `process.env.FRONTEND_URL` thay vì URL localhost cứng.
7. **Bổ sung tệp mẫu `.env.example`**:
   - Tạo sẵn cho cả `backend-v2` và `frontend-v2`.

---

## 🧪 4. Kết Quả Kiểm Thử (Verification)

- **Backend Tests:** 6/6 bài kiểm tra passed (Bank Webhook regex parsing, Fine parsing, Salary Split 10% deduction, JWT generation/verification, Invalid signature rejection, Admin RBAC enforcement).
- **Backend Build:** `tsc` biên dịch thành công 0 lỗi.
- **Frontend Build:** `next build` hoàn thành với 17/17 routes được sinh tĩnh/SSR thành công.
