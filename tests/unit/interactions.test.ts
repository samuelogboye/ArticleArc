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