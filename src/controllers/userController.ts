import { Request, Response } from 'express';
import { User } from '../models/User';
import { registerValidation } from '../utils/validation';
import { ApiResponse } from '../types';

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user (Admin endpoint)
 *     tags: [Users]
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
 *               summary: Basic user creation
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
 *         description: User created successfully
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
 *                   example: 'User created successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: '507f1f77bcf86cd799439011'
 *                     username:
 *                       type: string
 *                       example: 'johndoe123'
 *                     email:
 *                       type: string
 *                       example: 'john.doe@example.com'
 *                     interests:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ['technology', 'science']
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: '2023-12-01T10:30:00.000Z'
 *             example:
 *               success: true
 *               message: 'User created successfully'
 *               data:
 *                 id: '507f1f77bcf86cd799439011'
 *                 username: 'johndoe123'
 *                 email: 'john.doe@example.com'
 *                 interests: ['technology', 'science']
 *                 createdAt: '2023-12-01T10:30:00.000Z'
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