const express = require('express');
const router = express.Router();
const { 
  getEvents, 
  getEventDetail, 
  addSongToEvent, 
  updateEvent, 
  deleteSong, 
  joinEvent, 
  deleteEvent, 
  togglePerformer,
  addSongFromLibrary // <--- Import đầy đủ trong 1 lần
} = require('../controllers/event.controller');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// 1. Các Route cơ bản (Lấy, Sửa, Xóa Event)
router.get('/', protect, getEvents);
router.get('/:id', protect, getEventDetail);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);

// 2. Quản lý Nhạc trong Show
// Upload file mới
router.post('/:id/songs', protect, upload.fields([{ name: 'sheet', maxCount: 1 }, { name: 'beat', maxCount: 1 }]), addSongToEvent);
// Lấy từ Kho nhạc (Mới)
router.post('/:id/songs/from-library', protect, addSongFromLibrary);
// Xóa nhạc trong show
router.delete('/songs/:songId', protect, deleteSong);

// 3. Quản lý Nhân sự
router.post('/:id/join', protect, joinEvent);
router.put('/:id/performer', protect, togglePerformer);

module.exports = router;