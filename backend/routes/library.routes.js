const express = require('express');
const router = express.Router();

// Import Middleware
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Import cái upload vừa sửa ở bước 1

const { 
  getLibrary, 
  createLibrarySong, 
  deleteLibrarySong 
} = require('../controllers/library.controller');

// --- ROUTES ---

// 1. Lấy danh sách
router.get('/', protect, getLibrary);

// 2. Upload bài mới
// 👇 QUAN TRỌNG: upload.fields phải khớp với tên field bên Frontend gửi lên ('sheet', 'beat')
router.post('/', protect, upload.fields([{ name: 'sheet' }, { name: 'beat' }]), createLibrarySong);

// 3. Xóa
router.delete('/:id', protect, deleteLibrarySong);

module.exports = router;