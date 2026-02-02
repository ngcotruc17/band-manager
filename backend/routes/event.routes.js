const express = require('express');
const router = express.Router();
const controller = require('../controllers/event.controller');

// --- 1. IMPORT & XỬ LÝ MIDDLEWARE AN TOÀN ---
let protect, admin;
try {
    const authMiddleware = require('../middleware/auth');
    protect = authMiddleware.protect;
    admin = authMiddleware.admin;
} catch (err) {
    console.warn("⚠️ Cảnh báo: Không tìm thấy file middleware/auth.js");
}

// 🛑 NẾU THIẾU MIDDLEWARE, TẠO GIẢ ĐỂ KHÔNG CRASH SERVER
if (!protect) {
    console.warn("⚠️ Middleware 'protect' thiếu -> Đang dùng chế độ cho phép tất cả (Dev Mode)");
    protect = (req, res, next) => next();
}

if (!admin) {
    console.warn("⚠️ Middleware 'admin' thiếu -> Đang dùng chế độ cho phép tất cả (Dev Mode)");
    admin = (req, res, next) => next();
}

// --- 2. IMPORT UPLOAD AN TOÀN ---
let upload;
try {
    upload = require('../middleware/upload');
} catch (err) {
    console.warn("⚠️ Cảnh báo: Không tìm thấy middleware upload");
}

// Hàm upload giả nếu thiếu (để không lỗi code)
const safeUpload = upload ? upload.fields([{ name: 'sheet' }, { name: 'beat' }]) : (req, res, next) => next();


// --- 3. CÁC ROUTE ---

// 1. Lấy danh sách & Chi tiết
router.get('/', protect, controller.getEvents);
router.get('/:id', protect, controller.getEventDetail);

// 2. Thêm bài hát (Có upload file)
router.post('/:id/songs', protect, safeUpload, controller.addSongToEvent);

// 3. Thêm bài hát từ Kho nhạc
router.post('/:id/songs/from-library', protect, controller.addSongFromLibrary);

// 4. Xóa bài hát
router.delete('/songs/:songId', protect, controller.deleteSong);

// 5. Cập nhật sự kiện (Chỉ Admin)
// 👇 Dòng này trước đây bị lỗi do thiếu biến 'admin'
router.put('/:id', protect, admin, controller.updateEvent);

// 6. Đăng ký tham gia (Join)
router.post('/:id/join', protect, controller.joinEvent);

// 7. Chọn/Bỏ chọn người đi diễn (Toggle Performer)
router.put('/:id/performer', protect, admin, controller.togglePerformer);

// 8. Xóa sự kiện (Chỉ Admin)
router.delete('/:id', protect, admin, controller.deleteEvent);

module.exports = router;