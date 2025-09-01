import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { registerValidation, loginValidation } from '../utils/validation';
import { ApiResponse } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
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

    const token = generateToken({
      userId: (user._id as any).toString(),
      username: user.username,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          interests: user.interests,
          createdAt: user.createdAt,
        },
        token,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Registration failed',
    } as ApiResponse);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = loginValidation.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details[0].message,
      } as ApiResponse);
      return;
    }

    const { username, password } = value;

    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      } as ApiResponse);
      return;
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      } as ApiResponse);
      return;
    }

    const token = generateToken({
      userId: (user._id as any).toString(),
      username: user.username,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          interests: user.interests,
          createdAt: user.createdAt,
        },
        token,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Login failed',
    } as ApiResponse);
  }
};