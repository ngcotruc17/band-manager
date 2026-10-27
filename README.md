# 🎸 FPTU Band Manager Ecosystem (v2.0)

Hệ thống quản lý toàn diện dành cho **CLB Âm Nhạc Đại Học FPT (FPTU Band)**: quản lý lịch trình biểu diễn (Bookings), lịch tập ráp (Rehearsals), điểm danh GPS/QR Code, kho bài hát & sheet nhạc, tài chính đối soát tự động qua Webhook ngân hàng, với giao diện hiện đại phong cách Apple iOS / Samsung OneUI và chủ đề FPT Orange đặc trưng.

## 🚀 Architecture Overview

This repository features **v2 (TypeScript + Next.js 16 + Express 5 + WebSockets)**:

- **`frontend-v2/`** *(Primary Frontend Web App)*:
  - Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4.
  - **FPT Orange Theme** (`#F27024`, `#EA580C`) với hiệu ứng Frosted Glass, Squircles và Inset Grouped Cards.
  - **Thiết kế thích ứng đa nền tảng (PC & Mobile)**:
    - Desktop: Navigation Header dạng Floating Island cao cấp.
    - Mobile: Thumb-friendly Floating Bottom Dock phong cách OneUI/iOS + Bottom Sheet Drawer linh hoạt.
  - Global Audio Player cho backing tracks và sheet PDF viewer.
  - QR Code & Camera reader cho điểm danh tập nhạc nội bộ FPTU.
- **`backend-v2/`** *(Primary Backend Server)*:
  - Express.js 5 + TypeScript + Mongoose (MongoDB).
  - Socket.io server cho thông báo thời gian thực.
  - Automated Bank Reconciliation Webhook service (SePay / Cassso syntax parser).
  - Rate limiting (`express-rate-limit`), security headers (`helmet`), strict webhook validation.
- **`backend/` & `frontend/`** *(Legacy v1.0)*:
  - Preserved for backwards compatibility reference.

---

## 🔒 Security Features

1. **Strict Webhook Authentication**: Bank reconciliation webhooks mandate `WEBHOOK_SECRET` matching headers.
2. **Rate Limiting**: Protects `/api/auth/login`, `/api/auth/register`, and `/api/finance/bank-webhook` against brute-force attacks.
3. **HTTP Security Headers**: Powered by `helmet` to mitigate XSS, clickjacking, and MIME-sniffing.
4. **Role-Based Access Control (RBAC)**: Enforces `admin`, `member`, and `viewer` permissions.
5. **Environment Variable Validation**: Mandatory validation at startup for `JWT_SECRET`, `MONGO_URI`, `WEBHOOK_SECRET`, `CORS_ALLOWED_ORIGINS`.

---

## ⚙️ Environment Variables (`backend-v2/.env`)

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/band-manager
JWT_SECRET=your_super_secret_jwt_key_here
WEBHOOK_SECRET=your_bank_webhook_secret_key
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://sacband.vercel.app
```

---

## 🛠️ Scripts & Commands

From the root directory:
```bash
# Start backend-v2 development server
npm run dev:backend

# Start frontend-v2 Next.js app
npm run dev:frontend

# Build backend-v2 TypeScript
npm run build:backend

# Build frontend-v2 Next.js app
npm run build:frontend

# Run backend unit tests
npm run test:backend
```
