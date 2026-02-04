import express from 'express';
import { listpublic, getpublic, togglefollow, getownprofile, updateownprofile } from '../controllers/organizer';
import { protect, authorize } from '../middleware/auth'

const router = express.Router();

router.get('/', listpublic);
router.get('/:orgId', getpublic);

router.post('/:orgId/follow', protect, authorize('Participant'), togglefollow);

router.get('/me/profile', protect, authorize('Organizer'), getownprofile);
router.patch('/me/profile', protect, authorize('Organizer'), updateownprofile);

export default router;
