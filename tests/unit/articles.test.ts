import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app';
import { User } from '../../src/models/User';
import { Article } from '../../src/models/Article';

describe('Articles', () => {
  let authToken: string;
  let userId: string;
  let secondUserToken: string;
  let secondUserId: string;

  beforeEach(async () => {
    // Create first test user
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123',
      interests: ['tech'],
    };

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201);

    authToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user.id;

    // Create second test user for ownership tests
    const secondUserData = {
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'Test123',
    };

    const secondRegisterResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(secondUserData)
      .expect(201);

    secondUserToken = secondRegisterResponse.body.data.token;
    secondUserId = secondRegisterResponse.body.data.user.id;
  });

  describe('POST /api/v1/articles', () => {
    it('should create article with all fields', async () => {
      const articleData = {
        title: 'Introduction to Machine Learning',
        content: 'Machine learning is a subset of artificial intelligence that focuses on algorithms which can learn from and make predictions or decisions based on data.',
        summary: 'An overview of machine learning concepts',
        tags: ['AI', 'ML', 'Technology'],
      };

      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(articleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Article created successfully');
      expect(response.body.data.title).toBe(articleData.title);
      expect(response.body.data.content).toBe(articleData.content);
      expect(response.body.data.author).toBe('testuser'); // Auto-filled from user
      expect(response.body.data.summary).toBe(articleData.summary);
      expect(response.body.data.tags).toEqual(['ai', 'ml', 'technology']); // Normalized to lowercase
      expect(response.body.data.createdBy).toBe(userId);
      expect(response.body.data._id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should create article without summary (AI will generate)', async () => {
      const articleData = {
        title: 'Test Article Without Summary',
        content: 'This is a test article content that is long enough to pass validation and should trigger the AI summary generation fallback mechanism.',
        tags: ['test'],
      };

      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(articleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.length).toBeGreaterThan(0);
      expect(response.body.data.summary.length).toBeLessThanOrEqual(300);
    });

    it('should create article without tags', async () => {
      const articleData = {
        title: 'Article Without Tags',
        content: 'This is a test article content that is long enough to pass validation but has no tags assigned to it.',
      };

      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(articleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toEqual([]);
    });

    it('should require authentication', async () => {
      const articleData = {
        title: 'Test Article',
        content: 'This should not be created without authentication.',
      };

      const response = await request(app)
        .post('/api/v1/articles')
        .send(articleData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should validate title length', async () => {
      const articleData = {
        title: 'Test', // Too short (less than 5 characters)
        content: 'This is a test article content that is long enough to pass validation.',
      };

      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(articleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should validate content length', async () => {
      const articleData = {
        title: 'Valid Title',
        content: 'Too short', // Less than 50 characters
      };

      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(articleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should limit number of tags', async () => {
      const articleData = {
        title: 'Article With Too Many Tags',
        content: 'This is a test article content that is long enough to pass validation.',
        tags: Array(15).fill('tag'), // More than 10 tags
      };

      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(articleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should validate tag length', async () => {
      const articleData = {
        title: 'Article With Long Tag',
        content: 'This is a test article content that is long enough to pass validation.',
        tags: ['a'.repeat(35)], // Tag too long (>30 characters)
      };

      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(articleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('GET /api/v1/articles', () => {
    beforeEach(async () => {
      // Create test articles
      for (let i = 1; i <= 15; i++) {
        await request(app)
          .post('/api/v1/articles')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Test Article ${i}`,
            content: `This is the content for test article ${i}. It contains enough text to pass validation requirements.`,
            tags: [`tag${i}`],
          });
      }
    });

    it('should get paginated articles', async () => {
      const response = await request(app)
        .get('/api/v1/articles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Articles retrieved successfully');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(10); // Default limit
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.total).toBe(15);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.hasNext).toBe(true);
      expect(response.body.pagination.hasPrev).toBe(false);
    });

    it('should get articles with custom pagination', async () => {
      const response = await request(app)
        .get('/api/v1/articles?page=2&limit=5')
        .expect(200);

      expect(response.body.data.length).toBe(5);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.hasNext).toBe(true);
      expect(response.body.pagination.hasPrev).toBe(true);
    });

    it('should get articles with offset pagination', async () => {
      const response = await request(app)
        .get('/api/v1/articles?limit=5&offset=10')
        .expect(200);

      expect(response.body.data.length).toBe(5);
      expect(response.body.pagination.page).toBe(3); // offset 10 with limit 5 = page 3
    });

    it('should include user information in articles', async () => {
      const response = await request(app)
        .get('/api/v1/articles')
        .expect(200);

      const article = response.body.data[0];
      expect(article.createdBy).toBeDefined();
      expect(article.createdBy.username).toBe('testuser');
      expect(article.createdBy._id).toBe(userId);
    });

    it('should sort articles by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/v1/articles')
        .expect(200);

      const articles = response.body.data;
      for (let i = 0; i < articles.length - 1; i++) {
        const currentDate = new Date(articles[i].createdAt);
        const nextDate = new Date(articles[i + 1].createdAt);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    it('should handle empty result set', async () => {
      // Clear all articles
      await Article.deleteMany({});

      const response = await request(app)
        .get('/api/v1/articles')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.totalPages).toBe(0);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/articles?page=invalid&limit=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400); // Should reject invalid params

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid pagination parameters');
    });
  });

  describe('GET /api/v1/articles/:id', () => {
    let articleId: string;

    beforeEach(async () => {
      const articleResponse = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Article for Retrieval',
          content: 'This is a test article that will be retrieved by ID in the tests.',
          summary: 'Test summary',
          tags: ['test', 'retrieval'],
        });

      articleId = articleResponse.body.data._id;
    });

    it('should get article by valid ID', async () => {
      const response = await request(app)
        .get(`/api/v1/articles/${articleId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Article retrieved successfully');
      expect(response.body.data._id).toBe(articleId);
      expect(response.body.data.title).toBe('Test Article for Retrieval');
      expect(response.body.data.createdBy).toBeDefined();
      expect(response.body.data.createdBy.username).toBe('testuser');
      expect(response.body.data.createdBy.email).toBe('test@example.com');
      expect(response.body.data.createdBy.interests).toEqual(['tech']);
    });

    it('should return 404 for non-existent article', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/articles/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Article not found');
    });

    it('should validate article ID format', async () => {
      const response = await request(app)
        .get('/api/v1/articles/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid article ID');
      expect(response.body.error).toBe('Invalid ID format');
    });
  });

  describe('PUT /api/v1/articles/:id', () => {
    let articleId: string;

    beforeEach(async () => {
      const articleResponse = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Original Title',
          content: 'Original content that is long enough to pass validation requirements.',
          summary: 'Original summary',
          tags: ['original'],
        });

      articleId = articleResponse.body.data._id;
    });

    it('should update article by owner', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content that is long enough to pass validation requirements.',
        summary: 'Updated summary',
        tags: ['updated', 'modified'],
      };

      const response = await request(app)
        .put(`/api/v1/articles/${articleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Article updated successfully');
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.content).toBe(updateData.content);
      expect(response.body.data.summary).toBe(updateData.summary);
      expect(response.body.data.tags).toEqual(['updated', 'modified']);
    });

    it('should not allow non-owner to update article', async () => {
      const updateData = {
        title: 'Unauthorized Update',
        content: 'This should not be allowed to be updated by a different user.',
      };

      const response = await request(app)
        .put(`/api/v1/articles/${articleId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized to update this article');
    });

    it('should require authentication for update', async () => {
      const updateData = {
        title: 'Unauthorized Update',
        content: 'This should require authentication.',
      };

      const response = await request(app)
        .put(`/api/v1/articles/${articleId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should generate new summary if content changed and no summary provided', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Completely new content that is different from the original and long enough to pass validation.',
        // No summary provided
      };

      const response = await request(app)
        .put(`/api/v1/articles/${articleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary).not.toBe('Original summary');
    });

    it('should validate update data', async () => {
      const updateData = {
        title: 'Test', // Too short
        content: 'Short', // Too short
      };

      const response = await request(app)
        .put(`/api/v1/articles/${articleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('DELETE /api/v1/articles/:id', () => {
    let articleId: string;

    beforeEach(async () => {
      const articleResponse = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Article to Delete',
          content: 'This article will be deleted in the test cases to verify delete functionality works properly.',
        })
        .expect(201);

      articleId = articleResponse.body.data._id;
    });

    it('should delete article by owner', async () => {
      const response = await request(app)
        .delete(`/api/v1/articles/${articleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Article deleted successfully');

      // Verify article is actually deleted
      const article = await Article.findById(articleId);
      expect(article).toBeNull();
    });

    it('should not allow non-owner to delete article', async () => {
      const response = await request(app)
        .delete(`/api/v1/articles/${articleId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Not authorized to delete this article');

      // Verify article still exists
      const article = await Article.findById(articleId);
      expect(article).toBeTruthy();
    });

    it('should require authentication for deletion', async () => {
      const response = await request(app)
        .delete(`/api/v1/articles/${articleId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should return 404 for non-existent article', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/v1/articles/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Article not found');
    });
  });
});