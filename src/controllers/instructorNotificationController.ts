import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { sendPushToUsers, isOneSignalConfigured } from '../services/oneSignalService';

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
 * Update notification settings
 */
export async function updateNotificationSettings(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { email, push } = req.body;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    const currentPrefs = (user?.preferences as any) || {};

    await prisma.users.update({
      where: { id: userId },
      data: {
        preferences: {
          ...currentPrefs,
          notifications: {
            email: {
              newStudent: email?.newStudent !== false,
              newReview: email?.newReview !== false,
              earnings: email?.earnings !== false,
              classApproval: email?.classApproval !== false,
              marketing: email?.marketing !== false,
            },
            push: {
              newStudent: push?.newStudent !== false,
              newReview: push?.newReview !== false,
              earnings: push?.earnings !== false,
              classApproval: push?.classApproval !== false,
            },
          },
        },
      },
    });

    res.json({ success: true, message: 'Bildirim ayarları güncellendi' });
  } catch (error) {
    logger.error({ error }, 'Failed to update notification settings');
    res.status(500).json({ success: false, error: 'Failed to update notification settings' });
  }
}

/**
 * Send push notification to students
 */
export async function sendNotificationToStudents(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { title, body, targetType, targetIds, data, testMode } = req.body;

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

    // Test mode: send to instructor's own device for testing
    if (testMode === true) {
      studentIds = [userId]; // Send to instructor themselves
      logger.info({ userId }, 'Test mode enabled - sending to instructor');
    } else if (targetType === 'all') {
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
        error: 'No students found for the selected criteria. Use testMode: true to test with your own device.',
      });
    }

    // Get device tokens for these students
    const deviceTokens = await prisma.device_tokens.findMany({
      where: {
        userId: { in: studentIds },
        isActive: true,
      },
      select: { token: true, userId: true, platform: true },
    });

    // Create notification log records for each student
    const notifications = await Promise.all(
      studentIds.map((studentId) =>
        prisma.notification_logs.create({
          data: {
            userId: studentId,
            type: 'INSTRUCTOR_BROADCAST',
            title,
            body,
            data: {
              instructorId: instructor.id,
              instructorName: instructor.displayName,
              ...data,
            },
            status: 'PENDING',
          },
        })
      )
    );

    // Send push notifications via OneSignal
    let pushResult: { success: boolean; id?: string; error?: string } = { success: false };
    if (isOneSignalConfigured() && studentIds.length > 0) {
      pushResult = await sendPushToUsers(studentIds, title, body, {
        instructorId: instructor.id,
        instructorName: instructor.displayName,
        type: 'INSTRUCTOR_BROADCAST',
        ...data,
      });

      // Update notification logs with status
      if (pushResult.success) {
        await prisma.notification_logs.updateMany({
          where: { id: { in: notifications.map(n => n.id) } },
          data: { status: 'SENT', metadata: { oneSignalId: pushResult.id } },
        });
      }

      logger.info({ pushResult, studentCount: studentIds.length }, 'Push notification sent to students');
    }

    res.json({
      success: true,
      data: {
        sentTo: studentIds.length,
        pushTokensFound: deviceTokens.length,
        notificationsCreated: notifications.length,
        pushSent: pushResult.success,
        oneSignalId: pushResult.id,
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

    // Calculate actual student count from bookings
    const instructorClasses = await prisma.classes.findMany({
      where: { instructorId: userId },
      select: { id: true },
    });
    const classIds = instructorClasses.map((c) => c.id);

    let actualStudentCount = instructor.totalStudents || 0;
    if (classIds.length > 0) {
      const bookings = await prisma.bookings.findMany({
        where: {
          classId: { in: classIds },
          status: 'CONFIRMED',
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      actualStudentCount = bookings.length;
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
          totalStudents: actualStudentCount,
          totalClasses: classIds.length || instructor.totalClasses || 0,
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
 * Upgrade instructor tier (creates Stripe checkout session)
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
      include: { users: { select: { email: true } } },
    });

    if (!instructor) {
      return res.status(404).json({ success: false, error: 'Instructor not found' });
    }

    // Tier prices in kuruş (for TRY)
    const prices: Record<string, number> = {
      PRO: 29900,   // 299 TL
      ELITE: 59900, // 599 TL
    };

    const tierNames: Record<string, string> = {
      PRO: 'Profesyonel Plan',
      ELITE: 'Elit Plan',
    };

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (stripeKey && stripeKey !== 'sk_test_demo123') {
      // Create Stripe checkout session
      const stripe = require('stripe')(stripeKey);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: process.env.PAYMENT_CURRENCY?.toLowerCase() || 'try',
              product_data: {
                name: tierNames[targetTier],
                description: `Eğitmen ${tierNames[targetTier]} - Aylık Abonelik`,
              },
              unit_amount: prices[targetTier],
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/instructor/billing'}?tier=${targetTier}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: process.env.PAYMENT_CANCEL_URL || 'http://localhost:3000/instructor/billing',
        customer_email: instructor.users?.email,
        metadata: {
          userId,
          instructorId: instructor.id,
          targetTier,
          type: 'instructor_tier_upgrade',
        },
      });

      logger.info({ sessionId: session.id, targetTier }, 'Stripe checkout session created for tier upgrade');

      return res.json({
        success: true,
        data: {
          currentTier: instructor.tier,
          targetTier,
          price: prices[targetTier] / 100,
          currency: 'TRY',
          checkoutUrl: session.url,
          sessionId: session.id,
          message: 'Ödeme sayfasına yönlendiriliyorsunuz',
        },
      });
    }

    // Demo mode - direct upgrade without payment
    logger.warn('Stripe not configured - upgrading tier directly (demo mode)');

    await prisma.instructor_profiles.update({
      where: { id: instructor.id },
      data: { tier: targetTier as any },
    });

    await prisma.audit_logs.create({
      data: {
        userId,
        action: 'INSTRUCTOR_TIER_UPGRADE',
        entityType: 'instructors',
        entityId: instructor.id,
        metadata: {
          previousTier: instructor.tier,
          newTier: targetTier,
          mode: 'demo',
        },
      },
    });

    res.json({
      success: true,
      data: {
        currentTier: targetTier,
        targetTier,
        price: prices[targetTier] / 100,
        currency: 'TRY',
        message: `${tierNames[targetTier]} kademesine yükseltildiniz! (Demo mod)`,
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
