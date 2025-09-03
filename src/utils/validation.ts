import Joi from 'joi';

export const registerValidation = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
    }),
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    }),
  interests: Joi.array()
    .items(Joi.string().trim().max(30))
    .max(10)
    .optional(),
});

export const loginValidation = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const articleValidation = Joi.object({
  title: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .required(),
  content: Joi.string()
    .trim()
    .min(50)
    .required(),
  summary: Joi.string()
    .trim()
    .max(500)
    .optional(),
  tags: Joi.array()
    .items(Joi.string().trim().max(30))
    .max(10)
    .optional(),
});

export const interactionValidation = Joi.object({
  articleId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid article ID format',
    }),
  interactionType: Joi.string()
    .valid('view', 'like', 'share')
    .required(),
});

export const paginationValidation = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  offset: Joi.number().integer().min(0).optional(),
});

export const interactionQueryValidation = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  offset: Joi.number().integer().min(0).optional(),
  interactionType: Joi.string().valid('view', 'like', 'share').optional(),
  articleId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.pattern.base': 'Invalid article ID format',
  }),
});

export const idValidation = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ID format',
    }),
});