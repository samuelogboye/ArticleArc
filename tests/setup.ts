import mongoose from 'mongoose';

beforeAll(async () => {
  const mongoUrl = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/articlearc-test';
  await mongoose.connect(mongoUrl);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});