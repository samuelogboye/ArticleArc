import { Request, Response } from 'express';
import { Article } from '../models/Article';
import { geminiService } from '../services/geminiService';
import { articleValidation, paginationValidation, idValidation } from '../utils/validation';
import { parsePaginationQuery, createPaginationMeta } from '../utils/pagination';
import { AuthRequest, ApiResponse } from '../types';

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