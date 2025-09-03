// Manual Swagger specification as a fallback for production
// This ensures the specification is available even if JSDoc scanning fails

export const manualSwaggerSpec = {
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
      url: process.env.NODE_ENV === 'production' 
        ? (process.env.API_BASE_URL || 'https://articlearcapi.samuelogboye.com')
        : `http://localhost:${process.env.PORT || 3000}`,
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
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
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          username: { type: 'string', example: 'johndoe123' },
          email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
          interests: { type: 'array', items: { type: 'string' }, example: ['technology', 'science'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Article: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
          title: { type: 'string', example: 'The Future of Artificial Intelligence' },
          content: { type: 'string', example: 'Artificial intelligence is rapidly evolving...' },
          summary: { type: 'string', example: 'An exploration of AI trends...' },
          tags: { type: 'array', items: { type: 'string' }, example: ['ai', 'technology'] },
          author: { type: 'string', example: 'johndoe123' },
          createdBy: { $ref: '#/components/schemas/User' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Interaction: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439013' },
          userId: { $ref: '#/components/schemas/User' },
          articleId: { $ref: '#/components/schemas/Article' },
          interactionType: { type: 'string', enum: ['view', 'like', 'share'], example: 'like' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'An error occurred' },
          error: { type: 'string', example: 'Detailed error information' },
        },
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'User authentication endpoints' },
    { name: 'Articles', description: 'Article management endpoints' },
    { name: 'Interactions', description: 'User interaction tracking endpoints' },
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Health', description: 'API health check endpoints' },
  ],
  paths: {
    '/api/v1/health': {
      get: {
        summary: 'Health check endpoint',
        tags: ['Health'],
        responses: {
          '200': {
            description: 'API is running successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'ArticleArc API is running' },
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string', example: '1.0.0' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string', minLength: 3, example: 'johndoe123' },
                  email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
                  password: { type: 'string', minLength: 6, example: 'SecurePass123' },
                  interests: { type: 'array', items: { type: 'string' }, example: ['technology', 'science'] },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User registered successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'User already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'Login user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'johndoe123' },
                  password: { type: 'string', example: 'SecurePass123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/v1/articles': {
      get: {
        summary: 'Get paginated list of articles',
        tags: ['Articles'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
        ],
        responses: {
          '200': {
            description: 'Articles retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Articles retrieved successfully' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Article' } },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        totalCount: { type: 'integer', example: 50 },
                        totalPages: { type: 'integer', example: 5 },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Authentication required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      post: {
        summary: 'Create a new article',
        tags: ['Articles'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string', minLength: 5, example: 'The Future of Artificial Intelligence' },
                  content: { type: 'string', minLength: 50, example: 'Artificial intelligence is rapidly evolving...' },
                  summary: { type: 'string', maxLength: 500, example: 'AI trends discussion...' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['ai', 'technology'] },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Article created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Article created successfully' },
                    data: { $ref: '#/components/schemas/Article' },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Authentication required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/v1/articles/{id}': {
      get: {
        summary: 'Get a specific article by ID',
        tags: ['Articles'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } },
        ],
        responses: {
          '200': {
            description: 'Article retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Article retrieved successfully' },
                    data: { $ref: '#/components/schemas/Article' },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid article ID', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Authentication required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Article not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        summary: 'Update an existing article',
        tags: ['Articles'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string', minLength: 5, example: 'Updated Article Title' },
                  content: { type: 'string', minLength: 50, example: 'Updated article content...' },
                  summary: { type: 'string', maxLength: 500, example: 'Updated summary...' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['updated', 'tags'] },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Article updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Article updated successfully' },
                    data: { $ref: '#/components/schemas/Article' },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Authentication required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Not authorized to update this article', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Article not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        summary: 'Delete an existing article',
        tags: ['Articles'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' } },
        ],
        responses: {
          '200': {
            description: 'Article deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Article deleted successfully' },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid article ID', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Authentication required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Not authorized to delete this article', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Article not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/v1/interactions': {
      post: {
        summary: 'Create a user interaction with an article',
        tags: ['Interactions'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['articleId', 'interactionType'],
                properties: {
                  articleId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$', example: '507f1f77bcf86cd799439012' },
                  interactionType: { type: 'string', enum: ['view', 'like', 'share'], example: 'like' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Interaction recorded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Interaction recorded successfully' },
                    data: { $ref: '#/components/schemas/Interaction' },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '401': { description: 'Authentication required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Article not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'Interaction already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/v1/users': {
      post: {
        summary: 'Create a new user (Admin endpoint)',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string', minLength: 3, example: 'johndoe123' },
                  email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
                  password: { type: 'string', minLength: 6, example: 'SecurePass123' },
                  interests: { type: 'array', items: { type: 'string' }, example: ['technology', 'science'] },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User created successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        username: { type: 'string' },
                        email: { type: 'string' },
                        interests: { type: 'array', items: { type: 'string' } },
                        createdAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '409': { description: 'User already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};