import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  try {
    // Disconnect from any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Create in-memory MongoDB instance for tests
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the test database
    await mongoose.connect(mongoUri);
    console.log('Test database connected successfully');
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }
}, 60000);

beforeEach(async () => {
  // Clear all collections before each test
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    const promises: Promise<any>[] = [];
    for (const key in collections) {
      promises.push(collections[key].deleteMany({}));
    }
    await Promise.all(promises);
  }
});

afterAll(async () => {
  try {
    // Clean shutdown
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Test cleanup error:', error);
  }
}, 60000);