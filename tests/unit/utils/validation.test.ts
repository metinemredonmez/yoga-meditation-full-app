import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Common validation schemas used in the app
const emailSchema = z.string().email('Invalid email format');

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format');

const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phoneNumber: phoneSchema.optional()
});

describe('Validation Schemas', () => {
  describe('Email Schema', () => {
    it('should accept valid email addresses', () => {
      expect(() => emailSchema.parse('test@example.com')).not.toThrow();
      expect(() => emailSchema.parse('user.name@domain.co.uk')).not.toThrow();
      expect(() => emailSchema.parse('user+tag@example.org')).not.toThrow();
    });

    it('should reject invalid email addresses', () => {
      expect(() => emailSchema.parse('invalid')).toThrow();
      expect(() => emailSchema.parse('missing@domain')).toThrow();
      expect(() => emailSchema.parse('@nodomain.com')).toThrow();
      expect(() => emailSchema.parse('spaces in@email.com')).toThrow();
    });
  });

  describe('Password Schema', () => {
    it('should accept valid passwords', () => {
      expect(() => passwordSchema.parse('Password123')).not.toThrow();
      expect(() => passwordSchema.parse('MySecure1Pass')).not.toThrow();
      expect(() => passwordSchema.parse('Test1234Abc')).not.toThrow();
    });

    it('should reject passwords shorter than 8 characters', () => {
      expect(() => passwordSchema.parse('Pass1')).toThrow(/at least 8 characters/);
    });

    it('should reject passwords without uppercase', () => {
      expect(() => passwordSchema.parse('password123')).toThrow(/uppercase/);
    });

    it('should reject passwords without lowercase', () => {
      expect(() => passwordSchema.parse('PASSWORD123')).toThrow(/lowercase/);
    });

    it('should reject passwords without numbers', () => {
      expect(() => passwordSchema.parse('PasswordABC')).toThrow(/number/);
    });
  });

  describe('Phone Schema', () => {
    it('should accept valid phone numbers', () => {
      expect(() => phoneSchema.parse('+905551234567')).not.toThrow();
      expect(() => phoneSchema.parse('15551234567')).not.toThrow();
      expect(() => phoneSchema.parse('+12025551234')).not.toThrow();
    });

    it('should reject invalid phone numbers', () => {
      expect(() => phoneSchema.parse('123')).toThrow();
      expect(() => phoneSchema.parse('phone123')).toThrow();
      expect(() => phoneSchema.parse('+0123456789')).toThrow(); // starts with 0
    });
  });

  describe('Pagination Schema', () => {
    it('should accept valid pagination params', () => {
      const result = paginationSchema.parse({ page: 1, limit: 20 });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should use default values when not provided', () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should reject negative page numbers', () => {
      expect(() => paginationSchema.parse({ page: -1, limit: 20 })).toThrow();
    });

    it('should reject limit over 100', () => {
      expect(() => paginationSchema.parse({ page: 1, limit: 101 })).toThrow();
    });

    it('should reject non-integer values', () => {
      expect(() => paginationSchema.parse({ page: 1.5, limit: 20 })).toThrow();
    });
  });

  describe('User Registration Schema', () => {
    it('should accept valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      expect(() => userRegistrationSchema.parse(validData)).not.toThrow();
    });

    it('should accept registration with phone number', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+905551234567'
      };

      const result = userRegistrationSchema.parse(validData);
      expect(result.phoneNumber).toBe('+905551234567');
    });

    it('should reject registration with short firstName', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'J',
        lastName: 'Doe'
      };

      expect(() => userRegistrationSchema.parse(invalidData)).toThrow();
    });

    it('should reject registration with missing required fields', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'Password123'
      };

      expect(() => userRegistrationSchema.parse(invalidData)).toThrow();
    });
  });
});
