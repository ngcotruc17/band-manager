import { Router } from 'express';
import { getBookings, createBooking, updateStatus, deleteBooking } from '../controllers/booking.controller';
import { protect, admin } from '../middleware/auth';

const router = Router();

router.get('/', protect, getBookings);
router.post('/', protect, createBooking);
router.put('/:id/status', protect, admin, updateStatus);
router.delete('/:id', protect, admin, deleteBooking);

export default router;
