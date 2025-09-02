import request from 'supertest';
import { app } from '../../src/app';

describe('Basic Integration Flow', () => {
  it('should handle complete user registration and article creation flow', async () => {
    // 1. Register user
    const userData = {
      username: `testuser${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'Test123',
      interests: ['tech'],
    };

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201);

    expect(registerResponse.body.success).toBe(true);
    expect(registerResponse.body.data.token).toBeDefined();

    const token = registerResponse.body.data.token;

    // 2. Create article
    const articleData = {
      title: 'Integration Test Article',
      content: 'This is an integration test article with sufficient content to test the complete flow.',
      tags: ['integration', 'test'],
    };

    const articleResponse = await request(app)
      .post('/api/v1/articles')
      .set('Authorization', `Bearer ${token}`)
      .send(articleData)
      .expect(201);

    expect(articleResponse.body.success).toBe(true);
    expect(articleResponse.body.data.title).toBe(articleData.title);
    expect(articleResponse.body.data.summary).toBeDefined();

    const articleId = articleResponse.body.data._id;

    // 3. Create interaction
    const interactionResponse = await request(app)
      .post('/api/v1/interactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        articleId,
        interactionType: 'view',
      })
      .expect(201);

    expect(interactionResponse.body.success).toBe(true);
    expect(interactionResponse.body.data.interactionType).toBe('view');

    // 4. Get articles
    const getArticlesResponse = await request(app)
      .get('/api/v1/articles')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(getArticlesResponse.body.success).toBe(true);
    expect(getArticlesResponse.body.data).toHaveLength(1);

    // 5. Health check
    const healthResponse = await request(app)
      .get('/api/v1/health')
      .expect(200);

    expect(healthResponse.body.success).toBe(true);
    expect(healthResponse.body.message).toBe('ArticleArc API is running');
  });

  it('should handle error cases properly', async () => {
    // Test invalid login
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'nonexistent',
        password: 'invalid',
      })
      .expect(401);

    expect(loginResponse.body.success).toBe(false);

    // Test unauthorized article creation
    const articleResponse = await request(app)
      .post('/api/v1/articles')
      .send({
        title: 'Unauthorized Article',
        content: 'This should fail without authentication.',
      })
      .expect(401);

    expect(articleResponse.body.success).toBe(false);
  });
});