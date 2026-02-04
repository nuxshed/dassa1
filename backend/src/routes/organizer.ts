import express from 'express';
import { listpublic, getpublic, togglefollow, getownprofile, updateownprofile } from '../controllers/organizer';
import { protect, authorize } from '../middleware/auth'

const router = express.Router();

router.get('/', listpublic);
router.get('/:orgid', getpublic);

router.post('/:orgid/follow', protect, authorize('Participant'), togglefollow);

router.get('/me', protect, authorize('Organizer'), getownprofile);
router.patch('/me', protect, authorize('Organizer'), updateownprofile);

export default router;
