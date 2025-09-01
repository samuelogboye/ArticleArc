import { Router } from 'express';
import { createInteraction } from '../controllers/interactionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createInteraction);

export default router;