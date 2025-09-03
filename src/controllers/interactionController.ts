import { Request, Response } from 'express';
import { Interaction } from '../models/Interaction';
import { Article } from '../models/Article';
import { interactionValidation, interactionQueryValidation } from '../utils/validation';
import { parsePaginationQuery, createPaginationMeta } from '../utils/pagination';
import { AuthRequest, ApiResponse } from '../types';

/**
 * @swagger
 * /api/v1/interactions:
 *   get:
 *     summary: Get user interactions with pagination and filtering
 *     tags: [Interactions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of interactions per page
 *         example: 10
 *       - in: query
 *         name: interactionType
 *         schema:
 *           type: string
 *           enum: ['view', 'like', 'share']
 *         description: Filter by interaction type
 *         example: like
 *       - in: query
 *         name: articleId
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter by specific article ID
 *         example: 507f1f77bcf86cd799439012
 *     responses:
 *       200:
 *         description: User interactions retrieved successfully
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
 *                   example: 'Interactions retrieved successfully'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Interaction'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalViews:
 *                       type: integer
 *                       example: 45
 *                     totalLikes:
 *                       type: integer
 *                       example: 12
 *                     totalShares:
 *                       type: integer
 *                       example: 3
 *             example:
 *               success: true
 *               message: 'Interactions retrieved successfully'
 *               data:
 *                 - _id: '507f1f77bcf86cd799439015'
 *                   userId:
 *                     _id: '507f1f77bcf86cd799439011'
 *                     username: 'johndoe123'
 *                   articleId:
 *                     _id: '507f1f77bcf86cd799439012'
 *                     title: 'The Future of Artificial Intelligence'
 *                     author: 'Dr. Jane Smith'
 *                   interactionType: 'like'
 *                   createdAt: '2023-12-01T10:30:00.000Z'
 *                 - _id: '507f1f77bcf86cd799439016'
 *                   userId:
 *                     _id: '507f1f77bcf86cd799439011'
 *                     username: 'johndoe123'
 *                   articleId:
 *                     _id: '507f1f77bcf86cd799439013'
 *                     title: 'Climate Change Solutions'
 *                     author: 'Environmental Expert'
 *                   interactionType: 'view'
 *                   createdAt: '2023-12-01T09:15:00.000Z'
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 totalCount: 47
 *                 totalPages: 5
 *               stats:
 *                 totalViews: 32
 *                 totalLikes: 12
 *                 totalShares: 3
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_page:
 *                 summary: Invalid page number
 *                 value:
 *                   success: false
 *                   message: 'Invalid query parameters'
 *                   error: '"page" must be a positive number'
 *               invalid_interaction_type:
 *                 summary: Invalid interaction type filter
 *                 value:
 *                   success: false
 *                   message: 'Invalid query parameters'
 *                   error: '"interactionType" must be one of [view, like, share]'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'Access token is required'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

export const getUserInteractions = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse);
      return;
    }

    // Validate query parameters (pagination + filters)
    const { error: queryError } = interactionQueryValidation.validate(req.query);
    
    if (queryError) {
      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        error: queryError.details[0].message,
      } as ApiResponse);
      return;
    }

    const { page, limit, skip } = parsePaginationQuery(req.query);
    
    // Build query filters
    const filters: any = { userId: user._id };
    
    // Filter by interaction type if provided (already validated by Joi)
    if (req.query.interactionType) {
      filters.interactionType = req.query.interactionType as string;
    }
    
    // Filter by article ID if provided (already validated by Joi)
    if (req.query.articleId) {
      filters.articleId = req.query.articleId as string;
    }

    // Execute queries in parallel for performance
    const [interactions, total, stats] = await Promise.all([
      // Get paginated interactions with populated data (exclude userId for privacy)
      Interaction.find(filters)
        .populate('articleId', 'title author tags summary')
        .select('-userId -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      
      // Get total count for pagination
      Interaction.countDocuments(filters),
      
      // Get interaction statistics for the user with same filters
      Interaction.aggregate([
        { $match: filters },
        {
          $group: {
            _id: '$interactionType',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Create pagination metadata
    const paginationMeta = createPaginationMeta(page, limit, total);

    // Process stats into a more readable format
    const interactionStats = {
      totalViews: 0,
      totalLikes: 0,
      totalShares: 0,
    };

    stats.forEach((stat: any) => {
      switch (stat._id) {
        case 'view':
          interactionStats.totalViews = stat.count;
          break;
        case 'like':
          interactionStats.totalLikes = stat.count;
          break;
        case 'share':
          interactionStats.totalShares = stat.count;
          break;
      }
    });

    res.status(200).json({
      success: true,
      message: 'Interactions retrieved successfully',
      data: interactions,
      pagination: paginationMeta,
      stats: interactionStats,
    } as ApiResponse);

  } catch (error) {
    console.error('Get user interactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve interactions',
    } as ApiResponse);
  }
};