import { vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

// Create a deep mock of PrismaClient
export const prismaMock = mockDeep<PrismaClient>();

// Reset mock before each test
beforeEach(() => {
  mockReset(prismaMock);
});

// Export type for use in tests
export type PrismaMockType = DeepMockProxy<PrismaClient>;

// Helper to setup common mock responses
export const setupPrismaMocks = {
  // User mocks
  findUser: (user: Partial<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    passwordHash: string;
    isActive: boolean;
  }> | null) => {
    prismaMock.user.findUnique.mockResolvedValue(user as never);
    prismaMock.user.findFirst.mockResolvedValue(user as never);
  },

  createUser: (user: Partial<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }>) => {
    prismaMock.user.create.mockResolvedValue(user as never);
  },

  // Class mocks
  findClass: (classItem: Partial<{
    id: string;
    title: string;
    description: string;
    instructorId: string;
  }> | null) => {
    prismaMock.class.findUnique.mockResolvedValue(classItem as never);
  },

  findClasses: (classes: Partial<{
    id: string;
    title: string;
    description: string;
    instructorId: string;
  }>[]) => {
    prismaMock.class.findMany.mockResolvedValue(classes as never);
  },

  // Program mocks
  findProgram: (program: Partial<{
    id: string;
    title: string;
    description: string;
  }> | null) => {
    prismaMock.program.findUnique.mockResolvedValue(program as never);
  },

  // Transaction mock
  transaction: <T>(result: T) => {
    prismaMock.$transaction.mockResolvedValue(result as never);
  }
};

// Mock the prisma import
vi.mock('../../src/utils/database', () => ({
  prisma: prismaMock
}));
