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
import { protect, canManageShows } from '../middleware/auth';

const router = Router();

router.get('/', protect, getShows);
router.post('/', protect, createShow);
router.delete('/:id', protect, canManageShows, deleteShow);
router.put('/:id', protect, canManageShows, updateShow);
router.put('/:id/status', protect, canManageShows, updateShowStatus);
router.get('/:id', protect, getShowById);
router.post('/:id/join', protect, joinShow);
router.put('/:id/approve-participant', protect, canManageShows, approveParticipant);
router.put('/:id/remove-participant', protect, canManageShows, removeParticipant);
router.put('/:id/toggle-registration', protect, canManageShows, toggleRegistration);
router.post('/:id/setlist', protect, addSongToSetlist);
router.delete('/:id/setlist/:songId', protect, removeSongFromSetlist);

export default router;
