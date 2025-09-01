import { Router } from 'express';
import { createArticle, getArticles, getArticleById, updateArticle, deleteArticle } from '../controllers/articleController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', getArticles);
router.get('/:id', getArticleById);
router.post('/', authenticate, createArticle);
router.put('/:id', authenticate, updateArticle);
router.delete('/:id', authenticate, deleteArticle);

export default router;