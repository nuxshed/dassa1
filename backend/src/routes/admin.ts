import express from 'express';
import { createorganizer, listorganizers, deleteorganizer, toggleorganizer, listresetrequests, resolveresetrequest } from '../controllers/admin';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.post('/organizers', createorganizer);
router.get('/organizers', listorganizers);
router.patch('/organizers/:orgid/toggle', toggleorganizer);
router.delete('/organizers/:orgid', deleteorganizer);

router.get('/requests', listresetrequests);
router.post('/requests/:reqid/resolve', resolveresetrequest);

export default router;
