import express from 'express';
import { getprofile, updateprofile, changepassword } from '../controllers/user';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.use(authorize('Participant'));

router.get('/me', getprofile);
router.patch('/me', updateprofile);
router.put('/me/password', changepassword);

export default router;
