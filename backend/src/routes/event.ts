import express from 'express';
import { createvent, browseevents, getevent, updatevent, getform, updateform } from '../controllers/event';
import { registerevent, listparticipants, exportparticipants } from '../controllers/registration';
import { protect, authorize } from '../middleware/auth';
import { ownevent, caneditevent } from '../middleware/event';

const router = express.Router();

router.get('/', browseevents);
router.get('/:eventid', getevent);
router.get('/:eventid/form', getform);

router.post('/:eventid/registrations', protect, authorize('Participant'), registerevent);

router.post('/', protect, authorize('Organizer'), createvent);
router.patch('/:eventid', protect, authorize('Organizer'), ownevent, caneditevent, updatevent);
router.put('/:eventid/form', protect, authorize('Organizer'), updateform);
router.get('/:eventid/registrations', protect, authorize('Organizer'), listparticipants);
router.get('/:eventid/registrations/export', protect, authorize('Organizer'), exportparticipants);

export default router;
