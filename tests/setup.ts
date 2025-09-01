// tests/setup.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Disconnect from any existing connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Create in-memory MongoDB instance for tests
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to the test database
  await mongoose.connect(mongoUri);
}, 60000);

beforeEach(async () => {
  // Clear all collections before each test
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  // Clean shutdown
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 60000);