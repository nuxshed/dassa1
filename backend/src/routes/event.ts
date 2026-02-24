import express from 'express';
import { createvent, browseevents, getevent, updatevent, deletevent, getform, updateform, trendingevents } from '../controllers/event';
import { registerevent, listparticipants, exportparticipants } from '../controllers/registration';
import { checkinticket, manualcheckin, attendancestats, exportattendance } from '../controllers/attendance';
import { protect, authorize, optionalAuth } from '../middleware/auth';
import { ownevent, caneditevent } from '../middleware/event';

const router = express.Router();

router.get('/', optionalAuth, browseevents);
router.get('/trending', trendingevents);
router.get('/:eventid', optionalAuth, getevent);
router.get('/:eventid/form', getform);

router.post('/:eventid/registrations', protect, authorize('Participant'), registerevent);

router.post('/', protect, authorize('Organizer'), createvent);
router.patch('/:eventid', protect, authorize('Organizer'), ownevent, caneditevent, updatevent);
router.delete('/:eventid', protect, authorize('Organizer'), ownevent, deletevent);
router.put('/:eventid/form', protect, authorize('Organizer'), updateform);
router.get('/:eventid/registrations', protect, authorize('Organizer'), listparticipants);
router.get('/:eventid/registrations/export', protect, authorize('Organizer'), exportparticipants);

router.post('/:eventid/attendance/scan', protect, authorize('Organizer'), checkinticket);
router.post('/:eventid/attendance/manual', protect, authorize('Organizer'), manualcheckin);
router.get('/:eventid/attendance/stats', protect, authorize('Organizer'), attendancestats);
router.get('/:eventid/attendance/export', protect, authorize('Organizer'), exportattendance);

export default router;
