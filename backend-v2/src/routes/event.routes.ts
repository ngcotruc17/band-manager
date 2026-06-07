import { Router } from 'express';
import { 
  getEvents, 
  getEventDetail, 
  addSongToEvent, 
  addSongFromLibrary, 
  updateEvent, 
  deleteSong, 
  joinEvent, 
  togglePerformer, 
  deleteEvent 
} from '../controllers/event.controller';
import { protect, admin } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.get('/', protect, getEvents);
router.get('/:id', protect, getEventDetail);

router.post('/:id/songs', protect, upload.fields([
  { name: 'sheet', maxCount: 1 }, 
  { name: 'beat', maxCount: 1 }
]), addSongToEvent);

router.post('/:id/songs/library', protect, addSongFromLibrary);
router.put('/:id', protect, admin, updateEvent);
router.delete('/:id/songs/:songId', protect, admin, deleteSong);
router.post('/:id/join', protect, joinEvent);
router.put('/:id/toggle-performer', protect, admin, togglePerformer);
router.delete('/:id', protect, admin, deleteEvent);

export default router;
