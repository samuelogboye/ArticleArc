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

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'ArticleArc API is running'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: '2023-12-01T10:30:00.000Z'
 *                 version:
 *                   type: string
 *                   example: '1.0.0'
 *             example:
 *               success: true
 *               message: 'ArticleArc API is running'
 *               timestamp: '2023-12-01T10:30:00.000Z'
 *               version: '1.0.0'
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ArticleArc API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Swagger spec endpoint for debugging
router.get('/swagger-spec', (req, res) => {
  const { specs } = require('../config/swagger');
  res.status(200).json(specs);
});

export default router;