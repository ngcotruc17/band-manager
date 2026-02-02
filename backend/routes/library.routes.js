const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Import bộ upload
const { getSongs, addSong, deleteSong } = require('../controllers/library.controller');

// Lấy danh sách
router.get('/', protect, getSongs);

// Upload (Cho phép upload 2 file: sheet và beat)
router.post('/', protect, upload.fields([
    { name: 'sheet', maxCount: 1 }, 
    { name: 'beat', maxCount: 1 }
]), addSong);

// Xóa
router.delete('/:id', protect, deleteSong);

module.exports = router;