import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './index';

// Dynamic server URL based on environment
const getServerUrl = (): string => {
  if (config.server.nodeEnv === 'production') {
    return process.env.API_BASE_URL || 'https://articlearcapi.samuelogboye.com';
  }
  return `http://localhost:${config.server.port}`;
};

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ArticleArc API',
      version: '1.0.0',
      description: 'A comprehensive content aggregator API with AI-powered summary generation',
      contact: {
        name: 'ArticleArc API Support',
        email: 'ogboyesam@gmail.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: getServerUrl(),
        description: config.server.nodeEnv === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer {token}',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the user',
              example: '507f1f77bcf86cd799439011',
            },
            username: {
              type: 'string',
              description: 'Unique username for the user',
              example: 'johndoe123',
              minLength: 3,
              maxLength: 30,
              pattern: '^[a-zA-Z0-9_]+$',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            interests: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'List of user interests',
              example: ['technology', 'science', 'programming'],
              maxItems: 10,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
              example: '2023-12-01T10:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
              example: '2023-12-01T10:30:00.000Z',
            },
          },
          required: ['_id', 'username', 'email'],
        },
        Article: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the article',
              example: '507f1f77bcf86cd799439012',
            },
            title: {
              type: 'string',
              description: 'Article title',
              example: 'The Future of Artificial Intelligence',
              minLength: 5,
              maxLength: 200,
            },
            content: {
              type: 'string',
              description: 'Full article content',
              example: 'Artificial intelligence is rapidly evolving and transforming various industries. From healthcare to finance, AI applications are becoming more sophisticated and widespread. This article explores the current trends and future possibilities in AI development.',
              minLength: 50,
            },
            summary: {
              type: 'string',
              description: 'AI-generated or manual summary of the article',
              example: 'An exploration of current AI trends and future possibilities across various industries including healthcare and finance.',
              maxLength: 500,
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Article tags for categorization',
              example: ['artificial-intelligence', 'technology', 'future'],
              maxItems: 10,
            },
            author: {
              type: 'string',
              description: 'Article author name',
              example: 'Dr. Jane Smith',
            },
            createdBy: {
              $ref: '#/components/schemas/User',
              description: 'User who created the article',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Article creation timestamp',
              example: '2023-12-01T10:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Article last update timestamp',
              example: '2023-12-01T10:30:00.000Z',
            },
          },
          required: ['_id', 'title', 'content', 'createdBy'],
        },
        Interaction: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Unique identifier for the interaction',
              example: '507f1f77bcf86cd799439013',
            },
            userId: {
              $ref: '#/components/schemas/User',
              description: 'User who performed the interaction',
            },
            articleId: {
              $ref: '#/components/schemas/Article',
              description: 'Article that was interacted with',
            },
            interactionType: {
              type: 'string',
              enum: ['view', 'like', 'share'],
              description: 'Type of interaction',
              example: 'like',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Interaction timestamp',
              example: '2023-12-01T10:30:00.000Z',
            },
          },
          required: ['_id', 'userId', 'articleId', 'interactionType'],
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'An error occurred',
            },
            error: {
              type: 'string',
              example: 'Detailed error information',
            },
          },
          required: ['success', 'message'],
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'User registered successfully',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  allOf: [
                    { $ref: '#/components/schemas/User' },
                    {
                      type: 'object',
                      properties: {
                        password: {
                          type: 'undefined',
                          description: 'Password is never returned',
                        },
                      },
                    },
                  ],
                },
                token: {
                  type: 'string',
                  description: 'JWT authentication token',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJ1c2VybmFtZSI6ImpvaG5kb2UxMjMiLCJpYXQiOjE2Mzg5NzYwMDAsImV4cCI6MTYzOTA2MjQwMH0.xyz',
                },
              },
              required: ['user', 'token'],
            },
          },
          required: ['success', 'message', 'data'],
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              minimum: 1,
              example: 1,
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              example: 10,
              description: 'Number of items per page',
            },
            totalCount: {
              type: 'integer',
              minimum: 0,
              example: 50,
              description: 'Total number of items',
            },
            totalPages: {
              type: 'integer',
              minimum: 0,
              example: 5,
              description: 'Total number of pages',
            },
          },
          required: ['page', 'limit', 'totalCount', 'totalPages'],
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints',
      },
      {
        name: 'Articles',
        description: 'Article management endpoints',
      },
      {
        name: 'Interactions',
        description: 'User interaction tracking endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Health',
        description: 'API health check endpoints',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

export const specs = swaggerJSDoc(options);