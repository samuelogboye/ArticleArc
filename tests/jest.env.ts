// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '24h';
process.env.BCRYPT_ROUNDS = '4'; // Faster for tests

// Don't use the production database - MongoDB Memory Server handles this
delete process.env.MONGODB_URI;
delete process.env.MONGODB_TEST_URI;

// Set AI service to mock mode for tests
process.env.GEMINI_API_KEY = 'test-key-will-be-mocked';