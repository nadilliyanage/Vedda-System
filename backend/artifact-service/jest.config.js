module.exports = {
  testTimeout: 30000,        // MongoMemoryServer needs extra startup time
  forceExit: true,           // Prevents Jest hanging on open Mongoose connections
  clearMocks: true,          // Reset mock state between tests
  setupFilesAfterEnv: ['./tests/setup.js'],
};
