import { Request, Response } from 'express';
import { Interaction } from '../models/Interaction';
import { Article } from '../models/Article';
import { interactionValidation } from '../utils/validation';
import { AuthRequest, ApiResponse } from '../types';

/**
 * @swagger
 * /api/v1/interactions:
 *   post:
 *     summary: Create a user interaction with an article
 *     tags: [Interactions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - articleId
 *               - interactionType
 *             properties:
 *               articleId:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *                 example: '507f1f77bcf86cd799439012'
 *                 description: 'Valid MongoDB ObjectId of the article'
 *               interactionType:
 *                 type: string
 *                 enum: ['view', 'like', 'share']
 *                 example: 'like'
 *                 description: 'Type of interaction performed'
 *           examples:
 *             view_article:
 *               summary: View an article
 *               value:
 *                 articleId: '507f1f77bcf86cd799439012'
 *                 interactionType: 'view'
 *             like_article:
 *               summary: Like an article
 *               value:
 *                 articleId: '507f1f77bcf86cd799439012'
 *                 interactionType: 'like'
 *             share_article:
 *               summary: Share an article
 *               value:
 *                 articleId: '507f1f77bcf86cd799439012'
 *                 interactionType: 'share'
 *     responses:
 *       201:
 *         description: Interaction recorded successfully
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
 *                   example: 'Interaction recorded successfully'
 *                 data:
 *                   $ref: '#/components/schemas/Interaction'
 *             example:
 *               success: true
 *               message: 'Interaction recorded successfully'
 *               data:
 *                 _id: '507f1f77bcf86cd799439015'
 *                 userId:
 *                   _id: '507f1f77bcf86cd799439011'
 *                   username: 'johndoe123'
 *                 articleId:
 *                   _id: '507f1f77bcf86cd799439012'
 *                   title: 'The Future of Artificial Intelligence'
 *                 interactionType: 'like'
 *                 createdAt: '2023-12-01T10:30:00.000Z'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_article_id:
 *                 summary: Invalid article ID format
 *                 value:
 *                   success: false
 *                   message: 'Validation error'
 *                   error: 'Invalid article ID format'
 *               invalid_interaction_type:
 *                 summary: Invalid interaction type
 *                 value:
 *                   success: false
 *                   message: 'Validation error'
 *                   error: '"interactionType" must be one of [view, like, share]'
 *               missing_fields:
 *                 summary: Missing required fields
 *                 value:
 *                   success: false
 *                   message: 'Validation error'
 *                   error: '"articleId" is required'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'Access token is required'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'Article not found'
 *       409:
 *         description: Interaction already exists
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
 *                   example: 'Interaction already exists'
 *                 data:
 *                   $ref: '#/components/schemas/Interaction'
 *             example:
 *               success: true
 *               message: 'Interaction already exists'
 *               data:
 *                 _id: '507f1f77bcf86cd799439015'
 *                 interactionType: 'like'
 *                 createdAt: '2023-12-01T09:15:00.000Z'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const createInteraction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = interactionValidation.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message,
      } as ApiResponse);
      return;
    }

    const { articleId, interactionType } = value;
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse);
      return;
    }

    const article = await Article.findById(articleId);

    if (!article) {
      res.status(404).json({
        success: false,
        message: 'Article not found',
      } as ApiResponse);
      return;
    }

    const existingInteraction = await Interaction.findOne({
      userId: user._id,
      articleId,
      interactionType,
    });

    if (existingInteraction) {
      res.status(409).json({
        success: true,
        message: 'Interaction already exists',
        data: existingInteraction,
      } as ApiResponse);
      return;
    }

    const interaction = new Interaction({
      userId: user._id,
      articleId,
      interactionType,
    });

    await interaction.save();

    const populatedInteraction = await Interaction.findById(interaction._id)
      .populate('userId', 'username')
      .populate('articleId', 'title author')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Interaction recorded successfully',
      data: populatedInteraction,
    } as ApiResponse);
  } catch (error) {
    console.error('Create interaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to record interaction',
    } as ApiResponse);
  }
};