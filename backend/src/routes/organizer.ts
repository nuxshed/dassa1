import express from 'express';
import { listpublic, getpublic, togglefollow, getownprofile, updateownprofile, getresetstatus, createresetrequest} from '../controllers/organizer';
import { protect, authorize } from '../middleware/auth'

const router = express.Router();

router.get('/', listpublic);

router.get('/me', protect, authorize('Organizer'), getownprofile);
router.patch('/me', protect, authorize('Organizer'), updateownprofile);

router.get('/me/reset-request', protect, authorize('Organizer'), getresetstatus);
router.post('/me/reset-request', protect, authorize('Organizer'), createresetrequest);

router.get('/:orgid', getpublic);
router.post('/:orgid/follow', protect, authorize('Participant'), togglefollow);


export default router;
