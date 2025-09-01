module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/config/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 60000, // Increase timeout for MongoDB Memory Server
  detectOpenHandles: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  resetModules: true,
  // Fix the moduleNameMapping issue - correct property name is moduleNameMapper
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  // Set environment variables for tests
  setupFiles: ['<rootDir>/tests/jest.env.ts'],
};