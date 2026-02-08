import express from 'express';
import { protect, authorize } from '../middleware/auth';
import { 
  registerevent, 
  getmyregistrations, 
  getticket, 
  exportallregistrations,
  uploadpaymentproof,
  updatepaymentstatus 
} from '../controllers/registration';

const router = express.Router();

router.post('/', protect, registerevent);
router.get('/me', protect, getmyregistrations);
router.get('/export', protect, authorize('Organizer', 'Admin'), exportallregistrations);
router.get('/:ticketid', protect, getticket);

router.post('/:ticketid/payment/proof', protect, uploadpaymentproof);
router.put('/:ticketid/payment/status', protect, authorize('Organizer', 'Admin'), updatepaymentstatus);

export default router;
