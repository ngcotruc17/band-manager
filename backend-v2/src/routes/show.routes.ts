import { Router } from 'express';
import { 
  getShows, 
  createShow, 
  deleteShow, 
  updateShowStatus, 
  getShowById, 
  joinShow, 
  approveParticipant, 
  removeParticipant, 
  toggleRegistration, 
  updateShow, 
  addSongToSetlist, 
  removeSongFromSetlist 
} from '../controllers/show.controller';
import { protect, admin } from '../middleware/auth';

const router = Router();

router.get('/', protect, getShows);
router.post('/', protect, createShow);
router.delete('/:id', protect, admin, deleteShow);
router.put('/:id', protect, admin, updateShow);
router.put('/:id/status', protect, admin, updateShowStatus);
router.get('/:id', protect, getShowById);
router.post('/:id/join', protect, joinShow);
router.put('/:id/approve-participant', protect, admin, approveParticipant);
router.put('/:id/remove-participant', protect, admin, removeParticipant);
router.put('/:id/toggle-registration', protect, admin, toggleRegistration);
router.post('/:id/setlist', protect, addSongToSetlist);
router.delete('/:id/setlist/:songId', protect, removeSongFromSetlist);

export default router;
