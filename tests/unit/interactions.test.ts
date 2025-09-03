import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../src/app';
import { User } from '../../src/models/User';
import { Article } from '../../src/models/Article';
import { Interaction } from '../../src/models/Interaction';

describe('Interactions', () => {
  let authToken: string;
  let userId: string;
  let articleId: string;
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
      .send(userData);

    authToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user.id;

    // Create second test user
    const secondUserData = {
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'Test123',
    };

    const secondRegisterResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(secondUserData);

    secondUserToken = secondRegisterResponse.body.data.token;
    secondUserId = secondRegisterResponse.body.data.user.id;

    // Create test article
    const articleResponse = await request(app)
      .post('/api/v1/articles')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Article for Interactions',
        content: 'This is a test article that will be used for interaction testing.',
        tags: ['test'],
      });

    articleId = articleResponse.body.data._id;
  });

  describe('POST /api/v1/interactions', () => {
    it('should create view interaction', async () => {
      const interactionData = {
        articleId,
        interactionType: 'view',
      };

      const response = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Interaction recorded successfully');
      expect(response.body.data.interactionType).toBe('view');
      expect(response.body.data.userId._id).toBe(userId);
      expect(response.body.data.userId.username).toBe('testuser');
      expect(response.body.data.articleId._id).toBe(articleId);
      expect(response.body.data.articleId.title).toBe('Test Article for Interactions');
      expect(response.body.data.createdAt).toBeDefined();
    });

    it('should create like interaction', async () => {
      const interactionData = {
        articleId,
        interactionType: 'like',
      };

      const response = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.interactionType).toBe('like');
    });

    it('should create share interaction', async () => {
      const interactionData = {
        articleId,
        interactionType: 'share',
      };

      const response = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interactionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.interactionType).toBe('share');
    });

    it('should allow multiple different interaction types for same user-article', async () => {
      // Create view interaction
      await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          articleId,
          interactionType: 'view',
        })
        .expect(201);

      // Create like interaction for same user and article
      const likeResponse = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          articleId,
          interactionType: 'like',
        })
        .expect(201);

      expect(likeResponse.body.success).toBe(true);

      // Verify both interactions exist
      const viewInteraction = await Interaction.findOne({
        userId,
        articleId,
        interactionType: 'view',
      });
      const likeInteraction = await Interaction.findOne({
        userId,
        articleId,
        interactionType: 'like',
      });

      expect(viewInteraction).toBeTruthy();
      expect(likeInteraction).toBeTruthy();
    });

    it('should prevent duplicate interactions', async () => {
      // Create first interaction
      await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          articleId,
          interactionType: 'like',
        })
        .expect(201);

      // Try to create duplicate interaction
      const response = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          articleId,
          interactionType: 'like',
        })
        .expect(409);

      expect(response.body.success).toBe(true); // Returns existing interaction
      expect(response.body.message).toBe('Interaction already exists');
    });

    it('should allow same interaction type from different users', async () => {
      // First user likes article
      await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          articleId,
          interactionType: 'like',
        })
        .expect(201);

      // Second user likes same article
      const response = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          articleId,
          interactionType: 'like',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId._id).toBe(secondUserId);
    });

    it('should require authentication', async () => {
      const interactionData = {
        articleId,
        interactionType: 'view',
      };

      const response = await request(app)
        .post('/api/v1/interactions')
        .send(interactionData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should validate article ID format', async () => {
      const interactionData = {
        articleId: 'invalid-id',
        interactionType: 'view',
      };

      const response = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interactionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
      expect(response.body.error).toBe('Invalid article ID format');
    });

    it('should validate interaction type', async () => {
      const interactionData = {
        articleId,
        interactionType: 'invalid-type',
      };

      const response = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interactionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should return 404 for non-existent article', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const interactionData = {
        articleId: nonExistentId.toString(),
        interactionType: 'view',
      };

      const response = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interactionData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Article not found');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should not allow interaction with missing articleId', async () => {
      const interactionData = {
        interactionType: 'view',
      };

      const response = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interactionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not allow interaction with missing interactionType', async () => {
      const interactionData = {
        articleId,
      };

      const response = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interactionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/interactions', () => {
    beforeEach(async () => {
      // Create multiple interactions for testing
      await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          articleId,
          interactionType: 'view',
        });

      await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          articleId,
          interactionType: 'like',
        });

      await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          articleId,
          interactionType: 'share',
        });

      // Create additional article and interactions for testing
      const secondArticleResponse = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Second Test Article',
          content: 'This is another test article for interaction testing purposes.',
          tags: ['test2'],
        });

      const secondArticleId = secondArticleResponse.body.data._id;

      await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          articleId: secondArticleId,
          interactionType: 'view',
        });
    });

    it('should get user interactions with default pagination', async () => {
      const response = await request(app)
        .get('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Interactions retrieved successfully');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(4); // 3 for first article + 1 for second article
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.totalCount).toBe(4);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalViews).toBe(2);
      expect(response.body.stats.totalLikes).toBe(1);
      expect(response.body.stats.totalShares).toBe(1);
    });

    it('should return interactions sorted by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const interactions = response.body.data;
      for (let i = 1; i < interactions.length; i++) {
        const current = new Date(interactions[i].createdAt);
        const previous = new Date(interactions[i - 1].createdAt);
        expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
      }
    });

    it('should include populated article data', async () => {
      const response = await request(app)
        .get('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const interaction = response.body.data[0];
      expect(interaction.articleId).toBeDefined();
      expect(interaction.articleId._id).toBeDefined();
      expect(interaction.articleId.title).toBeDefined();
      expect(interaction.articleId.author).toBeDefined();
    });

    it('should filter interactions by interaction type', async () => {
      const response = await request(app)
        .get('/api/v1/interactions?interactionType=like')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].interactionType).toBe('like');
    });

    it('should filter interactions by article ID', async () => {
      const response = await request(app)
        .get(`/api/v1/interactions?articleId=${articleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(3); // view, like, share for first article
      response.body.data.forEach((interaction: any) => {
        expect(interaction.articleId._id).toBe(articleId);
      });
    });

    it('should support pagination with page and limit', async () => {
      const response = await request(app)
        .get('/api/v1/interactions?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.totalCount).toBe(4);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('should handle second page of results', async () => {
      const response = await request(app)
        .get('/api/v1/interactions?page=2&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should return empty array for page beyond available data', async () => {
      const response = await request(app)
        .get('/api/v1/interactions?page=10&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body.pagination.page).toBe(10);
      expect(response.body.pagination.totalCount).toBe(4);
    });

    it('should combine filters (interactionType and articleId)', async () => {
      const response = await request(app)
        .get(`/api/v1/interactions?articleId=${articleId}&interactionType=view`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].interactionType).toBe('view');
      expect(response.body.data[0].articleId._id).toBe(articleId);
    });

    it('should only return interactions for authenticated user', async () => {
      // Create interaction for second user
      await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          articleId,
          interactionType: 'like',
        });

      // First user should not see second user's interactions
      const response = await request(app)
        .get('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      response.body.data.forEach((interaction: any) => {
        // Note: userId is not populated in GET response for privacy
        // The filter is applied server-side
        expect(interaction.userId).toBeUndefined();
      });
      expect(response.body.data.length).toBe(4); // Only first user's interactions
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/interactions')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should validate page parameter', async () => {
      const response = await request(app)
        .get('/api/v1/interactions?page=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid query parameters');
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/interactions?limit=101')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid query parameters');
    });

    it('should validate interaction type filter', async () => {
      const response = await request(app)
        .get('/api/v1/interactions?interactionType=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid query parameters');
      expect(response.body.error).toContain('interactionType');
    });

    it('should validate article ID format', async () => {
      const response = await request(app)
        .get('/api/v1/interactions?articleId=invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid query parameters');
      expect(response.body.error).toBe('Invalid article ID format');
    });

    it('should return correct statistics', async () => {
      const response = await request(app)
        .get('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.stats).toBeDefined();
      expect(typeof response.body.stats.totalViews).toBe('number');
      expect(typeof response.body.stats.totalLikes).toBe('number');
      expect(typeof response.body.stats.totalShares).toBe('number');
      expect(response.body.stats.totalViews + response.body.stats.totalLikes + response.body.stats.totalShares)
        .toBe(response.body.pagination.totalCount);
    });

    it('should return empty results for non-existent article ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/interactions?articleId=${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body.pagination.totalCount).toBe(0);
    });

    it('should handle user with no interactions', async () => {
      // Create a new user with no interactions
      const newUserData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Test123',
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(newUserData);

      const newUserToken = registerResponse.body.data.token;

      const response = await request(app)
        .get('/api/v1/interactions')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body.pagination.totalCount).toBe(0);
      expect(response.body.stats.totalViews).toBe(0);
      expect(response.body.stats.totalLikes).toBe(0);
      expect(response.body.stats.totalShares).toBe(0);
    });
  });

  describe('Interaction data integrity', () => {
    it('should store interaction with correct user ID from token', async () => {
      const interactionData = {
        articleId,
        interactionType: 'view',
      };

      await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(interactionData)
        .expect(201);

      const interaction = await Interaction.findOne({
        articleId,
        interactionType: 'view',
      });

      expect(interaction).toBeTruthy();
      expect((interaction?.userId as any).toString()).toBe(userId);
    });

    it('should create interaction with proper timestamps', async () => {
      const beforeTime = new Date();

      const response = await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          articleId,
          interactionType: 'view',
        })
        .expect(201);

      const afterTime = new Date();
      const createdAt = new Date(response.body.data.createdAt);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should maintain referential integrity', async () => {
      await request(app)
        .post('/api/v1/interactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          articleId,
          interactionType: 'like',
        })
        .expect(201);

      // Verify the interaction references correct user and article
      const interaction = await Interaction.findOne({
        interactionType: 'like',
      }).populate('userId').populate('articleId');

      expect(interaction).toBeTruthy();
      expect((interaction?.userId as any).username).toBe('testuser');
      expect((interaction?.articleId as any).title).toBe('Test Article for Interactions');
    });
  });

  describe('User and Article endpoints', () => {
    it('should create user profile', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Test123',
        interests: ['science', 'research'],
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.data.username).toBe(userData.username);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data.interests).toEqual(['science', 'research']);
      expect(response.body.data.password).toBeUndefined(); // Should not return password
    });

    it('should not create user with existing username', async () => {
      const userData = {
        username: 'testuser', // Already exists
        email: 'different@example.com',
        password: 'Test123',
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('username');
    });

    it('should not create user with existing email', async () => {
      const userData = {
        username: 'differentuser',
        email: 'test@example.com', // Already exists
        password: 'Test123',
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });
  });

  describe('Health check', () => {
    it('should return API health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('ArticleArc API is running');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});