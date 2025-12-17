import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import * as liveStreamService from '../services/liveStreamService';
import * as liveStreamScheduleService from '../services/liveStreamScheduleService';

// ============================================
// Stream Reminder Job
// ============================================

export async function sendStreamReminders() {
  logger.info('Starting stream reminders job');

  try {
    // Get streams starting in 1 hour
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    const fiftyFiveMinutesFromNow = new Date(Date.now() + 55 * 60 * 1000);

    const streamsIn1Hour = await prisma.liveStream.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledStartAt: {
          gte: fiftyFiveMinutesFromNow,
          lte: oneHourFromNow,
        },
      },
      include: {
        registrations: {
          where: { reminderSent: false },
          include: {
            user: {
              select: { id: true, email: true, firstName: true },
            },
          },
        },
        instructor: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    let remindersCount = 0;

    for (const stream of streamsIn1Hour) {
      for (const registration of stream.registrations) {
        // TODO: Send actual notification
        // await pushNotificationService.sendPush(registration.userId, {
        //   title: 'Stream Starting Soon',
        //   body: `${stream.title} starts in 1 hour!`,
        // });

        remindersCount++;
      }

      // Mark reminders as sent
      await prisma.liveStreamRegistration.updateMany({
        where: {
          streamId: stream.id,
          reminderSent: false,
        },
        data: { reminderSent: true },
      });
    }

    // Get streams starting in 15 minutes (second reminder)
    const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000);
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);

    const streamsIn15Min = await prisma.liveStream.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledStartAt: {
          gte: tenMinutesFromNow,
          lte: fifteenMinutesFromNow,
        },
      },
      include: {
        registrations: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true },
            },
          },
        },
      },
    });

    for (const stream of streamsIn15Min) {
      for (const registration of stream.registrations) {
        // TODO: Send 15-minute reminder
        remindersCount++;
      }
    }

    logger.info({ remindersCount }, 'Stream reminders job completed');
    return { remindersCount };
  } catch (error) {
    logger.error({ error }, 'Stream reminders job failed');
    throw error;
  }
}

// ============================================
// Recurring Streams Job
// ============================================

export async function processRecurringStreams() {
  logger.info('Starting recurring streams job');

  try {
    const result = await liveStreamScheduleService.processRecurringStreams();
    logger.info(result, 'Recurring streams job completed');
    return result;
  } catch (error) {
    logger.error({ error }, 'Recurring streams job failed');
    throw error;
  }
}

// ============================================
// Cleanup Ended Streams Job
// ============================================

export async function cleanupEndedStreams() {
  logger.info('Starting cleanup ended streams job');

  try {
    // Find streams that should have ended but are still marked as LIVE
    const now = new Date();
    const gracePeriod = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes grace

    const staleStreams = await prisma.liveStream.findMany({
      where: {
        status: 'LIVE',
        scheduledEndAt: { lt: gracePeriod },
      },
    });

    let cleanedCount = 0;

    for (const stream of staleStreams) {
      // Check if there are any active participants
      const activeParticipants = await prisma.liveStreamParticipant.count({
        where: { streamId: stream.id, isActive: true },
      });

      if (activeParticipants === 0) {
        // Mark all participants as left
        await prisma.liveStreamParticipant.updateMany({
          where: { streamId: stream.id, isActive: true },
          data: { isActive: false, leftAt: now },
        });

        // Calculate duration
        const duration = stream.actualStartAt
          ? Math.round((now.getTime() - stream.actualStartAt.getTime()) / 60000)
          : 0;

        // End the stream
        await prisma.liveStream.update({
          where: { id: stream.id },
          data: {
            status: 'ENDED',
            actualEndAt: now,
            recordingDuration: duration,
            currentParticipants: 0,
          },
        });

        cleanedCount++;
        logger.info({ streamId: stream.id }, 'Auto-ended stale stream');
      }
    }

    logger.info({ cleanedCount }, 'Cleanup ended streams job completed');
    return { cleanedCount };
  } catch (error) {
    logger.error({ error }, 'Cleanup ended streams job failed');
    throw error;
  }
}

// ============================================
// Process Recordings Job
// ============================================

export async function processRecordings() {
  logger.info('Starting process recordings job');

  try {
    // Find recordings that are still processing
    const processingRecordings = await prisma.liveStreamRecording.findMany({
      where: { status: 'PROCESSING' },
      include: {
        stream: true,
      },
    });

    let processedCount = 0;

    for (const recording of processingRecordings) {
      // TODO: Check actual recording status from Agora
      // For now, we'll simulate checking after 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      if (recording.createdAt < fiveMinutesAgo) {
        // Mark as ready (in production, verify with Agora API)
        await prisma.liveStreamRecording.update({
          where: { id: recording.id },
          data: {
            status: 'READY',
            processedAt: new Date(),
          },
        });

        processedCount++;
        logger.info({ recordingId: recording.id }, 'Recording marked as ready');
      }
    }

    logger.info({ processedCount }, 'Process recordings job completed');
    return { processedCount };
  } catch (error) {
    logger.error({ error }, 'Process recordings job failed');
    throw error;
  }
}

// ============================================
// Expire Old Recordings Job
// ============================================

export async function expireOldRecordings() {
  logger.info('Starting expire old recordings job');

  try {
    const now = new Date();

    // Find expired recordings
    const expiredRecordings = await prisma.liveStreamRecording.findMany({
      where: {
        expiresAt: { lt: now },
        status: 'READY',
      },
    });

    let expiredCount = 0;

    for (const recording of expiredRecordings) {
      // TODO: Delete from S3
      // await storageService.deleteFile(recording.url);

      // Delete from database
      await prisma.liveStreamRecording.delete({
        where: { id: recording.id },
      });

      // Update stream's recording URL
      await prisma.liveStream.update({
        where: { id: recording.streamId },
        data: { recordingUrl: null },
      });

      expiredCount++;
      logger.info({ recordingId: recording.id }, 'Deleted expired recording');
    }

    logger.info({ expiredCount }, 'Expire old recordings job completed');
    return { expiredCount };
  } catch (error) {
    logger.error({ error }, 'Expire old recordings job failed');
    throw error;
  }
}

// ============================================
// Update Stream Stats Job
// ============================================

export async function updateStreamStats() {
  logger.info('Starting update stream stats job');

  try {
    // Get all live streams
    const liveStreams = await prisma.liveStream.findMany({
      where: { status: 'LIVE' },
    });

    for (const stream of liveStreams) {
      // Count active participants
      const activeCount = await prisma.liveStreamParticipant.count({
        where: { streamId: stream.id, isActive: true },
      });

      // Update if different
      if (stream.currentParticipants !== activeCount) {
        await prisma.liveStream.update({
          where: { id: stream.id },
          data: { currentParticipants: activeCount },
        });
      }
    }

    logger.info({ streamsUpdated: liveStreams.length }, 'Update stream stats job completed');
    return { streamsUpdated: liveStreams.length };
  } catch (error) {
    logger.error({ error }, 'Update stream stats job failed');
    throw error;
  }
}

// ============================================
// Run All Jobs (for manual trigger)
// ============================================

export async function runAllJobs() {
  const results = {
    reminders: await sendStreamReminders().catch((e) => ({ error: e.message })),
    recurring: await processRecurringStreams().catch((e) => ({ error: e.message })),
    cleanup: await cleanupEndedStreams().catch((e) => ({ error: e.message })),
    recordings: await processRecordings().catch((e) => ({ error: e.message })),
    expire: await expireOldRecordings().catch((e) => ({ error: e.message })),
    stats: await updateStreamStats().catch((e) => ({ error: e.message })),
  };

  logger.info({ results }, 'All live stream jobs completed');
  return results;
}
