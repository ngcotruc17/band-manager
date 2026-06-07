import { Router } from 'express';
import { getCommentsByEvent, addComment, deleteComment } from '../controllers/comment.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/event/:eventId', protect, getCommentsByEvent);
router.post('/', protect, addComment);
router.delete('/:id', protect, deleteComment);

export default router;
