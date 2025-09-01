import { Request, Response } from 'express';
import { User } from '../models/User';
import { registerValidation } from '../utils/validation';
import { ApiResponse } from '../types';

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = registerValidation.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message,
      } as ApiResponse);
      return;
    }

    const { username, email, password, interests = [] } = value;

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'username' : 'email';
      res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`,
      } as ApiResponse);
      return;
    }

    const user = new User({
      username,
      email,
      password,
      interests: interests.map((interest: string) => interest.toLowerCase().trim()),
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        interests: user.interests,
        createdAt: user.createdAt,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Failed to create user',
    } as ApiResponse);
  }
};