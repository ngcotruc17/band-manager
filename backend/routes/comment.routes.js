const express = require('express');
const router = express.Router();
const { getCommentsByEvent, addComment, deleteComment } = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth');

router.get('/:eventId', protect, getCommentsByEvent);
router.post('/', protect, addComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;