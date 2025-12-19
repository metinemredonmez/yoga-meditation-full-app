import { logger } from '../utils/logger';
import { AchievementRequirementType, QuestRequirementType } from '@prisma/client';
import * as xpService from './xpService';
import * as streakService from './streakService';
import * as achievementService from './achievementService';
// import * as questService from './questService';
import * as milestoneService from './milestoneService';
import * as referralService from './referralService';
import * as titleService from './titleService';
import * as avatarFrameService from './avatarFrameService';

// ============================================
// Central Gamification Trigger Service
// ============================================

export async function onClassCompleted(
  userId: string,
  classId: string,
  durationMinutes: number,
) {
  logger.info({ userId, classId, durationMinutes }, 'Class completed - triggering gamification');

  const results: Record<string, any> = {};

  // 1. Award XP
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('CLASS_COMPLETE'),
    'CLASS_COMPLETE',
    'Class completed',
  );

  // 2. Update streak
  results.streak = await streakService.updateStreak(userId);

  // 3. Update achievement progress
  results.achievements = await achievementService.updateAchievementProgress(
    userId,
    'CLASSES_COMPLETED',
    1,
  );

  // Also update total minutes
  await achievementService.updateAchievementProgress(
    userId,
    'TOTAL_MINUTES',
    durationMinutes,
  );

  // 4. Update quest progress
  // results.quests = await questService.updateQuestProgress(
  //   userId,
  //   'COMPLETE_CLASSES',
  //   1,
  // );

  // await questService.updateQuestProgress(
  //   userId,
  //   'COMPLETE_MINUTES',
  //   durationMinutes,
  // );

  // 5. Check milestones
  results.milestones = await milestoneService.checkMilestones(userId);

  // 6. Check title/frame unlocks
  results.titles = await titleService.checkTitleUnlocks(userId);
  results.frames = await avatarFrameService.checkFrameUnlocks(userId);

  // 7. Process referral conversion if applicable
  results.referral = await referralService.processReferralConversion(userId);

  return results;
}

export async function onProgramCompleted(userId: string, programId: string) {
  logger.info({ userId, programId }, 'Program completed - triggering gamification');

  const results: Record<string, any> = {};

  // Award XP
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('PROGRAM_COMPLETE'),
    'PROGRAM_COMPLETE',
    'Program completed',
  );

  // Update achievements
  results.achievements = await achievementService.updateAchievementProgress(
    userId,
    'PROGRAMS_COMPLETED',
    1,
  );

  // Check milestones
  results.milestones = await milestoneService.checkMilestones(userId);

  // Check unlocks
  results.titles = await titleService.checkTitleUnlocks(userId);
  results.frames = await avatarFrameService.checkFrameUnlocks(userId);

  return results;
}

export async function onChallengeCompleted(userId: string, challengeId: string) {
  logger.info({ userId, challengeId }, 'Challenge completed - triggering gamification');

  const results: Record<string, any> = {};

  // Award XP
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('CHALLENGE_COMPLETE'),
    'CHALLENGE_COMPLETE',
    'Challenge completed',
  );

  // Update achievements
  results.achievements = await achievementService.updateAchievementProgress(
    userId,
    'CHALLENGES_COMPLETED',
    1,
  );

  // Check milestones
  results.milestones = await milestoneService.checkMilestones(userId);

  return results;
}

export async function onChallengeJoined(userId: string, challengeId: string) {
  logger.info({ userId, challengeId }, 'Challenge joined');

  // Could trigger achievements for "try X challenges"
  return {};
}

export async function onChallengeDayCompleted(
  userId: string,
  challengeId: string,
  day: number,
) {
  logger.info({ userId, challengeId, day }, 'Challenge day completed');

  const results: Record<string, any> = {};

  // Award milestone XP
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('CHALLENGE_MILESTONE'),
    'CHALLENGE_MILESTONE',
    `Challenge day ${day} completed`,
  );

  // Update quest progress
  // results.quests = await questService.updateQuestProgress(
  //   userId,
  //   'COMPLETE_CHALLENGE_DAY',
  //   1,
  // );

  return results;
}

export async function onForumPostCreated(userId: string, postId: string) {
  logger.info({ userId, postId }, 'Forum post created - triggering gamification');

  const results: Record<string, any> = {};

  // Award XP
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('FORUM_POST'),
    'FORUM_POST',
    'Forum post created',
  );

  // Update achievements
  results.achievements = await achievementService.updateAchievementProgress(
    userId,
    'FORUM_POSTS',
    1,
  );

  // Update quest progress
  // results.quests = await questService.updateQuestProgress(
  //   userId,
  //   'POST_IN_FORUM',
  //   1,
  // );

  return results;
}

export async function onForumReplyCreated(userId: string, replyId: string) {
  logger.info({ userId, replyId }, 'Forum reply created');

  const results: Record<string, any> = {};

  // Award XP
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('FORUM_REPLY'),
    'FORUM_REPLY',
    'Forum reply created',
  );

  return results;
}

export async function onHelpfulAnswer(userId: string, postId: string) {
  logger.info({ userId, postId }, 'Answer marked as helpful');

  const results: Record<string, any> = {};

  // Award XP
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('HELPFUL_ANSWER'),
    'HELPFUL_ANSWER',
    'Answer marked as helpful',
  );

  // Update achievements
  results.achievements = await achievementService.updateAchievementProgress(
    userId,
    'HELPFUL_ANSWERS',
    1,
  );

  return results;
}

export async function onLiveSessionAttended(
  userId: string,
  sessionId: string,
  durationMinutes?: number,
) {
  logger.info({ userId, sessionId }, 'Live session attended');

  const results: Record<string, any> = {};

  // Award XP
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('LIVE_SESSION_ATTEND'),
    'LIVE_SESSION_ATTEND',
    'Live session attended',
  );

  // Update streak
  results.streak = await streakService.updateStreak(userId);

  // Update achievements
  results.achievements = await achievementService.updateAchievementProgress(
    userId,
    'LIVE_SESSIONS_ATTENDED',
    1,
  );

  // Update quest progress
  // results.quests = await questService.updateQuestProgress(
  //   userId,
  //   'ATTEND_LIVE_SESSION',
  //   1,
  // );

  return results;
}

export async function onLiveSessionHosted(userId: string, sessionId: string) {
  logger.info({ userId, sessionId }, 'Live session hosted');

  const results: Record<string, any> = {};

  // Award XP
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('LIVE_SESSION_HOST'),
    'LIVE_SESSION_HOST',
    'Live session hosted',
  );

  // Update achievements
  results.achievements = await achievementService.updateAchievementProgress(
    userId,
    'LIVE_SESSIONS_HOSTED',
    1,
  );

  return results;
}

export async function onReviewSubmitted(userId: string, reviewId: string) {
  logger.info({ userId, reviewId }, 'Review submitted');

  const results: Record<string, any> = {};

  // Award XP
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('REVIEW_SUBMIT'),
    'REVIEW_SUBMIT',
    'Review submitted',
  );

  // Update achievements
  results.achievements = await achievementService.updateAchievementProgress(
    userId,
    'REVIEWS_WRITTEN',
    1,
  );

  return results;
}

export async function onUserReferred(referrerId: string, referredId: string) {
  logger.info({ referrerId, referredId }, 'User referred');

  // This is handled by referralService.processReferralConversion
  // Called when referred user completes first action

  return {};
}

export async function onDailyLogin(userId: string) {
  logger.info({ userId }, 'Daily login');

  const results: Record<string, any> = {};

  // Award daily login XP
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('DAILY_LOGIN'),
    'DAILY_LOGIN',
    'Daily login bonus',
  );

  // Update streak (maintains streak even without class)
  // Note: Actual streak update requires completing a class
  // This just logs the login

  return results;
}

export async function onSocialShare(
  userId: string,
  shareType: string,
  targetId?: string,
) {
  logger.info({ userId, shareType, targetId }, 'Social share');

  const results: Record<string, any> = {};

  // Award XP
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('SOCIAL_SHARE'),
    'SOCIAL_SHARE',
    `Shared ${shareType}`,
  );

  // Update quest progress
  // results.quests = await questService.updateQuestProgress(
  //   userId,
  //   'SHARE_PROGRESS',
  //   1,
  // );

  return results;
}

export async function onProfileCompleted(userId: string) {
  logger.info({ userId }, 'Profile completed');

  const results: Record<string, any> = {};

  // Award one-time XP
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('PROFILE_COMPLETE'),
    'PROFILE_COMPLETE',
    'Profile completed',
  );

  return results;
}

export async function onFirstClass(userId: string, classId: string) {
  logger.info({ userId, classId }, 'First class completed');

  const results: Record<string, any> = {};

  // Award first class bonus
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('FIRST_CLASS'),
    'FIRST_CLASS',
    'First class bonus',
  );

  // Process referral conversion
  results.referral = await referralService.processReferralConversion(userId);

  return results;
}

export async function onFirstProgram(userId: string, programId: string) {
  logger.info({ userId, programId }, 'First program completed');

  const results: Record<string, any> = {};

  // Award first program bonus
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('FIRST_PROGRAM'),
    'FIRST_PROGRAM',
    'First program bonus',
  );

  return results;
}

export async function onBadgeEarned(userId: string, badgeId: string) {
  logger.info({ userId, badgeId }, 'Badge earned');

  const results: Record<string, any> = {};

  // Award XP for earning badge
  results.xp = await xpService.addXP(
    userId,
    xpService.getDefaultXPAmount('BADGE_EARN'),
    'BADGE_EARN',
    'Badge earned',
  );

  // Update achievements
  results.achievements = await achievementService.updateAchievementProgress(
    userId,
    'BADGES_EARNED',
    1,
  );

  // Check title unlocks (some titles require badge count)
  results.titles = await titleService.checkTitleUnlocks(userId);

  return results;
}

export async function onInstructorFollowed(userId: string, instructorId: string) {
  logger.info({ userId, instructorId }, 'Instructor followed');

  const results: Record<string, any> = {};

  // Update achievements
  results.achievements = await achievementService.updateAchievementProgress(
    userId,
    'INSTRUCTORS_FOLLOWED',
    1,
  );

  return results;
}

export async function onNewCategoryTried(userId: string, category: string) {
  logger.info({ userId, category }, 'New category tried');

  const results: Record<string, any> = {};

  // Update achievements
  results.achievements = await achievementService.updateAchievementProgress(
    userId,
    'CATEGORIES_TRIED',
    1,
  );

  // Update quest progress
  // results.quests = await questService.updateQuestProgress(
  //   userId,
  //   'TRY_NEW_CATEGORY',
  //   1,
  // );

  return results;
}

// ============================================
// Batch Processing
// ============================================

export async function processAllGamificationForUser(userId: string) {
  logger.info({ userId }, 'Processing all gamification checks');

  const results: Record<string, any> = {};

  // Check all milestones
  results.milestones = await milestoneService.checkMilestones(userId);

  // Check all title unlocks
  results.titles = await titleService.checkTitleUnlocks(userId);

  // Check all frame unlocks
  results.frames = await avatarFrameService.checkFrameUnlocks(userId);

  return results;
}
