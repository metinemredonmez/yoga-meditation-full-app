import { PayoutMethod, PayoutStatus, Prisma } from '@prisma/client';
import { prisma } from '../utils/database';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import * as instructorEarningsService from './instructorEarningsService';

// ============================================
// Types
// ============================================

interface PayoutSettingsInput {
  preferredMethod: PayoutMethod;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    iban: string;
    swiftCode?: string;
    accountHolder: string;
  };
  paypalEmail?: string;
  stripeConnectId?: string;
  wiseRecipientId?: string;
  taxId?: string;
  taxCountry?: string;
  autoPayoutEnabled?: boolean;
  autoPayoutDay?: number;
}

interface RequestPayoutInput {
  instructorId: string;
  amount: number;
  method: PayoutMethod;
  notes?: string;
}

// ============================================
// Payout Settings
// ============================================

/**
 * Get or create payout settings for instructor
 */
export async function getPayoutSettings(instructorId: string) {
  let settings = await prisma.instructorPayoutSettings.findUnique({
    where: { instructorId },
  });

  if (!settings) {
    settings = await prisma.instructorPayoutSettings.create({
      data: {
        instructorId,
        preferredMethod: 'BANK_TRANSFER',
      },
    });
  }

  return settings;
}

/**
 * Update payout settings
 */
export async function updatePayoutSettings(
  instructorId: string,
  input: PayoutSettingsInput,
) {
  const settings = await prisma.instructorPayoutSettings.upsert({
    where: { instructorId },
    update: {
      preferredMethod: input.preferredMethod,
      bankDetails: input.bankDetails as Prisma.InputJsonValue,
      paypalEmail: input.paypalEmail,
      stripeConnectId: input.stripeConnectId,
      wiseRecipientId: input.wiseRecipientId,
      taxId: input.taxId,
      taxCountry: input.taxCountry,
      autoPayoutEnabled: input.autoPayoutEnabled,
      autoPayoutDay: input.autoPayoutDay,
    },
    create: {
      instructorId,
      preferredMethod: input.preferredMethod,
      bankDetails: input.bankDetails as Prisma.InputJsonValue,
      paypalEmail: input.paypalEmail,
      stripeConnectId: input.stripeConnectId,
      wiseRecipientId: input.wiseRecipientId,
      taxId: input.taxId,
      taxCountry: input.taxCountry,
      autoPayoutEnabled: input.autoPayoutEnabled ?? false,
      autoPayoutDay: input.autoPayoutDay ?? 1,
    },
  });

  logger.info({ instructorId }, 'Payout settings updated');

  return settings;
}

// ============================================
// Stripe Connect
// ============================================

/**
 * Generate Stripe Connect onboarding URL
 */
export async function setupStripeConnect(instructorId: string): Promise<string> {
  const instructor = await prisma.instructorProfile.findUnique({
    where: { id: instructorId },
    include: { user: true },
  });

  if (!instructor) {
    throw new Error('Instructor not found');
  }

  // This is a placeholder - you would integrate with Stripe Connect API
  // For now, return a mock URL
  const accountId = `acct_${instructor.id.substring(0, 16)}`;

  // Store the account ID
  await prisma.instructorPayoutSettings.upsert({
    where: { instructorId },
    update: { stripeConnectId: accountId },
    create: {
      instructorId,
      stripeConnectId: accountId,
      preferredMethod: 'STRIPE_CONNECT',
    },
  });

  // In production, you would create a Stripe Connect account and return the onboarding URL
  const onboardingUrl = `https://connect.stripe.com/setup/mock/${accountId}`;

  logger.info({ instructorId, accountId }, 'Stripe Connect setup initiated');

  return onboardingUrl;
}

/**
 * Verify Stripe Connect onboarding completion
 */
export async function verifyStripeConnect(
  instructorId: string,
  code: string,
): Promise<boolean> {
  // This is a placeholder - you would verify with Stripe API
  // In production, exchange the code for access token and verify account status

  await prisma.instructorPayoutSettings.update({
    where: { instructorId },
    data: {
      stripeConnectOnboarded: true,
    },
  });

  logger.info({ instructorId }, 'Stripe Connect verified');

  return true;
}

// ============================================
// Payout Management
// ============================================

/**
 * Request a payout
 */
export async function requestPayout(input: RequestPayoutInput) {
  const instructor = await prisma.instructorProfile.findUnique({
    where: { id: input.instructorId },
    include: { payoutSettings: true },
  });

  if (!instructor) {
    throw new Error('Instructor not found');
  }

  // Check minimum payout threshold
  if (input.amount < Number(instructor.minimumPayout)) {
    throw new Error(
      `Minimum payout amount is ${instructor.minimumPayout} ${instructor.minimumPayout}`,
    );
  }

  // Check available balance
  const availableBalance = await instructorEarningsService.getPendingAmount(
    input.instructorId,
  );

  if (input.amount > availableBalance) {
    throw new Error(
      `Insufficient balance. Available: ${availableBalance}, Requested: ${input.amount}`,
    );
  }

  // Validate payout method settings
  const settings = instructor.payoutSettings;
  if (input.method === 'BANK_TRANSFER' && !settings?.bankDetails) {
    throw new Error('Bank details not configured');
  }
  if (input.method === 'PAYPAL' && !settings?.paypalEmail) {
    throw new Error('PayPal email not configured');
  }
  if (input.method === 'STRIPE_CONNECT' && !settings?.stripeConnectOnboarded) {
    throw new Error('Stripe Connect not set up');
  }
  if (input.method === 'WISE' && !settings?.wiseRecipientId) {
    throw new Error('Wise recipient not configured');
  }

  // Create payout request
  const payout = await prisma.instructorPayout.create({
    data: {
      instructorId: input.instructorId,
      amount: input.amount,
      method: input.method,
      status: 'PENDING',
      bankDetails: settings?.bankDetails as Prisma.InputJsonValue,
      paypalEmail: settings?.paypalEmail,
      stripeConnectId: settings?.stripeConnectId,
      wiseRecipientId: settings?.wiseRecipientId,
      notes: input.notes,
      requestedAt: new Date(),
    },
  });

  logger.info(
    { payoutId: payout.id, instructorId: input.instructorId, amount: input.amount },
    'Payout requested',
  );

  return payout;
}

/**
 * Process a payout (admin action)
 */
export async function processPayout(payoutId: string, adminId: string) {
  const payout = await prisma.instructorPayout.findUnique({
    where: { id: payoutId },
    include: { instructor: true },
  });

  if (!payout) {
    throw new Error('Payout not found');
  }

  if (payout.status !== 'PENDING') {
    throw new Error(`Cannot process payout with status ${payout.status}`);
  }

  // Get confirmed earnings to assign to this payout
  const pendingEarnings = await instructorEarningsService.getPendingEarnings(
    payout.instructorId,
  );

  let totalEarnings = 0;
  const earningIds: string[] = [];

  for (const earning of pendingEarnings) {
    if (totalEarnings >= Number(payout.amount)) break;
    totalEarnings += Number(earning.netAmount);
    earningIds.push(earning.id);
  }

  // Update payout status
  const updatedPayout = await prisma.instructorPayout.update({
    where: { id: payoutId },
    data: {
      status: 'PROCESSING',
      processedAt: new Date(),
    },
  });

  // Mark earnings as associated with this payout
  await prisma.instructorEarning.updateMany({
    where: { id: { in: earningIds } },
    data: { payoutId },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'PAYOUT_PROCESSED',
      metadata: {
        payoutId,
        instructorId: payout.instructorId,
        amount: payout.amount,
        earningsCount: earningIds.length,
      },
    },
  });

  logger.info(
    { payoutId, adminId, earningsCount: earningIds.length },
    'Payout processing started',
  );

  return updatedPayout;
}

/**
 * Complete a payout (after money is transferred)
 */
export async function completePayout(
  payoutId: string,
  _adminId: string,
  transactionId: string,
  taxWithheld?: number,
) {
  const payout = await prisma.instructorPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new Error('Payout not found');
  }

  if (payout.status !== 'PROCESSING') {
    throw new Error(`Cannot complete payout with status ${payout.status}`);
  }

  // Update payout status
  const updatedPayout = await prisma.instructorPayout.update({
    where: { id: payoutId },
    data: {
      status: 'COMPLETED',
      transactionId,
      taxWithheld: taxWithheld || 0,
      completedAt: new Date(),
    },
  });

  // Mark associated earnings as paid
  await instructorEarningsService.markEarningsAsPaid(
    (
      await prisma.instructorEarning.findMany({
        where: { payoutId },
        select: { id: true },
      })
    ).map((e) => e.id),
    payoutId,
  );

  logger.info({ payoutId, transactionId }, 'Payout completed');

  return updatedPayout;
}

/**
 * Cancel a payout
 */
export async function cancelPayout(payoutId: string, adminId: string, reason: string) {
  const payout = await prisma.instructorPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new Error('Payout not found');
  }

  if (!['PENDING', 'PROCESSING'].includes(payout.status)) {
    throw new Error(`Cannot cancel payout with status ${payout.status}`);
  }

  // Update payout status
  const updatedPayout = await prisma.instructorPayout.update({
    where: { id: payoutId },
    data: {
      status: 'CANCELLED',
      failureReason: reason,
    },
  });

  // Reset associated earnings back to confirmed
  await prisma.instructorEarning.updateMany({
    where: { payoutId },
    data: {
      payoutId: null,
      status: 'CONFIRMED',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: 'PAYOUT_CANCELLED',
      metadata: { payoutId, reason },
    },
  });

  logger.info({ payoutId, reason }, 'Payout cancelled');

  return updatedPayout;
}

/**
 * Fail a payout (when transfer fails)
 */
export async function failPayout(payoutId: string, _adminId: string, reason: string) {
  const payout = await prisma.instructorPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new Error('Payout not found');
  }

  // Update payout status
  const updatedPayout = await prisma.instructorPayout.update({
    where: { id: payoutId },
    data: {
      status: 'FAILED',
      failureReason: reason,
    },
  });

  // Reset associated earnings back to confirmed
  await prisma.instructorEarning.updateMany({
    where: { payoutId },
    data: {
      payoutId: null,
      status: 'CONFIRMED',
    },
  });

  logger.error({ payoutId, reason }, 'Payout failed');

  return updatedPayout;
}

// ============================================
// Payout Queries
// ============================================

/**
 * Get payout history for instructor
 */
export async function getPayoutHistory(
  instructorId: string,
  _filters?: Record<string, unknown>,
  pagination: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 20 } = pagination;

  const [items, total] = await Promise.all([
    prisma.instructorPayout.findMany({
      where: { instructorId },
      orderBy: { requestedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.instructorPayout.count({ where: { instructorId } }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get pending payouts for admin
 */
export async function getPendingPayouts(
  _pagination?: { page?: number; limit?: number },
) {
  return prisma.instructorPayout.findMany({
    where: { status: 'PENDING' },
    orderBy: { requestedAt: 'asc' },
    include: {
      instructor: {
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });
}

/**
 * Get processing payouts for admin
 */
export async function getProcessingPayouts(
  _pagination?: { page?: number; limit?: number },
) {
  return prisma.instructorPayout.findMany({
    where: { status: 'PROCESSING' },
    orderBy: { processedAt: 'asc' },
    include: {
      instructor: {
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });
}

/**
 * Get payout by ID
 */
export async function getPayoutById(payoutId: string) {
  return prisma.instructorPayout.findUnique({
    where: { id: payoutId },
    include: {
      instructor: {
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      },
      earnings: true,
    },
  });
}

// ============================================
// Automatic Payouts (Cron Job)
// ============================================

/**
 * Process automatic payouts for instructors with auto-payout enabled
 */
export async function processAutomaticPayouts() {
  const today = new Date();
  const dayOfMonth = today.getDate();

  // Get instructors with auto-payout enabled for today
  const settings = await prisma.instructorPayoutSettings.findMany({
    where: {
      autoPayoutEnabled: true,
      autoPayoutDay: dayOfMonth,
    },
    include: {
      instructor: true,
    },
  });

  const results = {
    processed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const setting of settings) {
    try {
      const instructor = setting.instructor;

      // Get available balance
      const availableBalance = await instructorEarningsService.getPendingAmount(
        instructor.id,
      );

      // Check if balance meets minimum
      if (availableBalance < Number(instructor.minimumPayout)) {
        logger.debug(
          { instructorId: instructor.id, availableBalance },
          'Auto-payout skipped: below minimum',
        );
        results.skipped++;
        continue;
      }

      // Request payout
      await requestPayout({
        instructorId: instructor.id,
        amount: availableBalance,
        method: setting.preferredMethod,
        notes: 'Automatic monthly payout',
      });

      results.processed++;
      logger.info(
        { instructorId: instructor.id, amount: availableBalance },
        'Auto-payout requested',
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`${setting.instructorId}: ${errorMessage}`);
      logger.error({ instructorId: setting.instructorId, error }, 'Auto-payout failed');
    }
  }

  logger.info(results, 'Automatic payouts processed');

  return results;
}

/**
 * Check for stale pending payouts and alert admin
 */
export async function checkStalePendingPayouts() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const stalePayouts = await prisma.instructorPayout.findMany({
    where: {
      status: 'PENDING',
      requestedAt: {
        lt: sevenDaysAgo,
      },
    },
    include: {
      instructor: {
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (stalePayouts.length > 0) {
    logger.warn(
      { count: stalePayouts.length, payoutIds: stalePayouts.map((p) => p.id) },
      'Stale pending payouts found',
    );

    // Here you could send an email notification to admins
    // await emailService.sendAdminAlert('Stale Payouts', ...)
  }

  return stalePayouts;
}

// ============================================
// Payout Stats
// ============================================

/**
 * Get payout statistics for admin dashboard
 */
export async function getPayoutStats() {
  const [
    pendingCount,
    processingCount,
    pendingAmount,
    processingAmount,
    completedThisMonth,
    completedAmountThisMonth,
  ] = await Promise.all([
    prisma.instructorPayout.count({ where: { status: 'PENDING' } }),
    prisma.instructorPayout.count({ where: { status: 'PROCESSING' } }),
    prisma.instructorPayout.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
    }),
    prisma.instructorPayout.aggregate({
      where: { status: 'PROCESSING' },
      _sum: { amount: true },
    }),
    prisma.instructorPayout.count({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.instructorPayout.aggregate({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    pending: {
      count: pendingCount,
      amount: Number(pendingAmount._sum.amount || 0),
    },
    processing: {
      count: processingCount,
      amount: Number(processingAmount._sum.amount || 0),
    },
    completedThisMonth: {
      count: completedThisMonth,
      amount: Number(completedAmountThisMonth._sum.amount || 0),
    },
  };
}
