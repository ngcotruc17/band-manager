const express = require('express');
const router = express.Router();
const { getLibrarySongs, addLibrarySong, deleteLibrarySong } = require('../controllers/library.controller');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getLibrarySongs);
router.post('/', protect, upload.fields([{ name: 'sheet', maxCount: 1 }, { name: 'beat', maxCount: 1 }]), addLibrarySong);
router.delete('/:id', protect, deleteLibrarySong);

module.exports = router;