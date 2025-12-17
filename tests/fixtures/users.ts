// Test fixtures for users

export const testUsers = {
  student: {
    id: 'test-student-001',
    email: 'student@test.com',
    firstName: 'Test',
    lastName: 'Student',
    role: 'STUDENT' as const,
    passwordHash: '$2a$12$test.hash.for.password123',
    isActive: true,
    phoneNumber: '+905551234567',
    phoneVerified: true,
    subscriptionTier: 'FREE' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  teacher: {
    id: 'test-teacher-001',
    email: 'teacher@test.com',
    firstName: 'Test',
    lastName: 'Teacher',
    role: 'TEACHER' as const,
    passwordHash: '$2a$12$test.hash.for.password123',
    isActive: true,
    phoneNumber: '+905559876543',
    phoneVerified: true,
    subscriptionTier: 'PREMIUM' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  admin: {
    id: 'test-admin-001',
    email: 'admin@test.com',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'ADMIN' as const,
    passwordHash: '$2a$12$test.hash.for.password123',
    isActive: true,
    phoneNumber: '+905551112233',
    phoneVerified: true,
    subscriptionTier: 'ENTERPRISE' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },

  inactiveUser: {
    id: 'test-inactive-001',
    email: 'inactive@test.com',
    firstName: 'Inactive',
    lastName: 'User',
    role: 'STUDENT' as const,
    passwordHash: '$2a$12$test.hash.for.password123',
    isActive: false,
    phoneNumber: null,
    phoneVerified: false,
    subscriptionTier: 'FREE' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
};

export const createTestUser = (overrides: Partial<typeof testUsers.student> = {}) => ({
  ...testUsers.student,
  id: `test-user-${Date.now()}`,
  email: `test-${Date.now()}@test.com`,
  ...overrides
});
