import { Request, Response } from 'express';
import { Article } from '../models/Article';
import { geminiService } from '../services/geminiService';
import { articleValidation, paginationValidation, idValidation } from '../utils/validation';
import { parsePaginationQuery, createPaginationMeta } from '../utils/pagination';
import { AuthRequest, ApiResponse } from '../types';

/**
 * @swagger
 * /api/v1/articles:
 *   post:
 *     summary: Create a new article
 *     tags: [Articles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 example: 'The Future of Artificial Intelligence'
 *                 description: 'Article title'
 *               content:
 *                 type: string
 *                 minLength: 50
 *                 example: 'Artificial intelligence is rapidly evolving and transforming various industries. From healthcare to finance, AI applications are becoming more sophisticated and widespread. This comprehensive article explores the current trends and future possibilities in AI development, examining how machine learning algorithms are reshaping our world.'
 *                 description: 'Full article content'
 *               summary:
 *                 type: string
 *                 maxLength: 500
 *                 example: 'An exploration of current AI trends and future possibilities across various industries including healthcare and finance.'
 *                 description: 'Optional manual summary (AI-generated if not provided)'
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *                 example: ['artificial-intelligence', 'technology', 'future', 'machine-learning']
 *                 description: 'Article tags for categorization'
 *           examples:
 *             tech_article:
 *               summary: Technology article with AI summary
 *               value:
 *                 title: 'The Future of Artificial Intelligence'
 *                 content: 'Artificial intelligence is rapidly evolving and transforming various industries. From healthcare to finance, AI applications are becoming more sophisticated and widespread. This comprehensive article explores the current trends and future possibilities in AI development, examining how machine learning algorithms are reshaping our world and creating new opportunities for innovation.'
 *                 tags: ['ai', 'technology', 'future', 'innovation']
 *             science_article:
 *               summary: Science article with manual summary
 *               value:
 *                 title: 'Climate Change and Renewable Energy Solutions'
 *                 content: 'Climate change represents one of the most pressing challenges of our time, requiring immediate and sustained action across all sectors of society. Renewable energy technologies have emerged as crucial tools in combating global warming and reducing greenhouse gas emissions. Solar, wind, and hydroelectric power are becoming increasingly cost-effective and efficient, making them viable alternatives to fossil fuels.'
 *                 summary: 'An analysis of climate change challenges and the role of renewable energy in creating sustainable solutions.'
 *                 tags: ['climate-change', 'renewable-energy', 'sustainability', 'environment']
 *     responses:
 *       201:
 *         description: Article created successfully
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
 *                   example: 'Article created successfully'
 *                 data:
 *                   $ref: '#/components/schemas/Article'
 *             example:
 *               success: true
 *               message: 'Article created successfully'
 *               data:
 *                 _id: '507f1f77bcf86cd799439012'
 *                 title: 'The Future of Artificial Intelligence'
 *                 content: 'Artificial intelligence is rapidly evolving...'
 *                 summary: 'AI-generated summary of the article content discussing trends and future possibilities.'
 *                 tags: ['ai', 'technology', 'future']
 *                 author: 'johndoe123'
 *                 createdBy: '507f1f77bcf86cd799439011'
 *                 createdAt: '2023-12-01T10:30:00.000Z'
 *                 updatedAt: '2023-12-01T10:30:00.000Z'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               title_too_short:
 *                 summary: Title too short
 *                 value:
 *                   success: false
 *                   message: 'Validation error'
 *                   error: '"title" length must be at least 5 characters long'
 *               content_too_short:
 *                 summary: Content too short
 *                 value:
 *                   success: false
 *                   message: 'Validation error'
 *                   error: '"content" length must be at least 50 characters long'
 *               too_many_tags:
 *                 summary: Too many tags
 *                 value:
 *                   success: false
 *                   message: 'Validation error'
 *                   error: '"tags" must contain less than or equal to 10 items'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               no_token:
 *                 summary: No authentication token
 *                 value:
 *                   success: false
 *                   message: 'Access token is required'
 *               invalid_token:
 *                 summary: Invalid authentication token
 *                 value:
 *                   success: false
 *                   message: 'Invalid or expired token'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const createArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = articleValidation.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message,
      } as ApiResponse);
      return;
    }

    const { title, content, summary, tags = [] } = value;
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse);
      return;
    }

    const author = user.username;


    let finalSummary = summary;

    if (!finalSummary || finalSummary.trim().length === 0) {
      try {
        if (geminiService.isAvailable()) {
          finalSummary = await geminiService.generateSummary(content, title);
        } else {
          finalSummary = geminiService.generateFallbackSummary(content);
        }
      } catch (error) {
        console.error('Summary generation failed:', error);
        finalSummary = geminiService.generateFallbackSummary(content);
      }
    }

    const article = new Article({
      title,
      content,
      author,
      summary: finalSummary,
      tags: tags.map((tag: string) => tag.toLowerCase().trim()),
      createdBy: user._id,
    });

    await article.save();

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article,
    } as ApiResponse);
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to create article',
    } as ApiResponse);
  }
};

/**
 * @swagger
 * /api/v1/articles:
 *   get:
 *     summary: Get paginated list of articles
 *     tags: [Articles]
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
 *         description: Number of articles per page
 *         example: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Alternative to page - number of articles to skip
 *         example: 0
 *     responses:
 *       200:
 *         description: Articles retrieved successfully
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
 *                   example: 'Articles retrieved successfully'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *             example:
 *               success: true
 *               message: 'Articles retrieved successfully'
 *               data:
 *                 - _id: '507f1f77bcf86cd799439012'
 *                   title: 'The Future of Artificial Intelligence'
 *                   content: 'Artificial intelligence is rapidly evolving...'
 *                   summary: 'AI trends and future possibilities discussion.'
 *                   tags: ['ai', 'technology', 'future']
 *                   author: 'johndoe123'
 *                   createdBy:
 *                     _id: '507f1f77bcf86cd799439011'
 *                     username: 'johndoe123'
 *                   createdAt: '2023-12-01T10:30:00.000Z'
 *                   updatedAt: '2023-12-01T10:30:00.000Z'
 *                 - _id: '507f1f77bcf86cd799439013'
 *                   title: 'Climate Change Solutions'
 *                   content: 'Climate change represents one of the most pressing...'
 *                   summary: 'Analysis of renewable energy solutions.'
 *                   tags: ['climate', 'environment', 'sustainability']
 *                   author: 'climatescientist'
 *                   createdBy:
 *                     _id: '507f1f77bcf86cd799439014'
 *                     username: 'climatescientist'
 *                   createdAt: '2023-12-01T09:15:00.000Z'
 *                   updatedAt: '2023-12-01T09:15:00.000Z'
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 totalCount: 25
 *                 totalPages: 3
 *       400:
 *         description: Invalid pagination parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_page:
 *                 summary: Invalid page number
 *                 value:
 *                   success: false
 *                   message: 'Invalid pagination parameters'
 *                   error: '"page" must be a number'
 *               page_too_small:
 *                 summary: Page number too small
 *                 value:
 *                   success: false
 *                   message: 'Invalid pagination parameters'
 *                   error: '"page" must be greater than or equal to 1'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getArticles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error: paginationError } = paginationValidation.validate(req.query);
    
    if (paginationError) {
      res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
        error: paginationError.details[0].message,
      } as ApiResponse);
      return;
    }

    const { page, limit, skip } = parsePaginationQuery(req.query);

    const [articles, total] = await Promise.all([
      Article.find()
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Article.countDocuments(),
    ]);

    const paginationMeta = createPaginationMeta(page, limit, total);

    res.status(200).json({
      success: true,
      message: 'Articles retrieved successfully',
      data: articles,
      pagination: paginationMeta,
    } as ApiResponse);
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve articles',
    } as ApiResponse);
  }
};

/**
 * @swagger
 * /api/v1/articles/{id}:
 *   get:
 *     summary: Get a specific article by ID
 *     tags: [Articles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Valid MongoDB ObjectId of the article
 *         example: '507f1f77bcf86cd799439012'
 *     responses:
 *       200:
 *         description: Article retrieved successfully
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
 *                   example: 'Article retrieved successfully'
 *                 data:
 *                   $ref: '#/components/schemas/Article'
 *             example:
 *               success: true
 *               message: 'Article retrieved successfully'
 *               data:
 *                 _id: '507f1f77bcf86cd799439012'
 *                 title: 'The Future of Artificial Intelligence'
 *                 content: 'Artificial intelligence is rapidly evolving and transforming various industries. From healthcare to finance, AI applications are becoming more sophisticated and widespread.'
 *                 summary: 'An exploration of current AI trends and future possibilities across various industries.'
 *                 tags: ['ai', 'technology', 'future', 'innovation']
 *                 author: 'johndoe123'
 *                 createdBy:
 *                   _id: '507f1f77bcf86cd799439011'
 *                   username: 'johndoe123'
 *                   email: 'john.doe@example.com'
 *                   interests: ['technology', 'science']
 *                 createdAt: '2023-12-01T10:30:00.000Z'
 *                 updatedAt: '2023-12-01T10:30:00.000Z'
 *       400:
 *         description: Invalid article ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_id_format:
 *                 summary: Invalid ObjectId format
 *                 value:
 *                   success: false
 *                   message: 'Invalid article ID'
 *                   error: '"id" with value "invalid-id" fails to match the required pattern: /^[0-9a-fA-F]{24}$/'
 *               malformed_id:
 *                 summary: Malformed article ID
 *                 value:
 *                   success: false
 *                   message: 'Invalid article ID'
 *                   error: '"id" length must be 24 characters long'
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getArticleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = idValidation.validate(req.params);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Invalid article ID',
        error: error.details[0].message,
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    const article = await Article.findById(id)
      .populate('createdBy', 'username email interests')
      .lean();

    if (!article) {
      res.status(404).json({
        success: false,
        message: 'Article not found',
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Article retrieved successfully',
      data: article,
    } as ApiResponse);
  } catch (error) {
    console.error('Get article by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to retrieve article',
    } as ApiResponse);
  }
};

/**
 * @swagger
 * /api/v1/articles/{id}:
 *   put:
 *     summary: Update an existing article
 *     tags: [Articles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Valid MongoDB ObjectId of the article to update
 *         example: '507f1f77bcf86cd799439012'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 example: 'The Future of Artificial Intelligence - Updated'
 *                 description: 'Updated article title'
 *               content:
 *                 type: string
 *                 minLength: 50
 *                 example: 'Artificial intelligence is rapidly evolving and transforming various industries. This updated content provides the latest insights into AI developments and their impact on society, including recent breakthroughs in machine learning and neural networks.'
 *                 description: 'Updated full article content'
 *               summary:
 *                 type: string
 *                 maxLength: 500
 *                 example: 'An updated exploration of the latest AI trends and developments with recent breakthroughs.'
 *                 description: 'Updated manual summary (AI-generated if not provided)'
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *                 example: ['artificial-intelligence', 'technology', 'future', 'machine-learning', 'neural-networks']
 *                 description: 'Updated article tags for categorization'
 *           examples:
 *             update_with_summary:
 *               summary: Update article with custom summary
 *               value:
 *                 title: 'Advanced AI Applications in Healthcare - 2024 Update'
 *                 content: 'The healthcare industry has witnessed unprecedented advances in artificial intelligence applications. From diagnostic imaging to drug discovery, AI is revolutionizing medical practices. This comprehensive update covers the latest developments in AI-powered medical devices, predictive analytics for patient care, and ethical considerations in medical AI deployment.'
 *                 summary: 'Latest advances in AI healthcare applications including diagnostics, drug discovery, and ethical considerations.'
 *                 tags: ['ai', 'healthcare', 'medical-technology', 'diagnostics', 'ethics']
 *             update_auto_summary:
 *               summary: Update article with auto-generated summary
 *               value:
 *                 title: 'Quantum Computing Meets Artificial Intelligence'
 *                 content: 'The convergence of quantum computing and artificial intelligence represents one of the most exciting frontiers in technology. Quantum algorithms promise to accelerate machine learning processes exponentially, while AI techniques are being used to optimize quantum systems. This article explores the synergistic relationship between these two revolutionary technologies.'
 *                 tags: ['quantum-computing', 'artificial-intelligence', 'quantum-algorithms', 'technology']
 *     responses:
 *       200:
 *         description: Article updated successfully
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
 *                   example: 'Article updated successfully'
 *                 data:
 *                   $ref: '#/components/schemas/Article'
 *             example:
 *               success: true
 *               message: 'Article updated successfully'
 *               data:
 *                 _id: '507f1f77bcf86cd799439012'
 *                 title: 'Advanced AI Applications in Healthcare - 2024 Update'
 *                 content: 'The healthcare industry has witnessed unprecedented advances...'
 *                 summary: 'Latest advances in AI healthcare applications including diagnostics and ethics.'
 *                 tags: ['ai', 'healthcare', 'medical-technology', 'diagnostics']
 *                 author: 'johndoe123'
 *                 createdBy:
 *                   _id: '507f1f77bcf86cd799439011'
 *                   username: 'johndoe123'
 *                 createdAt: '2023-12-01T10:30:00.000Z'
 *                 updatedAt: '2023-12-02T14:45:00.000Z'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_id:
 *                 summary: Invalid article ID
 *                 value:
 *                   success: false
 *                   message: 'Invalid article ID'
 *                   error: '"id" with value "invalid-id" fails to match the required pattern'
 *               title_too_short:
 *                 summary: Title too short
 *                 value:
 *                   success: false
 *                   message: 'Validation error'
 *                   error: '"title" length must be at least 5 characters long'
 *               content_too_short:
 *                 summary: Content too short
 *                 value:
 *                   success: false
 *                   message: 'Validation error'
 *                   error: '"content" length must be at least 50 characters long'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'Authentication required'
 *       403:
 *         description: Not authorized to update this article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'Not authorized to update this article'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'Article not found'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const updateArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error: idError } = idValidation.validate(req.params);
    const { error: bodyError, value } = articleValidation.validate(req.body);
    
    if (idError) {
      res.status(400).json({
        success: false,
        message: 'Invalid article ID',
        error: idError.details[0].message,
      } as ApiResponse);
      return;
    }

    if (bodyError) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: bodyError.details[0].message,
      } as ApiResponse);
      return;
    }

    const { id } = req.params;
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse);
      return;
    }

    const article = await Article.findById(id);

    if (!article) {
      res.status(404).json({
        success: false,
        message: 'Article not found',
      } as ApiResponse);
      return;
    }

    if ((article.createdBy as any).toString() !== (user._id as any).toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this article',
      } as ApiResponse);
      return;
    }

    const { title, content, author, summary, tags = [] } = value;

    let finalSummary = summary;

    if (content !== article.content && (!finalSummary || finalSummary.trim().length === 0)) {
      try {
        if (geminiService.isAvailable()) {
          finalSummary = await geminiService.generateSummary(content, title);
        } else {
          finalSummary = geminiService.generateFallbackSummary(content);
        }
      } catch (error) {
        console.error('Summary generation failed:', error);
        finalSummary = geminiService.generateFallbackSummary(content);
      }
    }

    const updatedArticle = await Article.findByIdAndUpdate(
      id,
      {
        title,
        content,
        author,
        summary: finalSummary,
        tags: tags.map((tag: string) => tag.toLowerCase().trim()),
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username');

    res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      data: updatedArticle,
    } as ApiResponse);
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to update article',
    } as ApiResponse);
  }
};

/**
 * @swagger
 * /api/v1/articles/{id}:
 *   delete:
 *     summary: Delete an existing article
 *     tags: [Articles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Valid MongoDB ObjectId of the article to delete
 *         example: '507f1f77bcf86cd799439012'
 *     responses:
 *       200:
 *         description: Article deleted successfully
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
 *                   example: 'Article deleted successfully'
 *             example:
 *               success: true
 *               message: 'Article deleted successfully'
 *       400:
 *         description: Invalid article ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_id_format:
 *                 summary: Invalid ObjectId format
 *                 value:
 *                   success: false
 *                   message: 'Invalid article ID'
 *                   error: '"id" with value "invalid-id" fails to match the required pattern: /^[0-9a-fA-F]{24}$/'
 *               malformed_id:
 *                 summary: Malformed article ID
 *                 value:
 *                   success: false
 *                   message: 'Invalid article ID'
 *                   error: '"id" length must be 24 characters long'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'Authentication required'
 *       403:
 *         description: Not authorized to delete this article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'Not authorized to delete this article'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'Article not found'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'Internal server error'
 *               error: 'Failed to delete article'
 */
export const deleteArticle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error } = idValidation.validate(req.params);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Invalid article ID',
        error: error.details[0].message,
      } as ApiResponse);
      return;
    }

    const { id } = req.params;
    const user = (req as AuthRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      } as ApiResponse);
      return;
    }

    const article = await Article.findById(id);

    if (!article) {
      res.status(404).json({
        success: false,
        message: 'Article not found',
      } as ApiResponse);
      return;
    }

    if ((article.createdBy as any).toString() !== (user._id as any).toString()) {
      res.status(403).json({
        success: false,
        message: 'Not authorized to delete this article',
      } as ApiResponse);
      return;
    }

    await Article.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to delete article',
    } as ApiResponse);
  }
};