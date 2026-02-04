import express from 'express';
import { createorganizer, listorganizers, deleteorganizer } from '../controllers/admin';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.post('/organizers', createorganizer);
router.get('/organizers', listorganizers);
router.delete('/organizers/:orgid', deleteorganizer);

export default router;
