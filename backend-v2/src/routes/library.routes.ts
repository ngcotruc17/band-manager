import { Router } from 'express';
import { getSongs, addSong, deleteSong } from '../controllers/library.controller';
import { protect } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.get('/', protect, getSongs);

router.post('/', protect, upload.fields([
  { name: 'sheet', maxCount: 1 }, 
  { name: 'beat', maxCount: 1 }
]), addSong);

router.delete('/:id', protect, deleteSong);

export default router;
