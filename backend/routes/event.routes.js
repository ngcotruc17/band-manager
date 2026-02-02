const express = require('express');
const router = express.Router();
const controller = require('../controllers/event.controller');

// --- 1. IMPORT MIDDLEWARE AN TOÀN ---
let protect, admin;
try {
    const authMiddleware = require('../middleware/auth');
    protect = authMiddleware.protect;
    admin = authMiddleware.admin;
} catch (err) { console.warn("⚠️ Middleware auth thiếu"); }

if (!protect) protect = (req, res, next) => next();
if (!admin) admin = (req, res, next) => next();

// --- 2. IMPORT UPLOAD (QUAN TRỌNG) ---
// Phải import chính xác file upload.js đã cấu hình multer
const upload = require('../middleware/upload'); 

// --- 3. CÁC ROUTE ---
router.get('/', protect, controller.getEvents);
router.get('/:id', protect, controller.getEventDetail);

// 👇 Dùng đúng biến upload đã import
router.post('/:id/songs', protect, upload.fields([{ name: 'sheet' }, { name: 'beat' }]), controller.addSongToEvent);

router.post('/:id/songs/from-library', protect, controller.addSongFromLibrary);
router.delete('/songs/:songId', protect, controller.deleteSong);
router.put('/:id', protect, admin, controller.updateEvent);
router.post('/:id/join', protect, controller.joinEvent);
router.put('/:id/performer', protect, admin, controller.togglePerformer);
router.delete('/:id', protect, admin, controller.deleteEvent);

module.exports = router;