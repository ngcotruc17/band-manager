# 🎸 Sắc Band Manager Ecosystem (v2.0)

A modern full-stack application designed for managing band bookings, member schedules, automated rehearsal check-in (QR/GPS), live stage teleprompter & chord viewer, dynamic salary distribution, and automatic bank reconciliation via webhooks.

## 🚀 Architecture Overview

This repository has completed the migration from legacy v1 (JavaScript) to **v2 (TypeScript + Next.js 16 + Express 5 + WebSockets)**:

- **`backend-v2/`** *(Primary Backend Server)*:
  - Express.js 5 + TypeScript + Mongoose (MongoDB).
  - Socket.io server for real-time live-stage chord sync, scrolling, and notifications.
  - Automated Bank Reconciliation Webhook service (SePay / Cassso syntax parser).
  - Rate limiting (`express-rate-limit`), security headers (`helmet`), strict webhook validation.
- **`frontend-v2/`** *(Primary Frontend Web App)*:
  - Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4.
  - Live Stage Chord Teleprompter & Transposer (`/live-stand`).
  - Global Audio Player for backing tracks and sheet music PDF viewer.
  - QR Code reader for rehearsal check-in.
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
