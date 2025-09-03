import { Router } from 'express';
import { createInteraction, getUserInteractions } from '../controllers/interactionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getUserInteractions);
router.post('/', authenticate, createInteraction);

export default router;