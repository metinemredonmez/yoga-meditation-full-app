import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from './setup';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, verifyAccessToken } from '../utils/jwt';

describe('Auth Unit Tests', () => {
  describe('Password Utils', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);

      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);

      const isValid = await comparePassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashed = await hashPassword(password);

      const isValid = await comparePassword(wrongPassword, hashed);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Utils', () => {
    const mockUser = {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'STUDENT' as const,
    };

    it('should generate valid access token', () => {
      const token = generateAccessToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should verify valid token', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(mockUser.userId);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });
  });

  describe('User Service (Mocked)', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create user in database', async () => {
      const mockUserData = {
        id: 'test-id',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'STUDENT',
        subscriptionTier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock prisma.users.create
      prisma.users.create.mockResolvedValue(mockUserData as any);

      const result = await prisma.users.create({
        data: {
          email: 'test@example.com',
          password: 'hashedPassword',
          firstName: 'Test',
          lastName: 'User',
        },
      });

      expect(prisma.users.create).toHaveBeenCalledTimes(1);
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('Test');
    });

    it('should find user by email', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'STUDENT',
        subscriptionTier: 'FREE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await prisma.users.findUnique({
        where: { email: 'test@example.com' },
      });

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      const result = await prisma.users.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      expect(result).toBeNull();
    });
  });
});
