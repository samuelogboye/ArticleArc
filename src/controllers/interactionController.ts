import { Request, Response } from 'express';
import { Interaction } from '../models/Interaction';
import { Article } from '../models/Article';
import { interactionValidation } from '../utils/validation';
import { AuthRequest, ApiResponse } from '../types';

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