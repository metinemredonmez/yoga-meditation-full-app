import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import type { UserRole } from '@prisma/client';
import { prisma } from '../utils/database';
import { hashPassword, comparePassword } from '../utils/password';
import { logger } from '../utils/logger';
import { sendWelcomeEmail } from '../services/emailService';
import { createTokenPair, revokeToken, refreshTokens } from '../services/tokenService';
import { eventEmitter } from '../utils/eventEmitter';
import {
  createSignedUploadUrl,
  ALLOWED_IMAGE_TYPES,
  validateContentType,
} from '../services/storageService';
import { setAuthCookies, clearAuthCookies, getRefreshTokenFromCookies } from '../utils/cookies';
import {
  isAccountLocked,
  recordFailedAttempt,
  clearLoginAttempts,
} from '../services/loginAttemptService';
import {
  isPasswordPreviouslyUsed,
  addPasswordToHistory,
  initializePasswordHistory,
} from '../services/passwordHistoryService';
import { sendOtp, verifyOtp } from '../services/smsService';
import { maskPhoneNumber } from '../utils/otp';

// Strong password schema with complexity requirements
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

const signupSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  bio: z.string().optional(),
  // Role selection for signup
  role: z.enum(['STUDENT', 'TEACHER']).optional().default('STUDENT'),
  // Instructor application fields
  experience: z.string().optional(),
  certifications: z.string().optional(),
  specializations: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

const avatarUploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

const idParamSchema = z.object({
  id: z.string().cuid('Invalid user id'),
});

function buildUserResponse(user: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  phoneNumber: string | null;
  bio: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    phoneNumber: user.phoneNumber,
    bio: user.bio,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function recordAuditLog(params: {
  userId?: string;
  actorRole?: UserRole;
  action: string;
  metadata?: Prisma.JsonValue;
}) {
  const { userId, actorRole, action, metadata } = params;

  try {
    await prisma.audit_logs.create({
      data: {
        userId: userId ?? null,
        actorRole: actorRole ?? null,
        action,
        metadata: metadata ?? Prisma.JsonNull,
      },
    });
  } catch (error) {
    logger.warn({ err: error }, 'Failed to record audit log');
  }
}

export async function signup(req: Request, res: Response) {
  try {
    const payload = signupSchema.parse(req.body);

    const existingUser = await prisma.users.findUnique({
      where: { email: payload.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const passwordHash = await hashPassword(payload.password);

    // Determine role - only allow STUDENT or TEACHER from signup
    const requestedRole = payload.role === 'TEACHER' ? 'TEACHER' : 'STUDENT';
    const isInstructorApplication = requestedRole === 'TEACHER';

    const user = await prisma.users.create({
      data: {
        email: payload.email,
        passwordHash,
        firstName: payload.firstName ?? null,
        lastName: payload.lastName ?? null,
        phoneNumber: isInstructorApplication ? (payload.phoneNumber ?? null) : null,
        bio: payload.bio ?? null,
        role: requestedRole,
      },
    });

    // If instructor application, create instructor profile with PENDING status
    if (isInstructorApplication) {
      // Generate slug from name or email
      const emailPart = payload.email ? payload.email.split('@')[0] : null;
      const baseSlug = payload.firstName && payload.lastName
        ? `${payload.firstName}-${payload.lastName}`.toLowerCase().replace(/\s+/g, '-')
        : (emailPart ?? 'instructor').toLowerCase().replace(/[^a-z0-9-]/g, '-');

      // Ensure unique slug
      let slug = baseSlug;
      let slugCounter = 1;
      while (await prisma.instructor_profiles.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${slugCounter}`;
        slugCounter++;
      }

      await prisma.instructor_profiles.create({
        data: {
          userId: user.id,
          displayName: `${payload.firstName || ''} ${payload.lastName || ''}`.trim() || payload.email?.split('@')[0] || 'Instructor',
          slug,
          bio: payload.bio ?? null,
          specializations: payload.specializations ? payload.specializations.split(',').map((s: string) => s.trim()) : [],
          certifications: payload.certifications ? { list: payload.certifications.split(',').map((c: string) => c.trim()) } : undefined,
          yearsOfExperience: payload.experience ? parseInt(payload.experience) || 0 : 0,
          status: 'PENDING', // Requires admin approval
        },
      });
    }

    await recordAuditLog({
      userId: user.id,
      actorRole: requestedRole,
      action: isInstructorApplication ? 'instructor.application' : 'user.signup',
    });

    // Initialize password history
    await initializePasswordHistory(user.id, passwordHash);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.firstName || '').catch((err) => {
      logger.warn({ err, userId: user.id }, 'Failed to send welcome email');
    });

    // Emit user created event for webhooks
    eventEmitter.emit('user.created', {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    });

    // For instructor applications, return pending status without tokens
    if (isInstructorApplication) {
      return res.status(201).json({
        message: 'Instructor application submitted',
        status: 'pending',
        users: buildUserResponse(user),
        pendingApproval: true,
      });
    }

    // Get request metadata for token tracking
    const userAgent = req.headers['user-agent'];
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress;

    // Create token pair with new token service
    const tokens = await createTokenPair(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      userAgent,
      ipAddress,
    );

    // Set HttpOnly cookies for web clients
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return res.status(201).json({
      message: 'Account created',
      users: buildUserResponse(user),
      // Still include tokens in response for mobile/API clients
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    console.error('Signup failed', error);
    logger.error({ err: error }, 'Signup failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const payload = loginSchema.parse(req.body);
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';

    // Check if account is locked due to too many failed attempts
    const lockStatus = await isAccountLocked(payload.email);
    if (lockStatus.locked) {
      const minutes = Math.ceil((lockStatus.lockoutSeconds || 900) / 60);
      return res.status(429).json({
        error: 'Account temporarily locked',
        message: `Too many failed login attempts. Please try again in ${minutes} minutes.`,
        retryAfter: lockStatus.lockoutSeconds,
      });
    }

    const user = await prisma.users.findUnique({ where: { email: payload.email } });

    if (!user) {
      // Record failed attempt even for non-existent users (prevent enumeration)
      await recordFailedAttempt(payload.email, ipAddress);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await comparePassword(payload.password, user.passwordHash);
    if (!valid) {
      // Record failed attempt
      const attemptResult = await recordFailedAttempt(payload.email, ipAddress);

      if (attemptResult.locked) {
        return res.status(429).json({
          error: 'Account temporarily locked',
          message: 'Too many failed login attempts. Please try again in 15 minutes.',
          retryAfter: attemptResult.lockoutSeconds,
        });
      }

      return res.status(401).json({
        error: 'Invalid credentials',
        remainingAttempts: attemptResult.remainingAttempts,
      });
    }

    // Check if instructor account is pending approval
    if (user.role === 'TEACHER') {
      const instructorProfile = await prisma.instructor_profiles.findUnique({
        where: { userId: user.id },
      });

      if (instructorProfile && instructorProfile.status === 'PENDING') {
        return res.status(403).json({
          error: 'Account pending approval',
          message: 'Egitmen hesabiniz henuz onaylanmadi. Lutfen onay sureci tamamlanana kadar bekleyiniz.',
          pendingApproval: true,
        });
      }

      if (instructorProfile && instructorProfile.status === 'REJECTED') {
        return res.status(403).json({
          error: 'Account rejected',
          message: 'Egitmen basvurunuz reddedilmistir. Detayli bilgi icin bizimle iletisime gecebilirsiniz.',
          rejectionReason: instructorProfile.rejectionReason,
        });
      }

      if (instructorProfile && instructorProfile.status === 'SUSPENDED') {
        return res.status(403).json({
          error: 'Account suspended',
          message: 'Hesabiniz askiya alinmistir. Detayli bilgi icin bizimle iletisime gecebilirsiniz.',
          suspensionReason: instructorProfile.suspensionReason,
        });
      }

      // Note: For APPROVED instructors, OTP verification will be required AFTER login
      // The requiresPhoneVerification flag will be returned with the login response
      // Frontend should redirect to OTP verification page after successful login
    }

    // Clear failed attempts on successful login
    await clearLoginAttempts(payload.email);

    // Check if APPROVED instructor needs phone verification BEFORE issuing tokens
    let needsPhoneVerification = false;
    if (user.role === 'TEACHER' && user.phoneNumber) {
      const teacherProfile = await prisma.instructor_profiles.findUnique({
        where: { userId: user.id },
      });
      needsPhoneVerification = teacherProfile?.status === 'APPROVED';
    }

    // If OTP verification is required, send OTP and DON'T issue tokens yet
    if (needsPhoneVerification) {
      try {
        // Send OTP to user's phone - params: phoneNumber, purpose, userId
        const otpResult = await sendOtp(user.phoneNumber!, 'LOGIN', user.id);

        await recordAuditLog({
          userId: user.id,
          actorRole: user.role,
          action: 'user.login.otp_required',
        });

        // Return without tokens - user must verify OTP first
        return res.json({
          message: 'OTP verification required',
          success: true,
          requiresOtpVerification: true,
          userId: user.id,
          phoneNumber: maskPhoneNumber(user.phoneNumber!),
          expiresAt: otpResult.expiresAt,
        });
      } catch (otpError) {
        logger.error({ err: otpError }, 'Failed to send login OTP');
        return res.status(500).json({
          error: 'Failed to send verification code',
          message: 'SMS gönderilemedi. Lütfen tekrar deneyin.',
        });
      }
    }

    // For non-OTP users, proceed with normal login
    await recordAuditLog({
      userId: user.id,
      actorRole: user.role,
      action: 'user.login',
    });

    // Get request metadata for token tracking
    const userAgent = req.headers['user-agent'];

    // Create token pair with new token service
    const tokens = await createTokenPair(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      userAgent,
      ipAddress,
    );

    // Set HttpOnly cookies for web clients
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return res.json({
      message: 'Login successful',
      success: true,
      user: buildUserResponse(user),
      // Include tokens in response for mobile/API clients
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Login failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// OTP verification schema
const verifyOtpSchema = z.object({
  userId: z.string().cuid('Invalid user id'),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

// Resend OTP schema
const resendOtpSchema = z.object({
  userId: z.string().cuid('Invalid user id'),
});

/**
 * Verify login OTP for instructor 2FA
 */
export async function verifyLoginOtp(req: Request, res: Response) {
  try {
    const payload = verifyOtpSchema.parse(req.body);

    // Find the user
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify this is an instructor
    if (user.role !== 'TEACHER') {
      return res.status(400).json({ error: 'OTP verification not required for this account' });
    }

    // Verify phone number exists
    if (!user.phoneNumber) {
      return res.status(400).json({ error: 'Phone number not found' });
    }

    // Verify OTP
    const otpResult = await verifyOtp(user.phoneNumber, payload.code, 'LOGIN');

    if (!otpResult.success) {
      return res.status(400).json({
        error: 'Invalid OTP',
        message: otpResult.message,
        attemptsRemaining: otpResult.attemptsRemaining,
      });
    }

    // OTP verified - now create tokens and complete login
    await recordAuditLog({
      userId: user.id,
      actorRole: user.role,
      action: 'user.login.2fa',
    });

    // Update phone verified status if not already
    if (!user.phoneVerified) {
      await prisma.users.update({
        where: { id: user.id },
        data: {
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
        },
      });
    }

    // Get request metadata for token tracking
    const userAgent = req.headers['user-agent'];
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';

    // Create token pair
    const tokens = await createTokenPair(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      userAgent,
      ipAddress,
    );

    // Set HttpOnly cookies for web clients
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return res.json({
      message: 'Login successful',
      user: buildUserResponse(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        tokenType: 'Bearer',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'OTP verification failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Resend login OTP for instructor 2FA
 */
export async function resendLoginOtp(req: Request, res: Response) {
  try {
    const payload = resendOtpSchema.parse(req.body);

    // Find the user
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify this is an instructor
    if (user.role !== 'TEACHER') {
      return res.status(400).json({ error: 'OTP not required for this account' });
    }

    // Verify phone number exists
    if (!user.phoneNumber) {
      return res.status(400).json({ error: 'Phone number not found' });
    }

    // Import resendOtp from smsService
    const { resendOtp: resendOtpSms } = await import('../services/smsService');

    // Resend OTP
    const otpResult = await resendOtpSms(user.phoneNumber, 'LOGIN', user.id);

    if (!otpResult.success) {
      return res.status(429).json({
        error: 'Cannot resend OTP',
        message: otpResult.message,
      });
    }

    return res.json({
      message: 'Dogrulama kodu tekrar gonderildi',
      phoneNumber: maskPhoneNumber(user.phoneNumber),
      expiresAt: otpResult.expiresAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Resend OTP failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.users.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ users: buildUserResponse(user) });
  } catch (error) {
    logger.error({ err: error }, 'Fetch profile failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const payload = updateProfileSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.userId !== id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const updateData: Prisma.usersUpdateInput = {};

    if (payload.firstName !== undefined) {
      updateData.firstName = payload.firstName;
    }

    if (payload.lastName !== undefined) {
      updateData.lastName = payload.lastName;
    }

    if (payload.phoneNumber !== undefined) {
      updateData.phoneNumber = payload.phoneNumber ?? null;
    }

    if (payload.bio !== undefined) {
      updateData.bio = payload.bio ?? null;
    }

    const user = await prisma.users.update({
      where: { id },
      data: updateData,
    });

    await recordAuditLog({
      userId: id,
      actorRole: req.user.role,
      action: 'user.update',
      metadata: { updatedBy: req.user.userId },
    });

    // Emit user updated event for webhooks
    eventEmitter.emit('user.updated', {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      updatedAt: user.updatedAt,
      updatedFields: Object.keys(payload),
    });

    return res.json({
      message: 'Profile updated',
      users: buildUserResponse(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Update profile failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateOwnProfile(req: Request, res: Response) {
  try {
    const payload = updateProfileSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.userId;
    const updateData: Prisma.usersUpdateInput = {};

    if (payload.firstName !== undefined) {
      updateData.firstName = payload.firstName;
    }

    if (payload.lastName !== undefined) {
      updateData.lastName = payload.lastName;
    }

    if (payload.phoneNumber !== undefined) {
      updateData.phoneNumber = payload.phoneNumber ?? null;
    }

    if (payload.bio !== undefined) {
      updateData.bio = payload.bio ?? null;
    }

    if (payload.avatarUrl !== undefined) {
      updateData.avatarUrl = payload.avatarUrl ?? null;
    }

    const user = await prisma.users.update({
      where: { id: userId },
      data: updateData,
    });

    await recordAuditLog({
      userId: userId,
      actorRole: req.user.role,
      action: 'user.update',
      metadata: { updatedBy: req.user.userId },
    });

    eventEmitter.emit('user.updated', {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      updatedAt: user.updatedAt,
      updatedFields: Object.keys(payload),
    });

    return res.json({
      message: 'Profile updated',
      users: buildUserResponse(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Update own profile failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const payload = changePasswordSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.users.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await comparePassword(payload.currentPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Check password history - prevent reuse of last 5 passwords
    const wasUsedBefore = await isPasswordPreviouslyUsed(req.user.userId, payload.newPassword);
    if (wasUsedBefore) {
      return res.status(400).json({
        error: 'Password previously used',
        message: 'You cannot reuse any of your last 5 passwords. Please choose a different password.',
      });
    }

    // Add current password to history before changing
    await addPasswordToHistory(req.user.userId, user.passwordHash);

    const newPasswordHash = await hashPassword(payload.newPassword);

    await prisma.users.update({
      where: { id: req.user.userId },
      data: { passwordHash: newPasswordHash },
    });

    await recordAuditLog({
      userId: req.user.userId,
      actorRole: req.user.role,
      action: 'user.password_changed',
    });

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Change password failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteOwnAccount(req: Request, res: Response) {
  try {
    const payload = deleteAccountSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.users.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await comparePassword(payload.password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Password is incorrect' });
    }

    const userId = req.user.userId;
    const userEmail = user.email;

    await prisma.$transaction([
      prisma.bookings.deleteMany({ where: { userId } }),
      prisma.payments.deleteMany({ where: { userId } }),
      prisma.audit_logs.create({
        data: {
          userId,
          actorRole: req.user.role,
          action: 'user.self_delete',
          metadata: { deletedBy: userId },
        },
      }),
      prisma.users.delete({ where: { id: userId } }),
    ]);

    eventEmitter.emit('user.deleted', {
      userId,
      email: userEmail,
      deletedAt: new Date(),
      deletedBy: userId,
      selfDeleted: true,
    });

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Delete own account failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAvatarUploadUrl(req: Request, res: Response) {
  try {
    const payload = avatarUploadSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!validateContentType(payload.contentType, ALLOWED_IMAGE_TYPES)) {
      return res.status(400).json({
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF',
      });
    }

    const result = await createSignedUploadUrl({
      filename: payload.filename,
      contentType: payload.contentType,
      userId: req.user.userId,
      folder: 'images',
    });

    return res.json({
      uploadUrl: result.uploadUrl,
      fileUrl: result.fileUrl,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    }

    logger.error({ err: error }, 'Get avatar upload URL failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = idParamSchema.parse(req.params);

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.userId !== id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get user email before deletion for webhook
    const userToDelete = await prisma.users.findUnique({
      where: { id },
      select: { email: true },
    });

    await prisma.$transaction([
      prisma.bookings.deleteMany({ where: { userId: id } }),
      prisma.payments.deleteMany({ where: { userId: id } }),
      prisma.audit_logs.create({
        data: {
          userId: id,
          actorRole: req.user.role,
          action: 'user.delete',
          metadata: { deletedBy: req.user.userId },
        },
      }),
      prisma.users.delete({ where: { id } }),
    ]);

    // Emit user deleted event for webhooks
    eventEmitter.emit('user.deleted', {
      userId: id,
      email: userToDelete?.email ?? '',
      deletedAt: new Date(),
      deletedBy: req.user.userId,
    });

    return res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid user id', details: error.flatten() });
    }

    logger.error({ err: error }, 'Delete user failed');
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Logout - revoke refresh token and clear cookies
 */
export async function logout(req: Request, res: Response) {
  try {
    // Get refresh token from cookie or body
    const refreshToken = getRefreshTokenFromCookies(req.cookies) || req.body?.refreshToken;

    if (refreshToken) {
      await revokeToken(refreshToken);
    }

    // Clear auth cookies
    clearAuthCookies(res);

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Logout failed');
    // Still clear cookies even if revoke fails
    clearAuthCookies(res);
    return res.json({ message: 'Logged out successfully' });
  }
}

/**
 * Refresh tokens - get new access token using refresh token
 */
export async function refreshToken(req: Request, res: Response) {
  try {
    // Get refresh token from cookie or body (for mobile clients)
    const token = getRefreshTokenFromCookies(req.cookies) || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Get request metadata
    const userAgent = req.headers['user-agent'];
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress;

    const result = await refreshTokens(token, userAgent, ipAddress);

    if (!result.success) {
      // Clear cookies on failure
      clearAuthCookies(res);

      if (result.securityAlert) {
        return res.status(401).json({
          error: result.error,
          securityAlert: true,
        });
      }

      return res.status(401).json({ error: result.error });
    }

    // Set new cookies
    if (result.tokens) {
      setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

      return res.json({
        message: 'Tokens refreshed',
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: result.tokens.expiresIn,
          tokenType: 'Bearer',
        },
      });
    }

    return res.status(500).json({ error: 'Failed to refresh tokens' });
  } catch (error) {
    logger.error({ err: error }, 'Refresh token failed');
    clearAuthCookies(res);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}
