import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

/**
 * Get notification settings and stats for instructor
 */
export async function getNotificationSettings(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const instructor = await prisma.instructor_profiles.findFirst({
      where: { userId },
      select: {
        id: true,
        tier: true,
        displayName: true,
      },
    });

    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    // Get notification stats
    const notificationLogs = await prisma.notification_logs.findMany({
      where: {
        // Notifications sent by this instructor
        metadata: {
          path: ['instructorId'],
          equals: instructor.id,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        tier: instructor.tier,
        canSendNotifications: ['PRO', 'ELITE', 'PLATFORM_OWNER'].includes(instructor.tier),
        recentNotifications: notificationLogs,
        limits: {
          STARTER: { perDay: 0, perMonth: 0 },
          PRO: { perDay: 50, perMonth: 500 },
          ELITE: { perDay: -1, perMonth: -1 }, // unlimited
          PLATFORM_OWNER: { perDay: -1, perMonth: -1 },
        }[instructor.tier] || { perDay: 0, perMonth: 0 },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get notification settings');
    res.status(500).json({ success: false, error: 'Failed to get notification settings' });
  }
}

/**
 * Send push notification to students
 */
export async function sendNotificationToStudents(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { title, body, targetType, targetIds, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, error: 'Title and body are required' });
    }

    const instructor = await prisma.instructor_profiles.findFirst({
      where: { userId },
      select: { id: true, displayName: true, tier: true },
    });

    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    // Get instructor's classes
    const instructorClasses = await prisma.classes.findMany({
      where: { instructorId: userId },
      select: { id: true },
    });

    const classIds = instructorClasses.map((c) => c.id);

    // Get students who booked these classes
    let studentIds: string[] = [];

    if (targetType === 'all') {
      // All students of this instructor
      const bookings = await prisma.bookings.findMany({
        where: {
          classId: { in: classIds },
          status: 'CONFIRMED',
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      studentIds = bookings.map((b) => b.userId);
    } else if (targetType === 'class' && targetIds?.length > 0) {
      // Students of specific class(es)
      const bookings = await prisma.bookings.findMany({
        where: {
          classId: { in: targetIds.filter((id: string) => classIds.includes(id)) },
          status: 'CONFIRMED',
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      studentIds = bookings.map((b) => b.userId);
    } else if (targetType === 'selected' && targetIds?.length > 0) {
      // Specific students (verify they are instructor's students)
      const bookings = await prisma.bookings.findMany({
        where: {
          classId: { in: classIds },
          userId: { in: targetIds },
          status: 'CONFIRMED',
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      studentIds = bookings.map((b) => b.userId);
    }

    if (studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No students found for the selected criteria',
      });
    }

    // Get push tokens for these students
    const pushTokens = await prisma.push_tokens.findMany({
      where: {
        userId: { in: studentIds },
        isActive: true,
      },
      select: { token: true, userId: true, platform: true },
    });

    // Create notification records
    const notifications = await Promise.all(
      studentIds.map((studentId) =>
        prisma.notifications.create({
          data: {
            userId: studentId,
            type: 'INSTRUCTOR_MESSAGE',
            title,
            message: body,
            data: {
              instructorId: instructor.id,
              instructorName: instructor.displayName,
              ...data,
            },
          },
        })
      )
    );

    // Log the notification send
    await prisma.notification_logs.create({
      data: {
        type: 'INSTRUCTOR_BROADCAST',
        status: 'SENT',
        recipientCount: studentIds.length,
        metadata: {
          instructorId: instructor.id,
          title,
          body,
          targetType,
          pushTokenCount: pushTokens.length,
        },
      },
    });

    // TODO: Actually send push notifications via Firebase/OneSignal
    // This would integrate with your existing push notification service

    res.json({
      success: true,
      data: {
        sentTo: studentIds.length,
        pushTokensFound: pushTokens.length,
        notificationsCreated: notifications.length,
        message: `${studentIds.length} öğrenciye bildirim gönderildi`,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to send notification to students');
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
}

/**
 * Get instructor's tier info and upgrade options
 */
export async function getTierInfo(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const instructor = await prisma.instructor_profiles.findFirst({
      where: { userId },
      select: {
        id: true,
        tier: true,
        displayName: true,
        totalStudents: true,
        totalClasses: true,
      },
    });

    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    const tierPlans = [
      {
        id: 'STARTER',
        name: 'Başlangıç',
        price: 0,
        currency: 'TRY',
        interval: 'month',
        features: [
          '10 ders oluşturma',
          '2 program oluşturma',
          '50 öğrenci',
          'Temel analitik',
        ],
        limits: {
          maxClasses: 10,
          maxPrograms: 2,
          maxStudents: 50,
          canSendNotifications: false,
          canSendEmails: false,
        },
      },
      {
        id: 'PRO',
        name: 'Profesyonel',
        price: 299,
        currency: 'TRY',
        interval: 'month',
        popular: true,
        features: [
          '50 ders oluşturma',
          '10 program oluşturma',
          '500 öğrenci',
          'Gelişmiş analitik',
          'Push bildirimi gönderme',
          'E-posta gönderme',
          'Öncelikli destek',
        ],
        limits: {
          maxClasses: 50,
          maxPrograms: 10,
          maxStudents: 500,
          canSendNotifications: true,
          canSendEmails: true,
        },
      },
      {
        id: 'ELITE',
        name: 'Elit',
        price: 599,
        currency: 'TRY',
        interval: 'month',
        features: [
          'Sınırsız ders',
          'Sınırsız program',
          'Sınırsız öğrenci',
          'Tam analitik erişimi',
          'Sınırsız bildirim',
          'Kampanya oluşturma',
          'API erişimi',
          '7/24 VIP destek',
        ],
        limits: {
          maxClasses: -1,
          maxPrograms: -1,
          maxStudents: -1,
          canSendNotifications: true,
          canSendEmails: true,
          canCreateCampaigns: true,
        },
      },
    ];

    res.json({
      success: true,
      data: {
        currentTier: instructor.tier,
        stats: {
          totalStudents: instructor.totalStudents,
          totalClasses: instructor.totalClasses,
        },
        plans: tierPlans,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get tier info');
    res.status(500).json({ success: false, error: 'Failed to get tier info' });
  }
}

/**
 * Upgrade instructor tier (creates payment intent)
 */
export async function upgradeTier(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { targetTier } = req.body;

    if (!['PRO', 'ELITE'].includes(targetTier)) {
      return res.status(400).json({ success: false, error: 'Invalid tier' });
    }

    const instructor = await prisma.instructor_profiles.findFirst({
      where: { userId },
      select: { id: true, tier: true },
    });

    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    // TODO: Create Stripe/RevenueCat subscription
    // For now, return a mock payment URL

    const prices = {
      PRO: 299,
      ELITE: 599,
    };

    res.json({
      success: true,
      data: {
        currentTier: instructor.tier,
        targetTier,
        price: prices[targetTier as keyof typeof prices],
        currency: 'TRY',
        // In production, this would be a Stripe checkout URL
        checkoutUrl: `/api/instructor/billing/checkout?tier=${targetTier}`,
        message: 'Ödeme sayfasına yönlendiriliyorsunuz',
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to upgrade tier');
    res.status(500).json({ success: false, error: 'Failed to initiate upgrade' });
  }
}

/**
 * Handle successful payment and update tier
 */
export async function confirmTierUpgrade(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { tier, paymentId } = req.body;

    if (!['PRO', 'ELITE'].includes(tier)) {
      return res.status(400).json({ success: false, error: 'Invalid tier' });
    }

    // TODO: Verify payment with Stripe/RevenueCat

    // Update instructor tier
    const instructor = await prisma.instructor_profiles.update({
      where: { userId },
      data: { tier: tier as any },
    });

    // Log the upgrade
    await prisma.audit_logs.create({
      data: {
        userId,
        action: 'INSTRUCTOR_TIER_UPGRADE',
        entityType: 'instructors',
        entityId: instructor.id,
        metadata: {
          previousTier: instructor.tier,
          newTier: tier,
          paymentId,
        },
      },
    });

    res.json({
      success: true,
      data: {
        tier: instructor.tier,
        message: `Kademeniz ${tier} olarak güncellendi!`,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to confirm tier upgrade');
    res.status(500).json({ success: false, error: 'Failed to confirm upgrade' });
  }
}
