import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { registerValidation, loginValidation } from '../utils/validation';
import { ApiResponse } from '../types';

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: '^[a-zA-Z0-9_]+$'
 *                 example: 'johndoe123'
 *                 description: 'Unique username (letters, numbers, underscores only)'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'john.doe@example.com'
 *                 description: 'Valid email address'
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: 'SecurePass123'
 *                 description: 'Password must contain at least one uppercase, lowercase, and number'
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *                 example: ['technology', 'science', 'programming']
 *                 description: 'Optional list of user interests'
 *           examples:
 *             basic_user:
 *               summary: Basic user registration
 *               value:
 *                 username: 'johndoe123'
 *                 email: 'john.doe@example.com'
 *                 password: 'SecurePass123'
 *             user_with_interests:
 *               summary: User with interests
 *               value:
 *                 username: 'techguru'
 *                 email: 'tech.guru@example.com'
 *                 password: 'TechPass123'
 *                 interests: ['technology', 'ai', 'programming', 'science']
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               message: 'User registered successfully'
 *               data:
 *                 user:
 *                   _id: '507f1f77bcf86cd799439011'
 *                   username: 'johndoe123'
 *                   email: 'john.doe@example.com'
 *                   interests: ['technology', 'science', 'programming']
 *                   createdAt: '2023-12-01T10:30:00.000Z'
 *                   updatedAt: '2023-12-01T10:30:00.000Z'
 *                 token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_email:
 *                 summary: Invalid email format
 *                 value:
 *                   success: false
 *                   message: 'Validation error'
 *                   error: '"email" must be a valid email'
 *               weak_password:
 *                 summary: Weak password
 *                 value:
 *                   success: false
 *                   message: 'Validation error'
 *                   error: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
 *               short_username:
 *                 summary: Username too short
 *                 value:
 *                   success: false
 *                   message: 'Validation error'
 *                   error: '"username" length must be at least 3 characters long'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               duplicate_username:
 *                 summary: Username already taken
 *                 value:
 *                   success: false
 *                   message: 'User with this username already exists'
 *               duplicate_email:
 *                 summary: Email already registered
 *                 value:
 *                   success: false
 *                   message: 'User with this email already exists'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: 'johndoe123'
 *                 description: 'Username or email address'
 *               password:
 *                 type: string
 *                 example: 'SecurePass123'
 *                 description: 'User password'
 *           examples:
 *             username_login:
 *               summary: Login with username
 *               value:
 *                 username: 'johndoe123'
 *                 password: 'SecurePass123'
 *             email_login:
 *               summary: Login with email
 *               value:
 *                 username: 'john.doe@example.com'
 *                 password: 'SecurePass123'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               message: 'Login successful'
 *               data:
 *                 user:
 *                   _id: '507f1f77bcf86cd799439011'
 *                   username: 'johndoe123'
 *                   email: 'john.doe@example.com'
 *                   interests: ['technology', 'science']
 *                   createdAt: '2023-12-01T10:30:00.000Z'
 *                   updatedAt: '2023-12-01T10:30:00.000Z'
 *                 token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_fields:
 *                 summary: Missing required fields
 *                 value:
 *                   success: false
 *                   message: 'Validation error'
 *                   error: '"username" is required'
 *               empty_password:
 *                 summary: Empty password
 *                 value:
 *                   success: false
 *                   message: 'Validation error'
 *                   error: '"password" is not allowed to be empty'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               message: 'Invalid credentials'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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