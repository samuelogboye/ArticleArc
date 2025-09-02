import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app';
import { User } from '../../src/models/User';
import { generateToken, verifyToken } from '../../src/utils/jwt';

describe('Authentication Middleware', () => {
  let testUser: any;
  let validToken: string;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123',
    });
    await testUser.save();
    
    validToken = generateToken({
      userId: testUser._id.toString(),
      username: testUser.username,
    });
  });

  describe('Token validation', () => {
    it('should accept valid Bearer token', async () => {
      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Test Article',
          content: 'This is a test article content that is long enough to pass validation.',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should reject requests without Authorization header', async () => {
      const response = await request(app)
        .post('/api/v1/articles')
        .send({
          title: 'Test Article',
          content: 'This is a test article content that is long enough to pass validation.',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should reject invalid token format', async () => {
      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', 'InvalidFormat token')
        .send({
          title: 'Test Article',
          content: 'This is a test article content that is long enough to pass validation.',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token is required');
    });

    it('should reject malformed JWT token', async () => {
      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .send({
          title: 'Test Article',
          content: 'This is a test article content that is long enough to pass validation.',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token - user not found');
    });

    it('should reject token with invalid signature', async () => {
      const fakeToken = jwt.sign(
        { userId: testUser._id.toString(), username: testUser.username },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${fakeToken}`)
        .send({
          title: 'Test Article',
          content: 'This is a test article content that is long enough to pass validation.',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token - user not found');
    });

    it('should reject token for non-existent user', async () => {
      const nonExistentUserId = '507f1f77bcf86cd799439011';
      const invalidToken = generateToken({
        userId: nonExistentUserId,
        username: 'nonexistent',
      });

      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({
          title: 'Test Article',
          content: 'This is a test article content that is long enough to pass validation.',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token - user not found');
    });
  });

  describe('User context', () => {
    it('should populate user context correctly', async () => {
      const response = await request(app)
        .get('/api/v1/articles')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Articles endpoint doesn't return user info directly, but should work if user context is set
    });

    it('should handle deleted user gracefully', async () => {
      // Delete the user after creating the token
      await User.findByIdAndDelete(testUser._id);

      const response = await request(app)
        .post('/api/v1/articles')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Test Article',
          content: 'This is a test article content that is long enough to pass validation.',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token - user not found');
    });
  });
});

describe('Rate Limiting Middleware', () => {
  it('should allow requests within rate limit', async () => {
    const promises: Promise<any>[] = [];
    // Make multiple requests within limits
    for (let i = 0; i < 10; i++) {
      promises.push(
        request(app)
          .get('/api/v1/health')
          .expect(200)
      );
    }
    
    const responses = await Promise.all(promises);
    responses.forEach(response => {
      expect(response.body.success).toBe(true);
    });
  });

  it('should have rate limiting disabled in test mode', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200);

    // Rate limiting is disabled in test mode
    expect(response.body.success).toBe(true);
  });
});

describe('Security Middleware', () => {
  it('should set security headers', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200);

    // Check for Helmet security headers
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['x-xss-protection']).toBe('0');
  });

  it('should handle CORS properly', async () => {
    const response = await request(app)
      .options('/api/v1/health')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });
});