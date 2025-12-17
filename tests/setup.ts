import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/yoga_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.PORT = '4001';

// Mock Redis
vi.mock('../src/utils/redis', () => ({
  getRedisClient: vi.fn(() => null),
  testRedisConnection: vi.fn(() => Promise.resolve(false)),
  closeRedisConnection: vi.fn(() => Promise.resolve())
}));

// Mock Logger to suppress output during tests
vi.mock('../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    }))
  }
}));

// Global test hooks
beforeAll(async () => {
  // Setup before all tests
  console.log('🧪 Starting test suite...');
});

afterAll(async () => {
  // Cleanup after all tests
  console.log('✅ Test suite completed');
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});

// Global test utilities
declare global {
  // eslint-disable-next-line no-var
  var testUtils: {
    generateTestUser: () => {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    generateTestToken: (userId: string) => string;
  };
}

globalThis.testUtils = {
  generateTestUser: () => ({
    id: `test-user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'STUDENT'
  }),
  generateTestToken: (userId: string) => {
    // This would be replaced with actual JWT generation in real tests
    return `test-token-${userId}`;
  }
};
