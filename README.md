# ArticleArc - Content Aggregator API

A scalable, secure, and maintainable content aggregator service built with TypeScript, Express, MongoDB, and Gemini AI for intelligent summary generation. This project implements a RESTful API for managing articles, user authentication, and AI-powered content summarization with comprehensive security and validation features.

## 🚀 Features

- **🔐 JWT Authentication**: Secure user registration and login with password hashing
- **📝 Article Management**: Full CRUD operations with AI-powered summary generation
- **🤖 AI Integration**: Google Gemini API with intelligent fallback mechanisms
- **👥 User Interactions**: Track user engagement (views, likes, shares)
- **🛡️ Enterprise Security**: Rate limiting, input sanitization, CORS, security headers
- **📊 Pagination**: Efficient data retrieval with metadata
- **🧪 Comprehensive Testing**: Unit tests with Jest and Supertest
- **🐳 Docker Ready**: Complete containerization with Docker Compose
- **⚡ Production Optimized**: Built for scalability and performance

## 🛠️ Technology Stack

| Category | Technologies |
|----------|-------------|
| **Runtime** | Node.js 18+, TypeScript 5+ |
| **Framework** | Express.js with middleware ecosystem |
| **Database** | MongoDB 7+ with Mongoose ODM |
| **Authentication** | JWT tokens, bcryptjs hashing |
| **AI/ML** | Google Gemini API, extractive fallback |
| **Validation** | Joi schema validation |
| **Security** | Helmet, express-rate-limit, CORS |
| **Testing** | Jest, Supertest, MongoDB Memory Server |
| **DevOps** | Docker, Docker Compose, ESLint |

## 📚 API Documentation

### Base URL
```
Development: http://localhost:3001/api/v1/v1
Production: https://your-domain.com/api/v1/v1
```

### 🔐 Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com", 
  "password": "SecurePass123",
  "interests": ["tech", "programming", "ai"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f5b2327183430d1a67d8f1",
      "username": "johndoe",
      "email": "john@example.com",
      "interests": ["tech", "programming", "ai"],
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "johndoe",  // or email
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user details */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 📄 Articles Endpoints

#### Create Article
```http
POST /api/v1/articles
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Introduction to Machine Learning",
  "content": "Machine learning is a subset of artificial intelligence...",
  "summary": "", // Optional - AI will generate if empty
  "tags": ["AI", "ML", "Technology"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Article created successfully",
  "data": {
    "_id": "64f5b2807183430d1a67d8f5",
    "title": "Introduction to Machine Learning",
    "content": "Machine learning is a subset...",
    "author": "John Doe",
    "summary": "Machine learning is a subset of AI that focuses...", // AI-generated
    "tags": ["ai", "ml", "technology"], // normalized to lowercase
    "createdBy": "64f5b2327183430d1a67d8f1",
    "createdAt": "2024-01-15T10:35:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

#### Get Articles (Paginated)
```http
GET /api/v1/articles?page=1&limit=10&offset=0
```

**Response (200):**
```json
{
  "success": true,
  "message": "Articles retrieved successfully",
  "data": [
    {
      "_id": "64f5b2807183430d1a67d8f5",
      "title": "Introduction to Machine Learning",
      "content": "Full article content...",
      "author": "John Doe",
      "summary": "AI-generated summary...",
      "tags": ["ai", "ml", "technology"],
      "createdBy": {
        "_id": "64f5b2327183430d1a67d8f1",
        "username": "johndoe"
      },
      "createdAt": "2024-01-15T10:35:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get Single Article
```http
GET /api/v1/articles/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Article retrieved successfully",
  "data": {
    "_id": "64f5b2807183430d1a67d8f5",
    "title": "Introduction to Machine Learning",
    "content": "Full article content...",
    "author": "John Doe",
    "summary": "AI-generated summary...",
    "tags": ["ai", "ml", "technology"],
    "createdBy": {
      "_id": "64f5b2327183430d1a67d8f1",
      "username": "johndoe",
      "email": "john@example.com",
      "interests": ["tech", "programming", "ai"]
    },
    "createdAt": "2024-01-15T10:35:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

#### Update Article
```http
PUT /api/v1/articles/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "author": "John Doe",
  "tags": ["updated", "tags"]
}
```

#### Delete Article
```http
DELETE /api/v1/articles/:id
Authorization: Bearer <jwt_token>
```

### 👥 User Endpoints

#### Create User Profile
```http
POST /api/v1/users
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "SecurePass123",
  "interests": ["science", "research"]
}
```

### 🔄 Interaction Endpoints

#### Record User Interaction
```http
POST /api/v1/interactions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "articleId": "64f5b2807183430d1a67d8f5",
  "interactionType": "view" // or "like", "share"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Interaction recorded successfully",
  "data": {
    "_id": "64f5b2dd7183430d1a67d902",
    "userId": {
      "_id": "64f5b2327183430d1a67d8f1",
      "username": "johndoe"
    },
    "articleId": {
      "_id": "64f5b2807183430d1a67d8f5",
      "title": "Introduction to Machine Learning",
      "author": "John Doe"
    },
    "interactionType": "view",
    "createdAt": "2024-01-15T10:40:00.000Z"
  }
}
```

### 🏥 Health Check
```http
GET /api/v1/health
```

**Response (200):**
```json
{
  "success": true,
  "message": "ArticleArc API is running",
  "timestamp": "2025-09-01T15:45:00.000Z",
  "version": "1.0.0"
}
```

## 🚦 Quick Start Guide

### Prerequisites
- **Node.js**: 16+ (18+ recommended)
- **MongoDB**: 4.4+ (7+ recommended)
- **Docker**: Latest version (optional but recommended)
- **Gemini API Key**: Optional (fallback available)

### 1. Clone & Install
```bash
# Clone repository
git clone https://github.com/samuelogboye/ArticleArc
cd ArticleArc

# Install dependencies
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env 
```

**Required Environment Variables:**
```env
# Server Configuration
NODE_ENV=development
PORT=3002

# Database Configuration
MONGODB_URI=mongodb://admin:password@localhost:27017/articlearc?authSource=admin

# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
JWT_EXPIRES_IN=7d

# AI Configuration (Optional)
GEMINI_API_KEY=your-gemini-api-key

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

#### Option A: Docker (Recommended)
```bash
# Start MongoDB with Docker Compose
docker-compose up -d mongodb

# Verify MongoDB is running
docker ps
```

#### Option B: Local MongoDB
```bash
# Install MongoDB locally and start service
# Update MONGODB_URI in .env accordingly
MONGODB_URI=mongodb://localhost:27017/articlearc
```

### 4. Start Application
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

### 5. Verify Installation
```bash
# Test health endpoint
curl http://localhost:3002/api/v1/health

# Expected response:
# {"success":true,"message":"ArticleArc API is running","timestamp":"...","version":"1.0.0"}
```

## 🏗️ Project Architecture

```
ArticleArc/
├── src/
│   ├── config/              # Configuration management
│   │   ├── database.ts      # MongoDB connection
│   │   └── index.ts         # Environment variables
│   ├── controllers/         # Request handlers
│   │   ├── authController.ts
│   │   ├── articleController.ts
│   │   ├── userController.ts
│   │   └── interactionController.ts
│   ├── middleware/          # Custom middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── security.ts      # Security headers, rate limiting
│   │   └── errorHandler.ts  # Error handling
│   ├── models/              # MongoDB schemas
│   │   ├── User.ts          # User model with hooks
│   │   ├── Article.ts       # Article model with indexes
│   │   └── Interaction.ts   # User interaction tracking
│   ├── routes/              # API route definitions
│   │   ├── auth.ts          # Authentication routes
│   │   ├── articles.ts      # Article CRUD routes
│   │   ├── users.ts         # User management routes
│   │   ├── interactions.ts  # Interaction tracking routes
│   │   └── index.ts         # Route aggregation
│   ├── services/            # Business logic
│   │   └── geminiService.ts # AI integration service
│   ├── utils/               # Utility functions
│   │   ├── jwt.ts           # JWT operations
│   │   ├── validation.ts    # Joi schemas
│   │   └── pagination.ts    # Pagination helpers
│   ├── types/               # TypeScript definitions
│   │   └── index.ts         # Global type definitions
│   └── app.ts               # Express application setup
├── tests/                   # Test suites
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── setup.ts             # Test configuration
├── dist/                    # Compiled JavaScript
├── docker-compose.yml       # Docker services
├── Dockerfile              # Container configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── jest.config.js          # Test configuration
└── .env.example            # Environment template
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch

# Run specific test file
npm test -- auth.test.ts
```

### Test Coverage Goals
- **Unit Tests**: Controllers, services, utilities
- **Integration Tests**: API endpoints with database
- **Security Tests**: Authentication, validation, rate limiting
- **Performance Tests**: Response times, load handling

## 📊 Database Design

### User Collection
```javascript
{
  _id: ObjectId,
  username: String,      // Unique, 3-30 chars, alphanumeric + underscore
  email: String,         // Unique, valid email format
  password: String,      // Bcrypt hashed (12 rounds)
  interests: [String],   // Array of interest tags
  createdAt: Date,       // Auto-generated
  updatedAt: Date,       // Auto-updated
  
  // Indexes
  username: unique,
  email: unique
}
```

### Article Collection
```javascript
{
  _id: ObjectId,
  title: String,         // 5-200 chars
  content: String,       // Min 50 chars
  author: String,        // Max 100 chars
  summary: String,       // AI-generated if empty, max 500 chars
  tags: [String],        // Normalized to lowercase, max 10 tags
  createdBy: ObjectId,   // Reference to User
  createdAt: Date,
  updatedAt: Date,
  
  // Indexes
  title: text,
  content: text,
  summary: text,
  tags: 1,
  createdBy: 1,
  createdAt: -1
}
```

### Interaction Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,      // Reference to User
  articleId: ObjectId,   // Reference to Article  
  interactionType: String, // 'view' | 'like' | 'share'
  createdAt: Date,
  updatedAt: Date,
  
  // Indexes
  [userId, articleId, interactionType]: unique,
  articleId: 1,
  userId: 1,
  createdAt: -1
}
```

## 🤖 AI Integration Details

### Google Gemini API Integration
The application uses Google's Gemini Pro model for intelligent article summarization:

```typescript
// AI Service Configuration
const geminiService = new GeminiService();

// Automatic Summary Generation
if (!articleSummary) {
  try {
    if (geminiService.isAvailable()) {
      summary = await geminiService.generateSummary(content, title);
    } else {
      summary = geminiService.generateFallbackSummary(content);
    }
  } catch (error) {
    summary = geminiService.generateFallbackSummary(content);
  }
}
```

### Fallback Strategy
When Gemini API is unavailable:
1. **Extractive Summarization**: Selects key sentences using basic NLP
2. **Length Optimization**: Ensures summaries under 300 characters
3. **Error Handling**: Graceful degradation with meaningful messages

### AI Service Setup
1. **Get Gemini API Key**: https://ai.google.dev/
2. **Set Environment Variable**: `GEMINI_API_KEY=your_api_key`
3. **Restart Application**: AI service will automatically activate

## 🔒 Security Implementation

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with configurable expiration
- **Password Security**: Bcrypt with 12 rounds (configurable)
- **Route Protection**: Middleware-based authentication checks
- **User Ownership**: Users can only modify their own content

### Security Middleware Stack
```typescript
// Security headers
app.use(helmet({
  contentSecurityPolicy: { /* CSP rules */ },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // requests per window
}));

// Input sanitization
app.use(sanitizeInput);
```

### Validation Rules
- **Username**: 3-30 characters, alphanumeric + underscores
- **Email**: Valid email format, unique
- **Password**: Minimum 6 characters with complexity requirements
- **Article Title**: 5-200 characters
- **Article Content**: Minimum 50 characters
- **MongoDB IDs**: Valid ObjectId format validation

## 🚀 Production Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale application containers
docker-compose up -d --scale app=3

# View logs
docker-compose logs -f app
```

### Manual Deployment
```bash
# Build for production
npm run build

# Install only production dependencies
npm ci --only=production

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/app.js --name articlearc

# Or start with Node.js
NODE_ENV=production npm start
```

### Environment Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure strong `JWT_SECRET`
- [ ] Set up MongoDB with authentication
- [ ] Configure `GEMINI_API_KEY` (optional)
- [ ] Set up reverse proxy (Nginx)
- [ ] Configure SSL certificates
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues automatically
npm run typecheck        # Run TypeScript type checking

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Database
npm run db:seed          # Seed database with sample data (if implemented)
npm run db:migrate       # Run database migrations (if implemented)
```

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
Error: Command find requires authentication
```
**Solution**: Check MongoDB URI includes credentials:
```env
MONGODB_URI=mongodb://admin:password@localhost:27017/articlearc?authSource=admin
```

#### 2. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Change port in `.env` file:
```env
PORT=3002
```

#### 3. JWT Secret Missing
```
Error: JWT_SECRET must be set in environment variables
```
**Solution**: Add secure JWT secret to `.env`:
```env
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
```

#### 4. AI Service Not Working
- Check `GEMINI_API_KEY` is set correctly
- Verify API key has proper permissions
- Application will use fallback summarization if AI fails

### Debug Mode
```bash
# Enable debug logging
DEBUG=articlearc:* npm run dev

# Check application logs
docker-compose logs -f app

# Monitor MongoDB logs
docker-compose logs -f mongodb
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Set up environment: `cp .env.example .env`
5. Start development server: `npm run dev`

### Code Standards
- **TypeScript**: Strict typing required
- **ESLint**: Fix all linting issues before commit
- **Testing**: Maintain >80% test coverage
- **Documentation**: Update README for new features
- **Commits**: Use conventional commit format

### Pull Request Process
1. Ensure all tests pass: `npm test`
2. Verify build succeeds: `npm run build`
3. Update documentation as needed
4. Submit PR with detailed description
5. Address code review feedback

## 📚 Additional Resources

### API Testing
- **Postman Collection**: Import `docs/postman_collection.json`
- **Insomnia**: Import `docs/insomnia_collection.json`
- **cURL Examples**: See individual endpoint documentation above

### Monitoring & Logging
- **Health Endpoint**: `/api/v1/health` for uptime monitoring
- **Application Logs**: Structured JSON logging
- **Error Tracking**: Implement Sentry or similar service
- **Performance**: Monitor response times and database queries

### Scaling Considerations
- **Horizontal Scaling**: Stateless design supports load balancing
- **Database Scaling**: MongoDB replica sets and sharding
- **Caching**: Implement Redis for session management
- **CDN**: Serve static assets via CDN
- **Microservices**: Split auth, articles, and AI services

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Report security issues privately to maintainers

---

**Built with ❤️ by the ArticleArc Team**

*Last Updated: January 2025*