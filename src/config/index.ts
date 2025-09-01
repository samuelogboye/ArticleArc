import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/articlearc',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
} as const;

export const validateConfig = (): void => {
  if (!config.jwt.secret || config.jwt.secret === 'fallback-secret-change-in-production') {
    throw new Error('JWT_SECRET must be set in environment variables');
  }
  
  if (!config.ai.geminiApiKey) {
    console.warn('GEMINI_API_KEY not set - AI summary generation will be disabled');
  }
};