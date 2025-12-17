import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

// Create a mock prisma client
export const prisma = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;

// Mock the database module to use our mock prisma
vi.mock('../utils/database', () => ({
  prisma,
}));

beforeAll(async () => {
  // Setup mock default behaviors if needed
});

afterEach(() => {
  // Reset all mocks after each test
  mockReset(prisma);
});

afterAll(async () => {
  // Cleanup
});

export { prisma as mockPrisma };
