import { Router } from 'express';
import authRoutes from './auth';
import articleRoutes from './articles';
import userRoutes from './users';
import interactionRoutes from './interactions';

const router = Router();

router.use('/auth', authRoutes);
router.use('/articles', articleRoutes);
router.use('/users', userRoutes);
router.use('/interactions', interactionRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ArticleArc API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;