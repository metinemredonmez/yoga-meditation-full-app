-- CreateEnum
CREATE TYPE "AIProvider" AS ENUM ('OPENAI', 'ANTHROPIC', 'GOOGLE', 'AZURE_OPENAI', 'ELEVEN_LABS', 'DEEPGRAM', 'ASSEMBLY_AI');

-- CreateEnum
CREATE TYPE "AIRequestStatus" AS ENUM ('SUCCESS', 'FAILED', 'RATE_LIMITED', 'TIMEOUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AIServiceType" AS ENUM ('CHAT_COMPLETION', 'RECOMMENDATION', 'CONTENT_GENERATION', 'TEXT_TO_SPEECH', 'SPEECH_TO_TEXT', 'EMBEDDING', 'MODERATION', 'IMAGE_GENERATION', 'TRANSLATION');

-- CreateEnum
CREATE TYPE "AchievementCategory" AS ENUM ('PRACTICE', 'CONSISTENCY', 'EXPLORATION', 'MASTERY', 'SOCIAL', 'SPECIAL', 'ONBOARDING', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "AchievementDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "AchievementRequirementType" AS ENUM ('CLASSES_COMPLETED', 'PROGRAMS_COMPLETED', 'CHALLENGES_COMPLETED', 'TOTAL_MINUTES', 'STREAK_DAYS', 'POSES_LEARNED', 'CATEGORIES_TRIED', 'INSTRUCTORS_FOLLOWED', 'REVIEWS_WRITTEN', 'FORUM_POSTS', 'HELPFUL_ANSWERS', 'FRIENDS_REFERRED', 'LIVE_SESSIONS_ATTENDED', 'LIVE_SESSIONS_HOSTED', 'BADGES_EARNED', 'LEVEL_REACHED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('COMPLETED_CLASS', 'COMPLETED_PROGRAM', 'COMPLETED_CHALLENGE', 'JOINED_CHALLENGE', 'EARNED_BADGE', 'FOLLOWED_USER', 'CREATED_POST', 'LIKED_POST', 'COMMENTED', 'STREAK_MILESTONE', 'LEVEL_UP');

-- CreateEnum
CREATE TYPE "AdminAction" AS ENUM ('USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_BAN', 'USER_UNBAN', 'USER_ROLE_CHANGE', 'USER_PASSWORD_RESET', 'USER_SUBSCRIPTION_CHANGE', 'PROGRAM_CREATE', 'PROGRAM_UPDATE', 'PROGRAM_DELETE', 'PROGRAM_PUBLISH', 'PROGRAM_UNPUBLISH', 'CLASS_CREATE', 'CLASS_UPDATE', 'CLASS_DELETE', 'POSE_CREATE', 'POSE_UPDATE', 'POSE_DELETE', 'CHALLENGE_CREATE', 'CHALLENGE_UPDATE', 'CHALLENGE_DELETE', 'REFUND_PROCESS', 'SUBSCRIPTION_CANCEL', 'SUBSCRIPTION_EXTEND', 'COUPON_CREATE', 'COUPON_UPDATE', 'COUPON_DELETE', 'PAYOUT_PROCESS', 'PAYOUT_APPROVE', 'SETTINGS_UPDATE', 'CACHE_CLEAR', 'MAINTENANCE_MODE_TOGGLE', 'FEATURE_FLAG_UPDATE', 'CONTENT_APPROVE', 'CONTENT_REJECT', 'REPORT_RESOLVE', 'REPORT_DISMISS', 'COMMENT_DELETE', 'FORUM_POST_DELETE', 'USER_WARN', 'EXPORT_DATA', 'IMPORT_DATA', 'BULK_ACTION');

-- CreateEnum
CREATE TYPE "AggregationType" AS ENUM ('SUM', 'AVG', 'MIN', 'MAX', 'COUNT', 'DISTINCT_COUNT');

-- CreateEnum
CREATE TYPE "AlertCondition" AS ENUM ('GREATER_THAN', 'LESS_THAN', 'EQUALS', 'NOT_EQUALS', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL', 'PERCENTAGE_INCREASE', 'PERCENTAGE_DECREASE', 'ANOMALY');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BadgeCategory" AS ENUM ('PRACTICE', 'STREAK', 'SOCIAL', 'ACHIEVEMENT', 'SPECIAL');

-- CreateEnum
CREATE TYPE "BehaviorEventType" AS ENUM ('VIEW', 'CLICK', 'START', 'PAUSE', 'RESUME', 'COMPLETE', 'SKIP', 'SEARCH', 'FILTER', 'FAVORITE', 'UNFAVORITE', 'SHARE', 'RATE', 'REVIEW');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BulkActionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIAL', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "ChatMessageType" AS ENUM ('MESSAGE', 'QUESTION', 'ANNOUNCEMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ClassLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VideoSource" AS ENUM ('UPLOAD', 'YOUTUBE', 'DAILYMOTION', 'VIMEO', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "VideoQuality" AS ENUM ('SD_360P', 'SD_480P', 'HD_720P', 'HD_1080P', 'QHD_1440P', 'UHD_4K');

-- CreateEnum
CREATE TYPE "VideoFormat" AS ENUM ('MP4', 'WEBM', 'MOV', 'AVI', 'MKV');

-- CreateEnum
CREATE TYPE "CommentTargetType" AS ENUM ('PROGRAM', 'CLASS', 'POSE', 'CHALLENGE');

-- CreateEnum
CREATE TYPE "ContentEntityType" AS ENUM ('VIDEO', 'PROGRAM', 'CLASS', 'CHALLENGE', 'POSE', 'ACHIEVEMENT', 'QUEST', 'TITLE', 'BADGE', 'CATEGORY', 'TAG', 'NOTIFICATION_TEMPLATE', 'EMAIL_TEMPLATE', 'FAQ', 'BLOG_POST');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('ARTICLE', 'PAGE', 'BANNER', 'ANNOUNCEMENT', 'FAQ', 'TUTORIAL', 'LANDING_PAGE');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('YOGA_COACH', 'MEDITATION_GUIDE', 'NUTRITION_ADVISOR', 'GENERAL_ASSISTANT', 'CLASS_FEEDBACK');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "DailyBonusType" AS ENUM ('STREAK_FREEZE', 'BADGE', 'TITLE', 'AVATAR_FRAME', 'DISCOUNT');

-- CreateEnum
CREATE TYPE "DateRangeType" AS ENUM ('TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS', 'THIS_MONTH', 'LAST_MONTH', 'THIS_QUARTER', 'LAST_QUARTER', 'THIS_YEAR', 'LAST_YEAR', 'CUSTOM', 'ALL_TIME');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('EMAIL', 'WEBHOOK', 'STORAGE', 'SLACK');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- CreateEnum
CREATE TYPE "EarningSourceType" AS ENUM ('PROGRAM', 'CLASS', 'SUBSCRIPTION', 'TIP');

-- CreateEnum
CREATE TYPE "EarningStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EarningType" AS ENUM ('PROGRAM_VIEW', 'CLASS_BOOKING', 'SUBSCRIPTION_SHARE', 'TIP', 'BONUS');

-- CreateEnum
CREATE TYPE "EpisodeStatus" AS ENUM ('DRAFT', 'PROCESSING', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('CSV', 'EXCEL', 'JSON', 'PDF');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('USERS', 'SUBSCRIPTIONS', 'PAYMENTS', 'PROGRAMS', 'CLASSES', 'ANALYTICS', 'AUDIT_LOGS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FavoriteType" AS ENUM ('PROGRAM', 'POSE', 'CLASS');

-- CreateEnum
CREATE TYPE "FrameUnlockType" AS ENUM ('ACHIEVEMENT', 'LEVEL', 'PURCHASE', 'EVENT', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "GeneratedContentStatus" AS ENUM ('GENERATED', 'APPROVED', 'REJECTED', 'IN_USE');

-- CreateEnum
CREATE TYPE "GeneratedContentType" AS ENUM ('CLASS_DESCRIPTION', 'PROGRAM_DESCRIPTION', 'POSE_INSTRUCTIONS', 'MEDITATION_SCRIPT', 'AFFIRMATION', 'DAILY_TIP', 'EMAIL_CONTENT', 'NOTIFICATION', 'SOCIAL_POST', 'VOICE_OVER', 'SUMMARY');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "HallucinationCheckType" AS ENUM ('FACT_CHECK', 'CONSISTENCY_CHECK', 'SOURCE_GROUNDING', 'SELF_CONSISTENCY', 'RETRIEVAL_AUGMENTED');

-- CreateEnum
CREATE TYPE "HallucinationSeverity" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InstructorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "InstructorTier" AS ENUM ('STARTER', 'PRO', 'ELITE', 'PLATFORM_OWNER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('SUBSCRIPTION', 'ONE_TIME', 'REFUND', 'CREDIT');

-- CreateEnum
CREATE TYPE "LanguageDirection" AS ENUM ('LTR', 'RTL');

-- CreateEnum
CREATE TYPE "LeaderboardPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('PROGRAM_SESSION', 'CLASS');

-- CreateEnum
CREATE TYPE "LiveStreamStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LiveStreamType" AS ENUM ('YOGA_CLASS', 'MEDITATION', 'Q_AND_A', 'WORKSHOP', 'SPECIAL_EVENT');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('SCHEDULED', 'EMERGENCY', 'PARTIAL');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageCategory" AS ENUM ('WELCOME', 'TRIAL', 'SUBSCRIPTION', 'PAYMENT', 'ENGAGEMENT', 'CONTENT', 'CAMPAIGN', 'DIGEST', 'INACTIVITY', 'CHALLENGE');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('EMAIL', 'PUSH', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "MessageLogStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'OPENED', 'CLICKED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MilestoneType" AS ENUM ('FIRST_CLASS', 'FIRST_PROGRAM_COMPLETE', 'FIRST_CHALLENGE_COMPLETE', 'STREAK_7_DAYS', 'STREAK_30_DAYS', 'STREAK_100_DAYS', 'STREAK_365_DAYS', 'TOTAL_HOURS_10', 'TOTAL_HOURS_50', 'TOTAL_HOURS_100', 'TOTAL_HOURS_500', 'CLASSES_10', 'CLASSES_50', 'CLASSES_100', 'CLASSES_500', 'LEVEL_5', 'LEVEL_10', 'LEVEL_25', 'LEVEL_50', 'LEVEL_100', 'ANNIVERSARY_1_YEAR', 'ANNIVERSARY_2_YEAR');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MARKETING', 'CHALLENGE_REMINDER', 'CHALLENGE_UPDATE', 'SESSION_REMINDER', 'WEEKLY_PROGRESS', 'NEW_PROGRAM', 'COMMUNITY', 'PAYMENT', 'SECURITY');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('PHONE_VERIFY', 'LOGIN', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('HOST', 'CO_HOST', 'MODERATOR', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "PaymentEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'APPLE', 'GOOGLE', 'IYZICO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('BANK_TRANSFER', 'PAYPAL', 'STRIPE_CONNECT', 'WISE');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlannerItemType" AS ENUM ('PROGRAM_SESSION', 'CLASS');

-- CreateEnum
CREATE TYPE "PodcastCategory" AS ENUM ('WELLNESS', 'MEDITATION', 'YOGA_INSTRUCTION', 'MINDFULNESS', 'BREATHWORK', 'SLEEP', 'MOTIVATION', 'LIFESTYLE', 'INTERVIEW', 'EDUCATION');

-- CreateEnum
CREATE TYPE "PodcastStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PoseDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ProgramLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProgramAccessType" AS ENUM ('FREE', 'PREMIUM', 'PAID');

-- CreateEnum
CREATE TYPE "QueryType" AS ENUM ('SQL', 'PRISMA', 'AGGREGATION');

-- CreateEnum
CREATE TYPE "QuestRequirementType" AS ENUM ('COMPLETE_CLASSES', 'COMPLETE_MINUTES', 'COMPLETE_PROGRAM_DAY', 'MAINTAIN_STREAK', 'TRY_NEW_CATEGORY', 'ATTEND_LIVE_SESSION', 'POST_IN_FORUM', 'SHARE_PROGRESS', 'INVITE_FRIEND', 'COMPLETE_CHALLENGE_DAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "QuestResetPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'NEVER');

-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'SPECIAL_EVENT', 'SEASONAL');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'HEART', 'CLAP', 'NAMASTE', 'FIRE');

-- CreateEnum
CREATE TYPE "ReceiptValidationStatus" AS ENUM ('PENDING', 'VALID', 'INVALID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RecommendationContext" AS ENUM ('HOME_FEED', 'POST_CLASS', 'SEARCH', 'BROWSE', 'NOTIFICATION', 'EMAIL');

-- CreateEnum
CREATE TYPE "RecommendationFeedback" AS ENUM ('LIKED', 'DISLIKED', 'NOT_INTERESTED', 'ALREADY_DONE', 'TOO_EASY', 'TOO_HARD');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('FOR_YOU', 'CONTINUE_WATCHING', 'BECAUSE_YOU_LIKED', 'TRENDING', 'NEW_RELEASES', 'GOAL_BASED', 'SKILL_BUILDING', 'RECOVERY', 'TIME_BASED', 'MOOD_BASED');

-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'CONVERTED', 'REWARDED', 'EXPIRED', 'INVALID');

-- CreateEnum
CREATE TYPE "RefundInitiator" AS ENUM ('USER', 'ADMIN', 'PROVIDER');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('USERS', 'REVENUE', 'SUBSCRIPTIONS', 'CONTENT', 'ENGAGEMENT', 'INSTRUCTORS', 'MARKETING', 'OPERATIONS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'MISINFORMATION', 'COPYRIGHT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('TOPIC', 'POST', 'COMMENT', 'USER');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('TABLE', 'SUMMARY', 'TIME_SERIES', 'COMPARISON', 'FUNNEL', 'COHORT', 'PIVOT');

-- CreateEnum
CREATE TYPE "RevenueType" AS ENUM ('NEW_SUBSCRIPTION', 'RENEWAL', 'UPGRADE', 'DOWNGRADE', 'ONE_TIME', 'REFUND');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('BADGE', 'TITLE', 'AVATAR_FRAME', 'THEME', 'DISCOUNT', 'FREE_MONTH', 'EXCLUSIVE_CONTENT');

-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ScheduledMessageStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SettingCategory" AS ENUM ('GENERAL', 'APPEARANCE', 'NOTIFICATIONS', 'PAYMENTS', 'SECURITY', 'FEATURES', 'INTEGRATIONS', 'LIMITS', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY');

-- CreateEnum
CREATE TYPE "ShareType" AS ENUM ('PROGRESS', 'ACHIEVEMENT', 'BADGE', 'PROGRAM', 'CLASS', 'CHALLENGE', 'PROFILE');

-- CreateEnum
CREATE TYPE "ShopItemType" AS ENUM ('STREAK_FREEZE', 'AVATAR_FRAME', 'TITLE', 'BADGE', 'DISCOUNT_CODE', 'FREE_CLASS', 'EXCLUSIVE_CONTENT');

-- CreateEnum
CREATE TYPE "SmsMessageType" AS ENUM ('OTP', 'NOTIFICATION', 'REMINDER', 'MARKETING');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "SnapshotPeriod" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SnapshotType" AS ENUM ('REVENUE', 'USERS', 'SUBSCRIPTIONS', 'ENGAGEMENT', 'CONTENT', 'INSTRUCTORS');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('FACEBOOK', 'TWITTER', 'INSTAGRAM', 'WHATSAPP', 'LINKEDIN', 'COPY_LINK');

-- CreateEnum
CREATE TYPE "StreakFreezeSource" AS ENUM ('PURCHASED', 'REWARD', 'SUBSCRIPTION_PERK', 'ADMIN_GRANTED', 'ACHIEVEMENT_REWARD', 'AUTO');

-- CreateEnum
CREATE TYPE "SubscriptionInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'PAUSED', 'GRACE_PERIOD', 'INCOMPLETE', 'CANCELED');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "TagKind" AS ENUM ('LEVEL', 'FOCUS', 'EQUIPMENT');

-- CreateEnum
CREATE TYPE "TitleRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "TitleUnlockType" AS ENUM ('ACHIEVEMENT', 'LEVEL', 'BADGE_COUNT', 'STREAK', 'SPECIAL', 'PURCHASE');

-- CreateEnum
CREATE TYPE "TranscriptionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TranslationJobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TranslationJobType" AS ENUM ('IMPORT', 'EXPORT', 'MACHINE_TRANSLATE', 'SYNC');

-- CreateEnum
CREATE TYPE "TranslationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "VoiceJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'DELIVERED', 'SUCCESS', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "WebhookEvent" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_EXPIRED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED', 'CHALLENGE_CREATED', 'CHALLENGE_STARTED', 'CHALLENGE_COMPLETED', 'CHALLENGE_ENROLLMENT', 'CHALLENGE_CHECKIN', 'PROGRESS_UPDATED', 'PROGRAM_COMPLETED');

-- CreateEnum
CREATE TYPE "WidgetType" AS ENUM ('NUMBER', 'CHART', 'TABLE', 'LIST', 'MAP', 'PROGRESS', 'COMPARISON');

-- CreateEnum
CREATE TYPE "WorkflowEdgeType" AS ENUM ('SEQUENTIAL', 'CONDITIONAL', 'PARALLEL', 'LOOP', 'ERROR_HANDLER');

-- CreateEnum
CREATE TYPE "WorkflowExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'WAITING_HUMAN');

-- CreateEnum
CREATE TYPE "WorkflowNodeType" AS ENUM ('START', 'END', 'LLM_CALL', 'TOOL_CALL', 'CONDITION', 'HUMAN_FEEDBACK', 'RETRIEVAL', 'TRANSFORMATION', 'AGGREGATION', 'PARALLEL', 'SUBGRAPH');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "XPSource" AS ENUM ('CLASS_COMPLETE', 'PROGRAM_COMPLETE', 'CHALLENGE_COMPLETE', 'CHALLENGE_MILESTONE', 'DAILY_LOGIN', 'STREAK_MILESTONE', 'ACHIEVEMENT_UNLOCK', 'BADGE_EARN', 'FORUM_POST', 'FORUM_REPLY', 'HELPFUL_ANSWER', 'REFERRAL', 'PROFILE_COMPLETE', 'FIRST_CLASS', 'FIRST_PROGRAM', 'REVIEW_SUBMIT', 'SOCIAL_SHARE', 'LIVE_SESSION_ATTEND', 'LIVE_SESSION_HOST', 'ADMIN');

-- CreateEnum
CREATE TYPE "XPTransactionType" AS ENUM ('EARN', 'BONUS', 'STREAK_BONUS', 'ACHIEVEMENT_BONUS', 'REFERRAL_BONUS', 'ADMIN_ADJUSTMENT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ChallengeDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ChallengeGoalType" AS ENUM ('DURATION', 'SESSIONS', 'FREE');

-- CreateEnum
CREATE TYPE "ChallengeParticipantStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MeditationDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "BreathworkPattern" AS ENUM ('BOX_BREATHING', 'FOUR_SEVEN_EIGHT', 'RELAXING_BREATH', 'ENERGIZING_BREATH', 'CUSTOM', 'PRANAYAMA_UJJAYI', 'PRANAYAMA_NADI_SHODHANA', 'PRANAYAMA_KAPALABHATI');

-- CreateEnum
CREATE TYPE "BreathworkCategory" AS ENUM ('CALM', 'ENERGY', 'FOCUS', 'SLEEP', 'ANXIETY', 'MORNING', 'EVENING', 'QUICK', 'YOGA');

-- CreateEnum
CREATE TYPE "BreathworkAnimation" AS ENUM ('CIRCLE', 'WAVE', 'LUNGS', 'SQUARE', 'FLOWER', 'PULSE');

-- CreateEnum
CREATE TYPE "MoodLevel" AS ENUM ('GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD');

-- CreateEnum
CREATE TYPE "MoodTagCategory" AS ENUM ('ACTIVITY', 'SOCIAL', 'HEALTH', 'WEATHER', 'OTHER');

-- CreateEnum
CREATE TYPE "SoundscapeCategory" AS ENUM ('RAIN', 'THUNDER', 'OCEAN', 'FOREST', 'BIRDS', 'FIRE', 'WHITE_NOISE', 'PINK_NOISE', 'BROWN_NOISE', 'CAFE', 'CITY', 'WIND', 'WATER', 'TIBETAN_BOWLS', 'MUSIC', 'OTHER');

-- CreateEnum
CREATE TYPE "SleepStoryCategory" AS ENUM ('NATURE', 'FANTASY', 'TRAVEL', 'HISTORY', 'SCIENCE', 'MEDITATION', 'AMBIENT', 'CITY', 'TURKISH');

-- CreateEnum
CREATE TYPE "QuoteCategory" AS ENUM ('MOTIVATION', 'MINDFULNESS', 'HAPPINESS', 'PEACE', 'SELF_LOVE', 'YOGA', 'SUFI', 'GRATITUDE');

-- CreateEnum
CREATE TYPE "JournalType" AS ENUM ('FREE_WRITE', 'GRATITUDE', 'REFLECTION', 'DREAM', 'MOOD', 'PRACTICE_NOTES', 'INTENTION', 'AFFIRMATION', 'MORNING_PAGES', 'EVENING_REVIEW');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('PRACTICE_DAYS', 'PRACTICE_MINUTES', 'MEDITATION_COUNT', 'BREATHWORK_COUNT', 'STREAK', 'MOOD_LOG', 'JOURNAL_ENTRIES', 'SLEEP_TRACKING', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('MORNING', 'EVENING', 'PRACTICE', 'MOOD', 'JOURNAL', 'HYDRATION', 'POSTURE', 'BREAK', 'BEDTIME', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('GUIDED', 'TIMER', 'OPEN');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "_ContentToContentTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "achievement_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "longDescription" TEXT,
    "icon" TEXT NOT NULL,
    "iconLocked" TEXT,
    "color" TEXT,
    "animation" TEXT,
    "category" "AchievementCategory" NOT NULL,
    "difficulty" "AchievementDifficulty" NOT NULL,
    "requirementType" "AchievementRequirementType" NOT NULL,
    "requirementValue" INTEGER NOT NULL,
    "requirementMeta" JSONB,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "badgeId" TEXT,
    "rewardType" "RewardType",
    "rewardValue" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "tierId" TEXT,
    "prerequisiteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "AdminAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "previousData" JSONB,
    "newData" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_dashboard_preferences" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "widgets" JSONB NOT NULL,
    "defaultDateRange" TEXT NOT NULL DEFAULT '7d',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "usersPerPage" INTEGER NOT NULL DEFAULT 25,
    "ordersPerPage" INTEGER NOT NULL DEFAULT 25,
    "emailAlerts" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_dashboard_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notes" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL,
    "statusCode" INTEGER,
    "response" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_configurations" (
    "id" TEXT NOT NULL,
    "provider" "AIProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "apiEndpoint" TEXT,
    "apiVersion" TEXT,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 1000,
    "topP" DOUBLE PRECISION,
    "requestsPerMinute" INTEGER NOT NULL DEFAULT 60,
    "tokensPerMinute" INTEGER NOT NULL DEFAULT 90000,
    "costPerToken" DOUBLE PRECISION,
    "costPer1000Chars" DOUBLE PRECISION,
    "costPerMinute" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL,
    "contextType" TEXT,
    "contextId" TEXT,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generated_contents" (
    "id" TEXT NOT NULL,
    "type" "GeneratedContentType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "parameters" JSONB,
    "content" TEXT NOT NULL,
    "audioUrl" TEXT,
    "audioFormat" TEXT,
    "audioDuration" DOUBLE PRECISION,
    "provider" "AIProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "tokens" INTEGER,
    "cost" DOUBLE PRECISION,
    "status" "GeneratedContentStatus" NOT NULL,
    "isReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedById" TEXT,
    "isApproved" BOOLEAN,
    "usedInEntityType" TEXT,
    "usedInEntityId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generated_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "audioUrl" TEXT,
    "audioDuration" DOUBLE PRECISION,
    "tokens" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_performances" (
    "id" TEXT NOT NULL,
    "provider" "AIProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "service" "AIServiceType" NOT NULL,
    "date" DATE NOT NULL,
    "totalRequests" INTEGER NOT NULL,
    "successfulRequests" INTEGER NOT NULL,
    "failedRequests" INTEGER NOT NULL,
    "avgLatencyMs" DOUBLE PRECISION NOT NULL,
    "p50LatencyMs" DOUBLE PRECISION,
    "p95LatencyMs" DOUBLE PRECISION,
    "p99LatencyMs" DOUBLE PRECISION,
    "totalTokens" INTEGER,
    "totalCost" DOUBLE PRECISION,
    "clickThroughRate" DOUBLE PRECISION,
    "conversionRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_model_performances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_response_validations" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "responseType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "checks" JSONB NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "safetyScore" DOUBLE PRECISION NOT NULL,
    "factualityScore" DOUBLE PRECISION,
    "hasHallucination" BOOLEAN NOT NULL DEFAULT false,
    "hasUnsafeContent" BOOLEAN NOT NULL DEFAULT false,
    "hasOffTopic" BOOLEAN NOT NULL DEFAULT false,
    "hasPII" BOOLEAN NOT NULL DEFAULT false,
    "wasBlocked" BOOLEAN NOT NULL DEFAULT false,
    "wasModified" BOOLEAN NOT NULL DEFAULT false,
    "modifiedContent" TEXT,
    "validatorModel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_response_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "provider" "AIProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "service" "AIServiceType" NOT NULL,
    "requestId" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "audioDuration" DOUBLE PRECISION,
    "audioCharacters" INTEGER,
    "estimatedCost" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "status" "AIRequestStatus" NOT NULL,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_workflow_edges" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "type" "WorkflowEdgeType" NOT NULL,
    "label" TEXT,
    "condition" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "dataMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_workflow_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_workflow_executions" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "triggeredBy" TEXT,
    "triggerType" TEXT,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "status" "WorkflowExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "currentNodeId" TEXT,
    "state" JSONB NOT NULL,
    "checkpoints" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "error" TEXT,
    "errorNodeId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_workflow_node_executions" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "status" "WorkflowExecutionStatus" NOT NULL,
    "error" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_workflow_node_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_workflow_nodes" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "nodeKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "WorkflowNodeType" NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "inputSchema" JSONB,
    "outputSchema" JSONB,
    "promptTemplate" TEXT,
    "model" TEXT,
    "toolName" TEXT,
    "toolParams" JSONB,
    "conditionLogic" JSONB,
    "vectorStoreId" TEXT,
    "retrievalConfig" JSONB,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "retryDelay" INTEGER NOT NULL DEFAULT 1000,
    "timeout" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_workflow_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "entryNodeId" TEXT,
    "config" JSONB,
    "variables" JSONB,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metricType" TEXT NOT NULL,
    "metricQuery" JSONB,
    "condition" "AlertCondition" NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "compareValue" DOUBLE PRECISION,
    "timeWindow" INTEGER NOT NULL,
    "aggregation" "AggregationType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "channels" TEXT[],
    "recipients" TEXT[],
    "webhookUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "mutedUntil" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "lastTriggeredAt" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'TRIGGERED',
    "notifiedAt" TIMESTAMP(3),
    "notificationStatus" JSONB,
    "acknowledgedById" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "totalSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "activeSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "newSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "cancelledSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "trialSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "mrr" DECIMAL(12,2) NOT NULL,
    "arr" DECIMAL(12,2) NOT NULL,
    "totalRevenue" DECIMAL(12,2) NOT NULL,
    "newRevenue" DECIMAL(12,2) NOT NULL,
    "refundedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "churnRate" DECIMAL(5,4) NOT NULL,
    "churnedSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "churnedMrr" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "trialConversionRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "freeToBasicRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "basicToPremiumRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "avgLtv" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "avgSubscriptionLength" INTEGER NOT NULL DEFAULT 0,
    "revenueByProvider" JSONB,
    "subscriptionsByTier" JSONB,
    "subscriptionsByProvider" JSONB,
    "dailyActiveUsers" INTEGER NOT NULL DEFAULT 0,
    "weeklyActiveUsers" INTEGER NOT NULL DEFAULT 0,
    "monthlyActiveUsers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "position" TEXT NOT NULL DEFAULT 'top',
    "dismissible" BOOLEAN NOT NULL DEFAULT true,
    "targetUrl" TEXT,
    "targetAudience" JSONB,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "rateLimit" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "actorRole" "UserRole",
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avatar_frames" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "unlockType" "FrameUnlockType" NOT NULL,
    "unlockValue" TEXT,
    "rarity" "TitleRarity" NOT NULL,
    "isAnimated" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avatar_frames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT,
    "category" "BadgeCategory" NOT NULL,
    "requirement" JSONB NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "mobileImageUrl" TEXT,
    "linkUrl" TEXT,
    "linkTarget" TEXT NOT NULL DEFAULT '_self',
    "buttonText" TEXT,
    "buttonStyle" TEXT,
    "position" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "targetAudience" JSONB,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_ips" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "blockedBy" TEXT,
    "blockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocked_ips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_action_jobs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityIds" TEXT[],
    "parameters" JSONB,
    "status" "BulkActionStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulk_action_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "difficulty" "ChallengeDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "categories" TEXT[],
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "targetDays" INTEGER NOT NULL,
    "dailyGoalMinutes" INTEGER NOT NULL DEFAULT 15,
    "dailyGoalType" "ChallengeGoalType" NOT NULL DEFAULT 'DURATION',
    "xpReward" INTEGER NOT NULL DEFAULT 100,
    "badgeId" TEXT,
    "maxParticipants" INTEGER,
    "showLeaderboard" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "coverUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "schedule" TIMESTAMP(3) NOT NULL,
    "instructorId" TEXT NOT NULL,
    "coInstructorIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" TEXT,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "enrollments" INTEGER NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "level" "ClassLevel" NOT NULL DEFAULT 'BEGINNER',
    "previewUrl" TEXT,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ClassStatus" NOT NULL DEFAULT 'DRAFT',
    "thumbnailUrl" TEXT,
    "totalRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "videoUrl" TEXT,
    "videoSource" "VideoSource",
    "videoQuality" "VideoQuality",
    "videoFormat" "VideoFormat",
    "videoId" TEXT,
    "videoDuration" INTEGER,
    "videoFileSize" BIGINT,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetType" "CommentTargetType" NOT NULL,
    "programId" TEXT,
    "classId" TEXT,
    "poseId" TEXT,
    "challengeId" TEXT,
    "parentId" TEXT,
    "rating" INTEGER,
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "hiddenReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT NOT NULL,
    "targetAudience" JSONB,
    "channel" "MessageChannel" NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "openedCount" INTEGER NOT NULL DEFAULT 0,
    "clickedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_embeddings" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "textHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "targetType" "ReportTargetType" NOT NULL,
    "topicId" TEXT,
    "postId" TEXT,
    "commentId" TEXT,
    "userId" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "type" "ContentType" NOT NULL,
    "schema" JSONB NOT NULL,
    "defaultBody" JSONB,
    "previewImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_translations" (
    "id" TEXT NOT NULL,
    "entityType" "ContentEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "status" "TranslationStatus" NOT NULL DEFAULT 'DRAFT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isMachineTranslated" BOOLEAN NOT NULL DEFAULT false,
    "originalLanguageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyJson" JSONB,
    "changeNote" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "bodyJson" JSONB,
    "type" "ContentType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT[],
    "canonicalUrl" TEXT,
    "featuredImageId" TEXT,
    "ogImageUrl" TEXT,
    "categoryId" TEXT,
    "template" TEXT,
    "layout" TEXT,
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "currentVersionId" TEXT,
    "authorId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "requiredTier" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "participant1Id" TEXT NOT NULL,
    "participant2Id" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessage" TEXT,
    "unreadCount1" INTEGER NOT NULL DEFAULT 0,
    "unreadCount2" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_usages" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "maxUses" INTEGER,
    "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "minPurchaseAmount" DOUBLE PRECISION,
    "applicablePlans" TEXT[],
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_queries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "queryType" "QueryType" NOT NULL,
    "query" TEXT NOT NULL,
    "parameters" JSONB,
    "outputColumns" JSONB,
    "isValidated" BOOLEAN NOT NULL DEFAULT false,
    "lastValidatedAt" TIMESTAMP(3),
    "isSafe" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_checks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT,
    "programSessionId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "summary" TEXT NOT NULL,
    "achievements" TEXT[],
    "suggestions" TEXT[],
    "affirmation" TEXT,
    "tip" TEXT,
    "metricsSnapshot" JSONB NOT NULL,
    "audioUrl" TEXT,
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_rewards" (
    "id" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "bonusType" "DailyBonusType",
    "bonusValue" TEXT,
    "isSpecial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_widgets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "WidgetType" NOT NULL,
    "dataSource" TEXT NOT NULL,
    "query" JSONB,
    "chartType" TEXT,
    "chartConfig" JSONB,
    "refreshInterval" INTEGER,
    "defaultWidth" INTEGER NOT NULL DEFAULT 4,
    "defaultHeight" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "deviceName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_messages" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elevenlabs_jobs" (
    "id" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "modelId" TEXT NOT NULL DEFAULT 'eleven_multilingual_v2',
    "stability" DOUBLE PRECISION NOT NULL,
    "similarityBoost" DOUBLE PRECISION NOT NULL,
    "style" DOUBLE PRECISION,
    "useSpeakerBoost" BOOLEAN NOT NULL,
    "audioUrl" TEXT,
    "audioFormat" TEXT DEFAULT 'mp3',
    "duration" DOUBLE PRECISION,
    "fileSize" INTEGER,
    "status" "VoiceJobStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "characters" INTEGER NOT NULL,
    "estimatedCost" DOUBLE PRECISION,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elevenlabs_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elevenlabs_voices" (
    "id" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "labels" JSONB,
    "previewUrl" TEXT,
    "stability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "similarityBoost" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "style" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "useSpeakerBoost" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "yogaCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elevenlabs_voices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "type" "ExportType" NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "filters" JSONB,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "rowCount" INTEGER,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "categoryId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "helpfulYes" INTEGER NOT NULL DEFAULT 0,
    "helpfulNo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemType" "FavoriteType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
    "allowedUserIds" TEXT[],
    "allowedRoles" TEXT[],
    "environments" TEXT[] DEFAULT ARRAY['production']::TEXT[],
    "metadata" JSONB,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_post_likes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_posts" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_topic_followers" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_topic_followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_topic_tags" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "forum_topic_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_topics" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "lastReplyAt" TIMESTAMP(3),
    "lastReplyById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamification_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gamification_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glossary" (
    "id" TEXT NOT NULL,
    "sourceLanguageId" TEXT NOT NULL,
    "targetLanguageId" TEXT NOT NULL,
    "sourceTerm" TEXT NOT NULL,
    "targetTerm" TEXT NOT NULL,
    "definition" TEXT,
    "notes" TEXT,
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "glossary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grounding_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "metadata" JSONB,
    "embedding" JSONB,
    "embeddingModel" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grounding_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_post_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_post_likes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_posts" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT[],
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hallucination_checks" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sourceEntityType" TEXT,
    "sourceEntityId" TEXT,
    "checkType" "HallucinationCheckType" NOT NULL,
    "severity" "HallucinationSeverity" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "findings" JSONB NOT NULL,
    "groundingDocuments" JSONB,
    "factCheckResults" JSONB,
    "originalPrompt" TEXT,
    "originalContext" JSONB,
    "checkedByModel" TEXT NOT NULL,
    "wasFiltered" BOOLEAN NOT NULL DEFAULT false,
    "wasCorrected" BOOLEAN NOT NULL DEFAULT false,
    "correctedContent" TEXT,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "humanVerdict" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hallucination_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_analytics" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViewers" INTEGER NOT NULL DEFAULT 0,
    "completions" INTEGER NOT NULL DEFAULT 0,
    "avgWatchTime" INTEGER NOT NULL DEFAULT 0,
    "newFollowers" INTEGER NOT NULL DEFAULT 0,
    "totalFollowers" INTEGER NOT NULL DEFAULT 0,
    "earnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "programViews" JSONB,
    "classBookings" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "newReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instructor_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_earnings" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "type" "EarningType" NOT NULL,
    "sourceType" "EarningSourceType" NOT NULL,
    "sourceId" TEXT,
    "studentId" TEXT,
    "grossAmount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "description" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "status" "EarningStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "payoutId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instructor_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_followers" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "followedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "instructor_followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_payout_settings" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "preferredMethod" "PayoutMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "bankDetails" JSONB,
    "paypalEmail" TEXT,
    "stripeConnectId" TEXT,
    "stripeConnectOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "wiseRecipientId" TEXT,
    "taxId" TEXT,
    "taxCountry" TEXT,
    "autoPayoutEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoPayoutDay" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_payout_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_payouts" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "method" "PayoutMethod" NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "bankDetails" JSONB,
    "paypalEmail" TEXT,
    "stripeConnectId" TEXT,
    "wiseRecipientId" TEXT,
    "transactionId" TEXT,
    "taxWithheld" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "shortBio" VARCHAR(160),
    "profileImageUrl" TEXT,
    "coverImageUrl" TEXT,
    "introVideoUrl" TEXT,
    "specializations" TEXT[],
    "certifications" JSONB,
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 0,
    "languages" TEXT[],
    "socialLinks" JSONB,
    "location" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "status" "InstructorStatus" NOT NULL DEFAULT 'PENDING',
    "tier" "InstructorTier" NOT NULL DEFAULT 'STARTER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "totalStudents" INTEGER NOT NULL DEFAULT 0,
    "totalClasses" INTEGER NOT NULL DEFAULT 0,
    "totalPrograms" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "commissionRate" DECIMAL(3,2) NOT NULL DEFAULT 0.30,
    "customPayoutRate" DECIMAL(3,2),
    "minimumPayout" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "verificationDocs" JSONB,
    "rejectionReason" TEXT,
    "suspensionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_reviews" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "programId" TEXT,
    "classId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "instructorReply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "paymentId" TEXT,
    "stripeInvoiceId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceType" "InvoiceType" NOT NULL DEFAULT 'SUBSCRIPTION',
    "invoicePdf" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "amountDue" DECIMAL(10,2) NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "billingName" TEXT,
    "billingEmail" TEXT,
    "billingAddress" TEXT,
    "billingCity" TEXT,
    "billingCountry" TEXT,
    "billingZip" TEXT,
    "taxId" TEXT,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT NOT NULL,
    "direction" "LanguageDirection" NOT NULL DEFAULT 'LTR',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "flagEmoji" TEXT,
    "flagUrl" TEXT,
    "fallbackId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" "LeaderboardPeriod" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalClasses" INTEGER NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "previousRank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_stream_chats" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "ChatMessageType" NOT NULL DEFAULT 'MESSAGE',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedBy" TEXT,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_stream_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_stream_participants" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'PARTICIPANT',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "watchDuration" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "agoraUid" INTEGER NOT NULL,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "isVideoOff" BOOLEAN NOT NULL DEFAULT false,
    "handRaised" BOOLEAN NOT NULL DEFAULT false,
    "handRaisedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_stream_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_stream_reactions" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_stream_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_stream_recordings" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "size" BIGINT NOT NULL,
    "format" TEXT NOT NULL,
    "status" "RecordingStatus" NOT NULL DEFAULT 'PROCESSING',
    "processedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_stream_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_stream_registrations" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_stream_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_stream_schedules" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "LiveStreamType" NOT NULL,
    "recurrenceRule" TEXT NOT NULL,
    "dayOfWeek" INTEGER[],
    "startTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "nextStreamAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_stream_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_streams" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "instructorId" TEXT NOT NULL,
    "coHostIds" TEXT[],
    "type" "LiveStreamType" NOT NULL,
    "status" "LiveStreamStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledStartAt" TIMESTAMP(3) NOT NULL,
    "scheduledEndAt" TIMESTAMP(3) NOT NULL,
    "actualStartAt" TIMESTAMP(3),
    "actualEndAt" TIMESTAMP(3),
    "maxParticipants" INTEGER NOT NULL DEFAULT 100,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "isRecorded" BOOLEAN NOT NULL DEFAULT true,
    "recordingUrl" TEXT,
    "recordingDuration" INTEGER,
    "requiresSubscription" BOOLEAN NOT NULL DEFAULT true,
    "minimumTier" "SubscriptionTier",
    "price" DECIMAL(10,2),
    "tags" TEXT[],
    "level" "ProgramLevel" NOT NULL DEFAULT 'BEGINNER',
    "equipment" TEXT[],
    "agoraChannelName" TEXT NOT NULL,
    "agoraResourceId" TEXT,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "handRaiseEnabled" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_windows" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "affectedServices" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_files" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "type" "MediaType" NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'PROCESSING',
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "folderId" TEXT,
    "tags" TEXT[],
    "alt" TEXT,
    "caption" TEXT,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_usages" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_variants" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "variantType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "size" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "channel" "MessageChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "MessageLogStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subject" TEXT,
    "bodyHtml" TEXT,
    "bodyText" TEXT,
    "bodyPush" TEXT,
    "bodySms" TEXT,
    "channel" "MessageChannel" NOT NULL,
    "category" "MessageCategory" NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MilestoneType" NOT NULL,
    "value" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "celebratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_items" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT,
    "target" TEXT NOT NULL DEFAULT '_self',
    "icon" TEXT,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "visibleTo" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navigation_menus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navigation_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "marketingSms" BOOLEAN NOT NULL DEFAULT false,
    "challengeReminders" BOOLEAN NOT NULL DEFAULT true,
    "challengeUpdates" BOOLEAN NOT NULL DEFAULT true,
    "sessionReminders" BOOLEAN NOT NULL DEFAULT true,
    "weeklyProgress" BOOLEAN NOT NULL DEFAULT true,
    "newProgramAlerts" BOOLEAN NOT NULL DEFAULT true,
    "communityUpdates" BOOLEAN NOT NULL DEFAULT false,
    "paymentAlerts" BOOLEAN NOT NULL DEFAULT true,
    "securityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_contents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offline_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_downloads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "filePath" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offline_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "bookingId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "receiptData" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeInvoiceId" TEXT,
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "receiptUrl" TEXT,
    "invoiceUrl" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "refundedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "environment" "PaymentEnvironment" NOT NULL DEFAULT 'PRODUCTION',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planner_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" "PlannerItemType" NOT NULL,
    "programSessionId" TEXT,
    "classId" TEXT,
    "plannedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planner_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podcast_episodes" (
    "id" TEXT NOT NULL,
    "podcastId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" VARCHAR(500),
    "seasonNumber" INTEGER,
    "episodeNumber" INTEGER NOT NULL,
    "audioUrl" TEXT,
    "audioFormat" TEXT NOT NULL DEFAULT 'mp3',
    "audioSize" INTEGER,
    "duration" INTEGER,
    "transcript" TEXT,
    "hasTranscript" BOOLEAN NOT NULL DEFAULT false,
    "chapters" JSONB,
    "coverImage" TEXT,
    "guestName" TEXT,
    "guestBio" TEXT,
    "guestAvatar" TEXT,
    "guestUrl" TEXT,
    "showNotes" TEXT,
    "links" JSONB,
    "status" "EpisodeStatus" NOT NULL DEFAULT 'DRAFT',
    "isExplicit" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "listenCount" INTEGER NOT NULL DEFAULT 0,
    "completionCount" INTEGER NOT NULL DEFAULT 0,
    "avgListenDuration" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "podcast_episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podcast_likes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "podcast_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podcast_listens" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "episodeId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPlayedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "podcast_listens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podcast_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "podcastId" TEXT NOT NULL,
    "notifyNewEpisodes" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "podcast_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podcasts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" VARCHAR(500),
    "coverImage" TEXT,
    "bannerImage" TEXT,
    "category" "PodcastCategory" NOT NULL DEFAULT 'WELLNESS',
    "hostId" TEXT,
    "hostName" TEXT,
    "hostBio" TEXT,
    "hostAvatar" TEXT,
    "status" "PodcastStatus" NOT NULL DEFAULT 'DRAFT',
    "isExplicit" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'tr',
    "rssEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rssFeedUrl" TEXT,
    "itunesId" TEXT,
    "spotifyUrl" TEXT,
    "googleUrl" TEXT,
    "websiteUrl" TEXT,
    "twitterUrl" TEXT,
    "instagramUrl" TEXT,
    "totalEpisodes" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "totalListens" INTEGER NOT NULL DEFAULT 0,
    "subscriberCount" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "podcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poses" (
    "id" TEXT NOT NULL,
    "sanskritName" TEXT,
    "englishName" TEXT NOT NULL,
    "difficulty" "PoseDifficulty" NOT NULL,
    "bodyArea" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_sessions" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "videoUrl" TEXT,
    "poseIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" "ProgramLevel" NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "coverUrl" TEXT,
    "thumbnailUrl" TEXT,
    "instructorId" TEXT,
    "coInstructorIds" TEXT[],
    "revenueShare" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "durationWeeks" INTEGER,
    "status" "ProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "accessType" "ProgramAccessType" NOT NULL DEFAULT 'FREE',
    "price" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'TRY',
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "promoVideoUrl" TEXT,
    "promoVideoSource" "VideoSource",
    "promoVideoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_receipts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "receiptData" TEXT NOT NULL,
    "validationStatus" "ReceiptValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validationResponse" JSONB,
    "productId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "expiresDate" TIMESTAMP(3),
    "isTrialPeriod" BOOLEAN NOT NULL DEFAULT false,
    "isSandbox" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT,
    "type" "QuestType" NOT NULL,
    "resetPeriod" "QuestResetPeriod" NOT NULL,
    "requirementType" "QuestRequirementType" NOT NULL,
    "requirementValue" INTEGER NOT NULL,
    "requirementMeta" JSONB,
    "xpReward" INTEGER NOT NULL,
    "bonusReward" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_logs" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RecommendationType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "reasons" TEXT[],
    "context" "RecommendationContext" NOT NULL,
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3),
    "isClicked" BOOLEAN NOT NULL DEFAULT false,
    "clickedAt" TIMESTAMP(3),
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "feedback" "RecommendationFeedback",
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUsage" INTEGER,
    "bonusXP" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "referrerRewardGiven" BOOLEAN NOT NULL DEFAULT false,
    "referredRewardGiven" BOOLEAN NOT NULL DEFAULT false,
    "referrerXP" INTEGER,
    "referredXP" INTEGER,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "replacedByToken" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerRefundId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "initiatedBy" "RefundInitiator" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" "ReportCategory" NOT NULL,
    "type" "ReportType" NOT NULL,
    "dataSource" TEXT NOT NULL,
    "baseQuery" JSONB,
    "availableFilters" JSONB NOT NULL,
    "availableColumns" JSONB NOT NULL,
    "defaultFilters" JSONB,
    "defaultColumns" TEXT[],
    "defaultSortBy" TEXT,
    "defaultSortOrder" TEXT,
    "chartTypes" TEXT[],
    "defaultChartType" TEXT,
    "requiredRole" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "allowScheduling" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_exports" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT,
    "reportType" TEXT,
    "filters" JSONB,
    "format" "ExportFormat" NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileUrl" TEXT,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalRows" INTEGER,
    "processedRows" INTEGER,
    "error" TEXT,
    "metadata" JSONB,
    "requestedById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "downloadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_instances" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "name" TEXT,
    "filters" JSONB NOT NULL,
    "columns" TEXT[],
    "sortBy" TEXT,
    "sortOrder" TEXT,
    "groupBy" TEXT[],
    "dateRangeType" "DateRangeType" NOT NULL,
    "dateFrom" TIMESTAMP(3),
    "dateTo" TIMESTAMP(3),
    "chartType" TEXT,
    "chartConfig" JSONB,
    "cachedData" JSONB,
    "cachedAt" TIMESTAMP(3),
    "cacheExpiresAt" TIMESTAMP(3),
    "rowCount" INTEGER,
    "executionTime" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "ScheduleFrequency" NOT NULL,
    "cronExpression" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "hour" INTEGER,
    "minute" INTEGER,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "filters" JSONB NOT NULL,
    "columns" TEXT[],
    "dateRangeType" "DateRangeType" NOT NULL,
    "exportFormat" "ExportFormat" NOT NULL,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "recipients" TEXT[],
    "webhookUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "nextRunAt" TIMESTAMP(3),
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "subscriptionId" TEXT,
    "paymentId" TEXT,
    "invoiceId" TEXT,
    "type" "RevenueType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "provider" "PaymentProvider",
    "planId" TEXT,
    "tier" "SubscriptionTier",
    "interval" "SubscriptionInterval",
    "mrr" DECIMAL(10,2) NOT NULL,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_helpfuls" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_helpfuls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_reports" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_reports" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "columns" TEXT[],
    "sortBy" TEXT,
    "sortOrder" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_executions" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "rowCount" INTEGER,
    "deliveredTo" TEXT[],
    "deliveryStatus" JSONB,
    "executionTime" INTEGER,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_messages" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "ScheduledMessageStatus" NOT NULL DEFAULT 'PENDING',
    "channel" "MessageChannel" NOT NULL,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasonal_event_participants" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "tier" TEXT,
    "completedTasks" JSONB,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasonal_event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasonal_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bannerImage" TEXT,
    "themeColor" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rewards" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasonal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "type" "ShopItemType" NOT NULL,
    "value" TEXT NOT NULL,
    "priceXP" INTEGER NOT NULL,
    "priceCoins" INTEGER,
    "stock" INTEGER,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "availableUntil" TIMESTAMP(3),
    "minLevel" INTEGER,
    "requiredBadgeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_purchases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "pricePaid" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XP',
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" "SmsMessageType" NOT NULL,
    "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
    "twilioSid" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_shares" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "shareType" "ShareType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "shareUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streak_freezes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "StreakFreezeSource" NOT NULL,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "streak_freezes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" "SubscriptionTier" NOT NULL,
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "priceYearly" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "features" JSONB NOT NULL,
    "stripePriceIdMonthly" TEXT,
    "stripePriceIdYearly" TEXT,
    "appleProductIdMonthly" TEXT,
    "appleProductIdYearly" TEXT,
    "googleProductIdMonthly" TEXT,
    "googleProductIdYearly" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "maxDevices" INTEGER NOT NULL DEFAULT 1,
    "offlineDownloads" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "interval" "SubscriptionInterval" NOT NULL DEFAULT 'MONTHLY',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "appleOriginalTransactionId" TEXT,
    "appleLatestReceiptData" TEXT,
    "googlePurchaseToken" TEXT,
    "googleOrderId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "gracePeriodEnd" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_changes" (
    "id" TEXT NOT NULL,
    "version" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "data" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientActionId" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "type" "SettingType" NOT NULL,
    "category" "SettingCategory" NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "kind" "TagKind" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "rate" DECIMAL(5,4) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "unlockType" "TitleUnlockType" NOT NULL,
    "unlockValue" TEXT,
    "rarity" "TitleRarity" NOT NULL,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcription_jobs" (
    "id" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "audioFormat" TEXT,
    "duration" DOUBLE PRECISION,
    "languageCode" TEXT,
    "provider" "AIProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "transcription" TEXT,
    "segments" JSONB,
    "words" JSONB,
    "detectedLanguage" TEXT,
    "status" "TranscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "estimatedCost" DOUBLE PRECISION,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcription_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_jobs" (
    "id" TEXT NOT NULL,
    "type" "TranslationJobType" NOT NULL,
    "sourceLanguageId" TEXT NOT NULL,
    "targetLanguageId" TEXT NOT NULL,
    "status" "TranslationJobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "completedItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "namespace" TEXT NOT NULL DEFAULT 'common',
    "description" TEXT,
    "context" TEXT,
    "maxLength" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translation_memory" (
    "id" TEXT NOT NULL,
    "sourceLanguageId" TEXT NOT NULL,
    "targetLanguageId" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "targetText" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "namespace" TEXT,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "translations" (
    "id" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "pluralOne" TEXT,
    "pluralOther" TEXT,
    "pluralZero" TEXT,
    "pluralFew" TEXT,
    "pluralMany" TEXT,
    "status" "TranslationStatus" NOT NULL DEFAULT 'DRAFT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "isMachineTranslated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unsubscribe_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "notificationType" "NotificationType",
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unsubscribe_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "targetValue" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "currentTier" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "metadata" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_ai_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enableRecommendations" BOOLEAN NOT NULL DEFAULT true,
    "recommendationDiversity" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "preferredVoice" TEXT,
    "voiceSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "enableAICoach" BOOLEAN NOT NULL DEFAULT true,
    "coachPersonality" TEXT,
    "allowDataForTraining" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_ai_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_avatar_frames" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "frameId" TEXT NOT NULL,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_avatar_frames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isNew" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_bans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "duration" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "unbannedById" TEXT,
    "unbannedAt" TIMESTAMP(3),
    "unbanReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_behaviors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "BehaviorEventType" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "sessionId" TEXT,
    "source" TEXT,
    "duration" INTEGER,
    "progress" DOUBLE PRECISION,
    "completed" BOOLEAN,
    "searchQuery" TEXT,
    "searchResults" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_behaviors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_daily_rewards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentDay" INTEGER NOT NULL DEFAULT 1,
    "lastClaimAt" TIMESTAMP(3),
    "cycleStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_daily_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_dashboard_widgets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "positionX" INTEGER NOT NULL,
    "positionY" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "customConfig" JSONB,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_embeddings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "basedOnClasses" INTEGER NOT NULL,
    "basedOnBehaviors" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_engagement_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastActiveAt" TIMESTAMP(3),
    "lastSessionAt" TIMESTAMP(3),
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalPracticeMinutes" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastEmailOpenedAt" TIMESTAMP(3),
    "lastPushClickedAt" TIMESTAMP(3),
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_engagement_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_language_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredLanguageId" TEXT NOT NULL,
    "secondaryLanguageId" TEXT,
    "autoDetect" BOOLEAN NOT NULL DEFAULT true,
    "detectedLocale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_language_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_levels" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentXP" INTEGER NOT NULL DEFAULT 0,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "levelUpAt" TIMESTAMP(3),
    "previousLevel" INTEGER,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3),
    "streakFreezeCount" INTEGER NOT NULL DEFAULT 0,
    "streakFreezeUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_message_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "welcomeEmail" BOOLEAN NOT NULL DEFAULT true,
    "onboardingSequence" BOOLEAN NOT NULL DEFAULT true,
    "trialReminders" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionAlerts" BOOLEAN NOT NULL DEFAULT true,
    "renewalReminders" BOOLEAN NOT NULL DEFAULT true,
    "paymentAlerts" BOOLEAN NOT NULL DEFAULT true,
    "paymentReceipts" BOOLEAN NOT NULL DEFAULT true,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "monthlyDigest" BOOLEAN NOT NULL DEFAULT true,
    "inactivityReminders" BOOLEAN NOT NULL DEFAULT true,
    "challengeReminders" BOOLEAN NOT NULL DEFAULT true,
    "newContentAlerts" BOOLEAN NOT NULL DEFAULT true,
    "promotionalMessages" BOOLEAN NOT NULL DEFAULT false,
    "preferredChannel" "MessageChannel" NOT NULL DEFAULT 'EMAIL',
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_message_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'class',
    "content" TEXT NOT NULL,
    "timestamp" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "targetValue" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_titles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_warnings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "warnedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phoneNumber" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerifiedAt" TIMESTAMP(3),
    "bio" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "stripeCustomerId" TEXT,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "subscriptionExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "equippedTitleId" TEXT,
    "equippedFrameId" TEXT,
    "avatarUrl" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "location" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "lessonType" "LessonType" NOT NULL,
    "currentTime" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "lastWatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_over_jobs" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL DEFAULT 'en',
    "provider" "AIProvider" NOT NULL,
    "voice" TEXT NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "pitch" DOUBLE PRECISION,
    "audioUrl" TEXT,
    "audioFormat" TEXT,
    "duration" DOUBLE PRECISION,
    "fileSize" INTEGER,
    "status" "VoiceJobStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "characters" INTEGER NOT NULL,
    "estimatedCost" DOUBLE PRECISION,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_over_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "event" "WebhookEvent" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "errorMessage" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" "WebhookEvent"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastFailureAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "XPTransactionType" NOT NULL,
    "source" "XPSource" NOT NULL,
    "sourceId" TEXT,
    "description" TEXT,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meditation_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "coverImage" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meditation_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meditations" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "audioUrl" TEXT NOT NULL,
    "audioUrlEn" TEXT,
    "coverImage" TEXT,
    "duration" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "difficulty" "MeditationDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "instructorId" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "benefits" TEXT[],
    "backgroundSoundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meditations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meditation_progress" (
    "id" TEXT NOT NULL,
    "meditationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentTime" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "playCount" INTEGER NOT NULL DEFAULT 1,
    "totalListened" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meditation_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meditation_favorites" (
    "id" TEXT NOT NULL,
    "meditationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meditation_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meditation_ratings" (
    "id" TEXT NOT NULL,
    "meditationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meditation_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meditation_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "meditationId" TEXT,
    "type" "SessionType" NOT NULL DEFAULT 'GUIDED',
    "targetDuration" INTEGER NOT NULL,
    "actualDuration" INTEGER NOT NULL DEFAULT 0,
    "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "intervalBell" INTEGER,
    "endBell" TEXT,
    "backgroundSoundId" TEXT,
    "backgroundVolume" INTEGER DEFAULT 50,
    "mood" "MoodLevel",
    "note" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meditation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breathworks" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "pattern" "BreathworkPattern" NOT NULL,
    "inhale" INTEGER NOT NULL,
    "hold1" INTEGER NOT NULL,
    "exhale" INTEGER NOT NULL,
    "hold2" INTEGER NOT NULL,
    "cycles" INTEGER NOT NULL,
    "audioUrl" TEXT,
    "coverImage" TEXT,
    "totalDuration" INTEGER NOT NULL,
    "category" "BreathworkCategory" NOT NULL DEFAULT 'CALM',
    "difficulty" "MeditationDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "benefits" TEXT[],
    "tags" TEXT[],
    "animationType" "BreathworkAnimation" NOT NULL DEFAULT 'CIRCLE',
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "breathworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breathwork_progress" (
    "id" TEXT NOT NULL,
    "breathworkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalCycles" INTEGER NOT NULL DEFAULT 0,
    "totalSeconds" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "breathwork_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breathwork_sessions" (
    "id" TEXT NOT NULL,
    "breathworkId" TEXT,
    "userId" TEXT NOT NULL,
    "customPattern" JSONB,
    "cyclesCompleted" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "mood" "MoodLevel",
    "notes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breathwork_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soundscapes" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "audioUrl" TEXT NOT NULL,
    "coverImage" TEXT,
    "duration" INTEGER,
    "isLoop" BOOLEAN NOT NULL DEFAULT true,
    "category" "SoundscapeCategory" NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isMixable" BOOLEAN NOT NULL DEFAULT true,
    "defaultVolume" INTEGER NOT NULL DEFAULT 50,
    "tags" TEXT[],
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soundscapes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soundscape_favorites" (
    "id" TEXT NOT NULL,
    "soundscapeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "soundscape_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sound_mixes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sound_mixes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sound_mix_items" (
    "id" TEXT NOT NULL,
    "mixId" TEXT NOT NULL,
    "soundscapeId" TEXT NOT NULL,
    "volume" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sound_mix_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sleep_stories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "audioUrl" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "duration" INTEGER NOT NULL,
    "category" "SleepStoryCategory" NOT NULL,
    "narratorName" TEXT,
    "backgroundSoundId" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sleep_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sleep_story_progress" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentTime" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "playCount" INTEGER NOT NULL DEFAULT 1,
    "lastPlayedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sleep_story_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sleep_story_ratings" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sleep_story_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_quotes" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "textEn" TEXT,
    "author" TEXT,
    "category" "QuoteCategory" NOT NULL DEFAULT 'MOTIVATION',
    "language" TEXT NOT NULL DEFAULT 'tr',
    "scheduledDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_content" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "quoteId" TEXT,
    "meditationId" TEXT,
    "breathworkId" TEXT,
    "tip" TEXT,
    "challenge" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mood" "MoodLevel" NOT NULL,
    "moodScore" INTEGER NOT NULL,
    "energy" INTEGER,
    "stress" INTEGER,
    "notes" TEXT,
    "tags" TEXT[],
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "category" "MoodTagCategory" NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "type" "JournalType" NOT NULL DEFAULT 'FREE_WRITE',
    "promptId" TEXT,
    "mood" "MoodLevel",
    "tags" TEXT[],
    "images" TEXT[],
    "audioUrl" TEXT,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT true,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_prompts" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "promptEn" TEXT,
    "type" "JournalType" NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_onboarding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "totalSteps" INTEGER NOT NULL DEFAULT 5,
    "answers" JSONB,
    "experienceLevel" TEXT,
    "goals" TEXT[],
    "interests" TEXT[],
    "practiceFrequency" TEXT,
    "preferredDuration" INTEGER,
    "preferredTime" TEXT,
    "healthConditions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "period" "GoalPeriod" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_progress" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "sourceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "time" TEXT NOT NULL,
    "days" TEXT[],
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastTriggeredAt" TIMESTAMP(3),
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "vibrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timer_presets" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "intervalBell" INTEGER,
    "startBell" TEXT,
    "endBell" TEXT,
    "intervalBellSound" TEXT,
    "backgroundSoundId" TEXT,
    "backgroundVolume" INTEGER DEFAULT 50,
    "icon" TEXT,
    "color" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timer_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sleep_timer_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultDuration" INTEGER NOT NULL DEFAULT 1800,
    "fadeOutEnabled" BOOLEAN NOT NULL DEFAULT true,
    "fadeOutDuration" INTEGER NOT NULL DEFAULT 60,
    "defaultSoundId" TEXT,
    "defaultVolume" INTEGER NOT NULL DEFAULT 50,
    "autoPlayNextStory" BOOLEAN NOT NULL DEFAULT false,
    "bedtimeReminder" BOOLEAN NOT NULL DEFAULT false,
    "bedtimeReminderTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sleep_timer_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sleep_tracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "bedTime" TIMESTAMP(3) NOT NULL,
    "wakeTime" TIMESTAMP(3) NOT NULL,
    "totalMinutes" INTEGER NOT NULL,
    "quality" INTEGER,
    "fellAsleepWith" TEXT,
    "contentId" TEXT,
    "notes" TEXT,
    "dreamNote" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sleep_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PodcastToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ProgramToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "_ContentToContentTag_B_index" ON "_ContentToContentTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ContentToContentTag_AB_unique" ON "_ContentToContentTag"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_slug_key" ON "achievements"("slug");

-- CreateIndex
CREATE INDEX "achievements_category_idx" ON "achievements"("category");

-- CreateIndex
CREATE INDEX "achievements_isActive_idx" ON "achievements"("isActive");

-- CreateIndex
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs"("action");

-- CreateIndex
CREATE INDEX "admin_audit_logs_adminId_idx" ON "admin_audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "admin_audit_logs_entityType_entityId_idx" ON "admin_audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_dashboard_preferences_adminId_key" ON "admin_dashboard_preferences"("adminId");

-- CreateIndex
CREATE INDEX "admin_notes_entityType_entityId_idx" ON "admin_notes"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "admin_webhook_deliveries_status_idx" ON "admin_webhook_deliveries"("status");

-- CreateIndex
CREATE INDEX "admin_webhook_deliveries_webhookId_idx" ON "admin_webhook_deliveries"("webhookId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_configurations_provider_model_key" ON "ai_configurations"("provider", "model");

-- CreateIndex
CREATE INDEX "ai_conversations_userId_idx" ON "ai_conversations"("userId");

-- CreateIndex
CREATE INDEX "ai_generated_contents_createdById_idx" ON "ai_generated_contents"("createdById");

-- CreateIndex
CREATE INDEX "ai_generated_contents_type_idx" ON "ai_generated_contents"("type");

-- CreateIndex
CREATE INDEX "ai_messages_conversationId_idx" ON "ai_messages"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_model_performances_provider_model_service_date_key" ON "ai_model_performances"("provider", "model", "service", "date");

-- CreateIndex
CREATE INDEX "ai_response_validations_hasHallucination_idx" ON "ai_response_validations"("hasHallucination");

-- CreateIndex
CREATE INDEX "ai_response_validations_responseType_idx" ON "ai_response_validations"("responseType");

-- CreateIndex
CREATE INDEX "ai_usage_logs_createdAt_idx" ON "ai_usage_logs"("createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_logs_service_idx" ON "ai_usage_logs"("service");

-- CreateIndex
CREATE INDEX "ai_usage_logs_userId_idx" ON "ai_usage_logs"("userId");

-- CreateIndex
CREATE INDEX "ai_workflow_edges_workflowId_idx" ON "ai_workflow_edges"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_workflow_edges_workflowId_sourceNodeId_targetNodeId_labe_key" ON "ai_workflow_edges"("workflowId", "sourceNodeId", "targetNodeId", "label");

-- CreateIndex
CREATE INDEX "ai_workflow_executions_status_idx" ON "ai_workflow_executions"("status");

-- CreateIndex
CREATE INDEX "ai_workflow_executions_workflowId_idx" ON "ai_workflow_executions"("workflowId");

-- CreateIndex
CREATE INDEX "ai_workflow_node_executions_executionId_idx" ON "ai_workflow_node_executions"("executionId");

-- CreateIndex
CREATE INDEX "ai_workflow_node_executions_nodeId_idx" ON "ai_workflow_node_executions"("nodeId");

-- CreateIndex
CREATE INDEX "ai_workflow_nodes_workflowId_idx" ON "ai_workflow_nodes"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_workflow_nodes_workflowId_nodeKey_key" ON "ai_workflow_nodes"("workflowId", "nodeKey");

-- CreateIndex
CREATE UNIQUE INDEX "ai_workflows_slug_key" ON "ai_workflows"("slug");

-- CreateIndex
CREATE INDEX "ai_workflows_status_idx" ON "ai_workflows"("status");

-- CreateIndex
CREATE INDEX "ai_workflows_type_idx" ON "ai_workflows"("type");

-- CreateIndex
CREATE INDEX "alerts_ruleId_idx" ON "alerts"("ruleId");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_triggeredAt_idx" ON "alerts"("triggeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_snapshots_date_key" ON "analytics_snapshots"("date");

-- CreateIndex
CREATE INDEX "analytics_snapshots_date_idx" ON "analytics_snapshots"("date");

-- CreateIndex
CREATE INDEX "announcements_isActive_idx" ON "announcements"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_isActive_idx" ON "api_keys"("isActive");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "badges_slug_key" ON "badges"("slug");

-- CreateIndex
CREATE INDEX "badges_category_idx" ON "badges"("category");

-- CreateIndex
CREATE INDEX "badges_isActive_idx" ON "badges"("isActive");

-- CreateIndex
CREATE INDEX "banners_isActive_idx" ON "banners"("isActive");

-- CreateIndex
CREATE INDEX "banners_position_idx" ON "banners"("position");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_ips_ipAddress_key" ON "blocked_ips"("ipAddress");

-- CreateIndex
CREATE INDEX "blocked_ips_ipAddress_idx" ON "blocked_ips"("ipAddress");

-- CreateIndex
CREATE INDEX "blocked_ips_isActive_idx" ON "blocked_ips"("isActive");

-- CreateIndex
CREATE INDEX "bookings_classId_idx" ON "bookings"("classId");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bulk_action_jobs_adminId_idx" ON "bulk_action_jobs"("adminId");

-- CreateIndex
CREATE INDEX "bulk_action_jobs_status_idx" ON "bulk_action_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_enrollments_userId_challengeId_key" ON "challenge_enrollments"("userId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "challenges_slug_key" ON "challenges"("slug");

-- CreateIndex
CREATE INDEX "challenges_isActive_idx" ON "challenges"("isActive");

-- CreateIndex
CREATE INDEX "challenges_difficulty_idx" ON "challenges"("difficulty");

-- CreateIndex
CREATE INDEX "classes_category_idx" ON "classes"("category");

-- CreateIndex
CREATE INDEX "classes_instructorId_idx" ON "classes"("instructorId");

-- CreateIndex
CREATE INDEX "classes_level_idx" ON "classes"("level");

-- CreateIndex
CREATE INDEX "classes_status_idx" ON "classes"("status");

-- CreateIndex
CREATE INDEX "classes_videoSource_idx" ON "classes"("videoSource");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_commentId_userId_key" ON "comment_likes"("commentId", "userId");

-- CreateIndex
CREATE INDEX "comments_authorId_idx" ON "comments"("authorId");

-- CreateIndex
CREATE INDEX "comments_challengeId_idx" ON "comments"("challengeId");

-- CreateIndex
CREATE INDEX "comments_classId_idx" ON "comments"("classId");

-- CreateIndex
CREATE INDEX "comments_poseId_idx" ON "comments"("poseId");

-- CreateIndex
CREATE INDEX "comments_programId_idx" ON "comments"("programId");

-- CreateIndex
CREATE INDEX "comments_targetType_idx" ON "comments"("targetType");

-- CreateIndex
CREATE INDEX "communication_campaigns_createdById_idx" ON "communication_campaigns"("createdById");

-- CreateIndex
CREATE INDEX "communication_campaigns_scheduledAt_idx" ON "communication_campaigns"("scheduledAt");

-- CreateIndex
CREATE INDEX "communication_campaigns_status_idx" ON "communication_campaigns"("status");

-- CreateIndex
CREATE INDEX "communication_campaigns_templateId_idx" ON "communication_campaigns"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "community_groups_slug_key" ON "community_groups"("slug");

-- CreateIndex
CREATE INDEX "community_groups_createdById_idx" ON "community_groups"("createdById");

-- CreateIndex
CREATE INDEX "community_groups_isOfficial_idx" ON "community_groups"("isOfficial");

-- CreateIndex
CREATE INDEX "community_groups_isPrivate_idx" ON "community_groups"("isPrivate");

-- CreateIndex
CREATE UNIQUE INDEX "content_categories_slug_key" ON "content_categories"("slug");

-- CreateIndex
CREATE INDEX "content_categories_parentId_idx" ON "content_categories"("parentId");

-- CreateIndex
CREATE INDEX "content_categories_slug_idx" ON "content_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "content_embeddings_entityType_entityId_key" ON "content_embeddings"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "content_reports_createdAt_idx" ON "content_reports"("createdAt");

-- CreateIndex
CREATE INDEX "content_reports_reporterId_idx" ON "content_reports"("reporterId");

-- CreateIndex
CREATE INDEX "content_reports_status_idx" ON "content_reports"("status");

-- CreateIndex
CREATE INDEX "content_reports_targetType_idx" ON "content_reports"("targetType");

-- CreateIndex
CREATE UNIQUE INDEX "content_tags_slug_key" ON "content_tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "content_templates_slug_key" ON "content_templates"("slug");

-- CreateIndex
CREATE INDEX "content_templates_type_idx" ON "content_templates"("type");

-- CreateIndex
CREATE INDEX "content_translations_entityType_entityId_idx" ON "content_translations"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "content_translations_languageId_idx" ON "content_translations"("languageId");

-- CreateIndex
CREATE UNIQUE INDEX "content_translations_entityType_entityId_field_languageId_key" ON "content_translations"("entityType", "entityId", "field", "languageId");

-- CreateIndex
CREATE INDEX "content_versions_contentId_idx" ON "content_versions"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_contentId_version_key" ON "content_versions"("contentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "contents_slug_key" ON "contents"("slug");

-- CreateIndex
CREATE INDEX "contents_authorId_idx" ON "contents"("authorId");

-- CreateIndex
CREATE INDEX "contents_categoryId_idx" ON "contents"("categoryId");

-- CreateIndex
CREATE INDEX "contents_publishedAt_idx" ON "contents"("publishedAt");

-- CreateIndex
CREATE INDEX "contents_slug_idx" ON "contents"("slug");

-- CreateIndex
CREATE INDEX "contents_status_idx" ON "contents"("status");

-- CreateIndex
CREATE INDEX "contents_type_idx" ON "contents"("type");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "conversations_participant1Id_idx" ON "conversations"("participant1Id");

-- CreateIndex
CREATE INDEX "conversations_participant2Id_idx" ON "conversations"("participant2Id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_participant1Id_participant2Id_key" ON "conversations"("participant1Id", "participant2Id");

-- CreateIndex
CREATE INDEX "coupon_usages_couponId_idx" ON "coupon_usages"("couponId");

-- CreateIndex
CREATE INDEX "coupon_usages_userId_idx" ON "coupon_usages"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_usages_couponId_userId_paymentId_key" ON "coupon_usages"("couponId", "userId", "paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_isActive_idx" ON "coupons"("isActive");

-- CreateIndex
CREATE INDEX "daily_checks_userId_date_idx" ON "daily_checks"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_checks_userId_date_challengeId_programSessionId_key" ON "daily_checks"("userId", "date", "challengeId", "programSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_insights_userId_date_key" ON "daily_insights"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_rewards_day_key" ON "daily_rewards"("day");

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_key" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_token_idx" ON "device_tokens"("token");

-- CreateIndex
CREATE INDEX "device_tokens_userId_idx" ON "device_tokens"("userId");

-- CreateIndex
CREATE INDEX "direct_messages_createdAt_idx" ON "direct_messages"("createdAt");

-- CreateIndex
CREATE INDEX "direct_messages_receiverId_senderId_idx" ON "direct_messages"("receiverId", "senderId");

-- CreateIndex
CREATE INDEX "direct_messages_senderId_receiverId_idx" ON "direct_messages"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "elevenlabs_jobs_createdById_idx" ON "elevenlabs_jobs"("createdById");

-- CreateIndex
CREATE INDEX "elevenlabs_jobs_status_idx" ON "elevenlabs_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "elevenlabs_voices_voiceId_key" ON "elevenlabs_voices"("voiceId");

-- CreateIndex
CREATE INDEX "export_jobs_adminId_idx" ON "export_jobs"("adminId");

-- CreateIndex
CREATE INDEX "export_jobs_status_idx" ON "export_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "faq_categories_slug_key" ON "faq_categories"("slug");

-- CreateIndex
CREATE INDEX "faq_items_categoryId_idx" ON "faq_items"("categoryId");

-- CreateIndex
CREATE INDEX "favorites_itemType_idx" ON "favorites"("itemType");

-- CreateIndex
CREATE INDEX "favorites_userId_idx" ON "favorites"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_itemId_itemType_key" ON "favorites"("userId", "itemId", "itemType");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE UNIQUE INDEX "forum_categories_slug_key" ON "forum_categories"("slug");

-- CreateIndex
CREATE INDEX "forum_categories_isActive_idx" ON "forum_categories"("isActive");

-- CreateIndex
CREATE INDEX "forum_categories_parentId_idx" ON "forum_categories"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "forum_post_likes_postId_userId_key" ON "forum_post_likes"("postId", "userId");

-- CreateIndex
CREATE INDEX "forum_posts_authorId_idx" ON "forum_posts"("authorId");

-- CreateIndex
CREATE INDEX "forum_posts_parentId_idx" ON "forum_posts"("parentId");

-- CreateIndex
CREATE INDEX "forum_posts_topicId_idx" ON "forum_posts"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "forum_tags_name_key" ON "forum_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "forum_tags_slug_key" ON "forum_tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "forum_topic_followers_topicId_userId_key" ON "forum_topic_followers"("topicId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "forum_topic_tags_topicId_tagId_key" ON "forum_topic_tags"("topicId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "forum_topics_slug_key" ON "forum_topics"("slug");

-- CreateIndex
CREATE INDEX "forum_topics_authorId_idx" ON "forum_topics"("authorId");

-- CreateIndex
CREATE INDEX "forum_topics_categoryId_idx" ON "forum_topics"("categoryId");

-- CreateIndex
CREATE INDEX "forum_topics_createdAt_idx" ON "forum_topics"("createdAt");

-- CreateIndex
CREATE INDEX "forum_topics_isFeatured_idx" ON "forum_topics"("isFeatured");

-- CreateIndex
CREATE INDEX "forum_topics_isPinned_idx" ON "forum_topics"("isPinned");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_config_key_key" ON "gamification_config"("key");

-- CreateIndex
CREATE INDEX "glossary_sourceTerm_idx" ON "glossary"("sourceTerm");

-- CreateIndex
CREATE UNIQUE INDEX "glossary_sourceLanguageId_targetLanguageId_sourceTerm_key" ON "glossary"("sourceLanguageId", "targetLanguageId", "sourceTerm");

-- CreateIndex
CREATE UNIQUE INDEX "grounding_documents_contentHash_key" ON "grounding_documents"("contentHash");

-- CreateIndex
CREATE INDEX "grounding_documents_isActive_idx" ON "grounding_documents"("isActive");

-- CreateIndex
CREATE INDEX "grounding_documents_sourceType_idx" ON "grounding_documents"("sourceType");

-- CreateIndex
CREATE INDEX "group_members_groupId_idx" ON "group_members"("groupId");

-- CreateIndex
CREATE INDEX "group_members_userId_idx" ON "group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_groupId_userId_key" ON "group_members"("groupId", "userId");

-- CreateIndex
CREATE INDEX "group_post_comments_authorId_idx" ON "group_post_comments"("authorId");

-- CreateIndex
CREATE INDEX "group_post_comments_postId_idx" ON "group_post_comments"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "group_post_likes_postId_userId_key" ON "group_post_likes"("postId", "userId");

-- CreateIndex
CREATE INDEX "group_posts_authorId_idx" ON "group_posts"("authorId");

-- CreateIndex
CREATE INDEX "group_posts_groupId_idx" ON "group_posts"("groupId");

-- CreateIndex
CREATE INDEX "group_posts_isPinned_idx" ON "group_posts"("isPinned");

-- CreateIndex
CREATE INDEX "hallucination_checks_contentType_idx" ON "hallucination_checks"("contentType");

-- CreateIndex
CREATE INDEX "hallucination_checks_createdAt_idx" ON "hallucination_checks"("createdAt");

-- CreateIndex
CREATE INDEX "hallucination_checks_severity_idx" ON "hallucination_checks"("severity");

-- CreateIndex
CREATE INDEX "instructor_analytics_date_idx" ON "instructor_analytics"("date");

-- CreateIndex
CREATE INDEX "instructor_analytics_instructorId_idx" ON "instructor_analytics"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_analytics_instructorId_date_key" ON "instructor_analytics"("instructorId", "date");

-- CreateIndex
CREATE INDEX "instructor_earnings_createdAt_idx" ON "instructor_earnings"("createdAt");

-- CreateIndex
CREATE INDEX "instructor_earnings_instructorId_idx" ON "instructor_earnings"("instructorId");

-- CreateIndex
CREATE INDEX "instructor_earnings_payoutId_idx" ON "instructor_earnings"("payoutId");

-- CreateIndex
CREATE INDEX "instructor_earnings_sourceType_idx" ON "instructor_earnings"("sourceType");

-- CreateIndex
CREATE INDEX "instructor_earnings_status_idx" ON "instructor_earnings"("status");

-- CreateIndex
CREATE INDEX "instructor_earnings_type_idx" ON "instructor_earnings"("type");

-- CreateIndex
CREATE INDEX "instructor_followers_instructorId_idx" ON "instructor_followers"("instructorId");

-- CreateIndex
CREATE INDEX "instructor_followers_userId_idx" ON "instructor_followers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_followers_instructorId_userId_key" ON "instructor_followers"("instructorId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_payout_settings_instructorId_key" ON "instructor_payout_settings"("instructorId");

-- CreateIndex
CREATE INDEX "instructor_payout_settings_instructorId_idx" ON "instructor_payout_settings"("instructorId");

-- CreateIndex
CREATE INDEX "instructor_payouts_instructorId_idx" ON "instructor_payouts"("instructorId");

-- CreateIndex
CREATE INDEX "instructor_payouts_method_idx" ON "instructor_payouts"("method");

-- CreateIndex
CREATE INDEX "instructor_payouts_requestedAt_idx" ON "instructor_payouts"("requestedAt");

-- CreateIndex
CREATE INDEX "instructor_payouts_status_idx" ON "instructor_payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_profiles_userId_key" ON "instructor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_profiles_slug_key" ON "instructor_profiles"("slug");

-- CreateIndex
CREATE INDEX "instructor_profiles_averageRating_idx" ON "instructor_profiles"("averageRating");

-- CreateIndex
CREATE INDEX "instructor_profiles_isFeatured_idx" ON "instructor_profiles"("isFeatured");

-- CreateIndex
CREATE INDEX "instructor_profiles_isVerified_idx" ON "instructor_profiles"("isVerified");

-- CreateIndex
CREATE INDEX "instructor_profiles_slug_idx" ON "instructor_profiles"("slug");

-- CreateIndex
CREATE INDEX "instructor_profiles_status_idx" ON "instructor_profiles"("status");

-- CreateIndex
CREATE INDEX "instructor_profiles_tier_idx" ON "instructor_profiles"("tier");

-- CreateIndex
CREATE INDEX "instructor_profiles_userId_idx" ON "instructor_profiles"("userId");

-- CreateIndex
CREATE INDEX "instructor_reviews_createdAt_idx" ON "instructor_reviews"("createdAt");

-- CreateIndex
CREATE INDEX "instructor_reviews_instructorId_idx" ON "instructor_reviews"("instructorId");

-- CreateIndex
CREATE INDEX "instructor_reviews_rating_idx" ON "instructor_reviews"("rating");

-- CreateIndex
CREATE INDEX "instructor_reviews_status_idx" ON "instructor_reviews"("status");

-- CreateIndex
CREATE INDEX "instructor_reviews_studentId_idx" ON "instructor_reviews"("studentId");

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_paymentId_key" ON "invoices"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stripeInvoiceId_key" ON "invoices"("stripeInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_createdAt_idx" ON "invoices"("createdAt");

-- CreateIndex
CREATE INDEX "invoices_invoiceType_idx" ON "invoices"("invoiceType");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_stripeInvoiceId_idx" ON "invoices"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "invoices_userId_idx" ON "invoices"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE INDEX "leaderboard_entries_period_periodStart_points_idx" ON "leaderboard_entries"("period", "periodStart", "points");

-- CreateIndex
CREATE INDEX "leaderboard_entries_userId_idx" ON "leaderboard_entries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_userId_period_periodStart_key" ON "leaderboard_entries"("userId", "period", "periodStart");

-- CreateIndex
CREATE INDEX "live_stream_chats_createdAt_idx" ON "live_stream_chats"("createdAt");

-- CreateIndex
CREATE INDEX "live_stream_chats_isPinned_idx" ON "live_stream_chats"("isPinned");

-- CreateIndex
CREATE INDEX "live_stream_chats_streamId_idx" ON "live_stream_chats"("streamId");

-- CreateIndex
CREATE INDEX "live_stream_chats_userId_idx" ON "live_stream_chats"("userId");

-- CreateIndex
CREATE INDEX "live_stream_participants_isActive_idx" ON "live_stream_participants"("isActive");

-- CreateIndex
CREATE INDEX "live_stream_participants_streamId_idx" ON "live_stream_participants"("streamId");

-- CreateIndex
CREATE INDEX "live_stream_participants_userId_idx" ON "live_stream_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "live_stream_participants_streamId_userId_key" ON "live_stream_participants"("streamId", "userId");

-- CreateIndex
CREATE INDEX "live_stream_reactions_streamId_idx" ON "live_stream_reactions"("streamId");

-- CreateIndex
CREATE INDEX "live_stream_reactions_userId_idx" ON "live_stream_reactions"("userId");

-- CreateIndex
CREATE INDEX "live_stream_recordings_status_idx" ON "live_stream_recordings"("status");

-- CreateIndex
CREATE INDEX "live_stream_recordings_streamId_idx" ON "live_stream_recordings"("streamId");

-- CreateIndex
CREATE INDEX "live_stream_registrations_streamId_idx" ON "live_stream_registrations"("streamId");

-- CreateIndex
CREATE INDEX "live_stream_registrations_userId_idx" ON "live_stream_registrations"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "live_stream_registrations_streamId_userId_key" ON "live_stream_registrations"("streamId", "userId");

-- CreateIndex
CREATE INDEX "live_stream_schedules_instructorId_idx" ON "live_stream_schedules"("instructorId");

-- CreateIndex
CREATE INDEX "live_stream_schedules_isActive_idx" ON "live_stream_schedules"("isActive");

-- CreateIndex
CREATE INDEX "live_stream_schedules_nextStreamAt_idx" ON "live_stream_schedules"("nextStreamAt");

-- CreateIndex
CREATE UNIQUE INDEX "live_streams_agoraChannelName_key" ON "live_streams"("agoraChannelName");

-- CreateIndex
CREATE INDEX "live_streams_instructorId_idx" ON "live_streams"("instructorId");

-- CreateIndex
CREATE INDEX "live_streams_level_idx" ON "live_streams"("level");

-- CreateIndex
CREATE INDEX "live_streams_scheduledStartAt_idx" ON "live_streams"("scheduledStartAt");

-- CreateIndex
CREATE INDEX "live_streams_status_idx" ON "live_streams"("status");

-- CreateIndex
CREATE INDEX "live_streams_type_idx" ON "live_streams"("type");

-- CreateIndex
CREATE UNIQUE INDEX "media_files_storageKey_key" ON "media_files"("storageKey");

-- CreateIndex
CREATE INDEX "media_files_folderId_idx" ON "media_files"("folderId");

-- CreateIndex
CREATE INDEX "media_files_status_idx" ON "media_files"("status");

-- CreateIndex
CREATE INDEX "media_files_type_idx" ON "media_files"("type");

-- CreateIndex
CREATE INDEX "media_files_uploadedById_idx" ON "media_files"("uploadedById");

-- CreateIndex
CREATE UNIQUE INDEX "media_folders_slug_key" ON "media_folders"("slug");

-- CreateIndex
CREATE INDEX "media_folders_parentId_idx" ON "media_folders"("parentId");

-- CreateIndex
CREATE INDEX "media_folders_slug_idx" ON "media_folders"("slug");

-- CreateIndex
CREATE INDEX "media_usages_entityType_entityId_idx" ON "media_usages"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "media_usages_mediaId_idx" ON "media_usages"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "media_usages_mediaId_entityType_entityId_fieldName_key" ON "media_usages"("mediaId", "entityType", "entityId", "fieldName");

-- CreateIndex
CREATE INDEX "media_variants_mediaId_idx" ON "media_variants"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "media_variants_mediaId_variantType_key" ON "media_variants"("mediaId", "variantType");

-- CreateIndex
CREATE INDEX "message_logs_channel_idx" ON "message_logs"("channel");

-- CreateIndex
CREATE INDEX "message_logs_sentAt_idx" ON "message_logs"("sentAt");

-- CreateIndex
CREATE INDEX "message_logs_status_idx" ON "message_logs"("status");

-- CreateIndex
CREATE INDEX "message_logs_templateId_idx" ON "message_logs"("templateId");

-- CreateIndex
CREATE INDEX "message_logs_userId_idx" ON "message_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_slug_key" ON "message_templates"("slug");

-- CreateIndex
CREATE INDEX "message_templates_category_idx" ON "message_templates"("category");

-- CreateIndex
CREATE INDEX "message_templates_channel_idx" ON "message_templates"("channel");

-- CreateIndex
CREATE INDEX "message_templates_isActive_idx" ON "message_templates"("isActive");

-- CreateIndex
CREATE INDEX "message_templates_slug_idx" ON "message_templates"("slug");

-- CreateIndex
CREATE INDEX "milestones_userId_type_idx" ON "milestones"("userId", "type");

-- CreateIndex
CREATE INDEX "navigation_items_menuId_idx" ON "navigation_items"("menuId");

-- CreateIndex
CREATE INDEX "navigation_items_parentId_idx" ON "navigation_items"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "navigation_menus_slug_key" ON "navigation_menus"("slug");

-- CreateIndex
CREATE INDEX "notification_logs_status_idx" ON "notification_logs"("status");

-- CreateIndex
CREATE INDEX "notification_logs_userId_idx" ON "notification_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "offline_contents_status_idx" ON "offline_contents"("status");

-- CreateIndex
CREATE INDEX "offline_contents_userId_idx" ON "offline_contents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "offline_contents_userId_contentId_contentType_key" ON "offline_contents"("userId", "contentId", "contentType");

-- CreateIndex
CREATE INDEX "offline_downloads_contentId_idx" ON "offline_downloads"("contentId");

-- CreateIndex
CREATE INDEX "offline_downloads_expiresAt_idx" ON "offline_downloads"("expiresAt");

-- CreateIndex
CREATE INDEX "offline_downloads_userId_idx" ON "offline_downloads"("userId");

-- CreateIndex
CREATE INDEX "otp_verifications_phoneNumber_idx" ON "otp_verifications"("phoneNumber");

-- CreateIndex
CREATE INDEX "otp_verifications_phoneNumber_purpose_idx" ON "otp_verifications"("phoneNumber", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_bookingId_key" ON "payments"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transactionId_key" ON "payments"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "payments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "payments_bookingId_idx" ON "payments"("bookingId");

-- CreateIndex
CREATE INDEX "payments_provider_idx" ON "payments"("provider");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_subscriptionId_idx" ON "payments"("subscriptionId");

-- CreateIndex
CREATE INDEX "payments_transactionId_idx" ON "payments"("transactionId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "planner_entries_userId_plannedAt_idx" ON "planner_entries"("userId", "plannedAt");

-- CreateIndex
CREATE INDEX "podcast_episodes_podcastId_status_idx" ON "podcast_episodes"("podcastId", "status");

-- CreateIndex
CREATE INDEX "podcast_episodes_publishedAt_idx" ON "podcast_episodes"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_episodes_podcastId_seasonNumber_episodeNumber_key" ON "podcast_episodes"("podcastId", "seasonNumber", "episodeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_episodes_podcastId_slug_key" ON "podcast_episodes"("podcastId", "slug");

-- CreateIndex
CREATE INDEX "podcast_likes_episodeId_idx" ON "podcast_likes"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_likes_userId_episodeId_key" ON "podcast_likes"("userId", "episodeId");

-- CreateIndex
CREATE INDEX "podcast_listens_episodeId_idx" ON "podcast_listens"("episodeId");

-- CreateIndex
CREATE INDEX "podcast_listens_startedAt_idx" ON "podcast_listens"("startedAt");

-- CreateIndex
CREATE INDEX "podcast_listens_userId_episodeId_idx" ON "podcast_listens"("userId", "episodeId");

-- CreateIndex
CREATE INDEX "podcast_subscriptions_podcastId_idx" ON "podcast_subscriptions"("podcastId");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_subscriptions_userId_podcastId_key" ON "podcast_subscriptions"("userId", "podcastId");

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_slug_key" ON "podcasts"("slug");

-- CreateIndex
CREATE INDEX "podcasts_category_idx" ON "podcasts"("category");

-- CreateIndex
CREATE INDEX "podcasts_hostId_idx" ON "podcasts"("hostId");

-- CreateIndex
CREATE INDEX "podcasts_status_idx" ON "podcasts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "program_sessions_programId_order_key" ON "program_sessions"("programId", "order");

-- CreateIndex
CREATE INDEX "programs_instructorId_idx" ON "programs"("instructorId");

-- CreateIndex
CREATE INDEX "programs_isPublished_idx" ON "programs"("isPublished");

-- CreateIndex
CREATE INDEX "programs_status_idx" ON "programs"("status");

-- CreateIndex
CREATE INDEX "programs_accessType_idx" ON "programs"("accessType");

-- CreateIndex
CREATE INDEX "purchase_receipts_transactionId_idx" ON "purchase_receipts"("transactionId");

-- CreateIndex
CREATE INDEX "purchase_receipts_userId_idx" ON "purchase_receipts"("userId");

-- CreateIndex
CREATE INDEX "purchase_receipts_validationStatus_idx" ON "purchase_receipts"("validationStatus");

-- CreateIndex
CREATE INDEX "quests_isActive_idx" ON "quests"("isActive");

-- CreateIndex
CREATE INDEX "quests_type_idx" ON "quests"("type");

-- CreateIndex
CREATE INDEX "rate_limit_logs_createdAt_idx" ON "rate_limit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_logs_endpoint_idx" ON "rate_limit_logs"("endpoint");

-- CreateIndex
CREATE INDEX "rate_limit_logs_identifier_idx" ON "rate_limit_logs"("identifier");

-- CreateIndex
CREATE INDEX "recommendations_expiresAt_idx" ON "recommendations"("expiresAt");

-- CreateIndex
CREATE INDEX "recommendations_userId_entityType_idx" ON "recommendations"("userId", "entityType");

-- CreateIndex
CREATE INDEX "recommendations_userId_type_idx" ON "recommendations"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_userId_key" ON "referral_codes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referredId_key" ON "referrals"("referredId");

-- CreateIndex
CREATE INDEX "referrals_referrerId_idx" ON "referrals"("referrerId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_providerRefundId_key" ON "refunds"("providerRefundId");

-- CreateIndex
CREATE INDEX "refunds_paymentId_idx" ON "refunds"("paymentId");

-- CreateIndex
CREATE INDEX "refunds_providerRefundId_idx" ON "refunds"("providerRefundId");

-- CreateIndex
CREATE INDEX "refunds_status_idx" ON "refunds"("status");

-- CreateIndex
CREATE UNIQUE INDEX "report_definitions_slug_key" ON "report_definitions"("slug");

-- CreateIndex
CREATE INDEX "report_exports_requestedById_idx" ON "report_exports"("requestedById");

-- CreateIndex
CREATE INDEX "report_exports_status_idx" ON "report_exports"("status");

-- CreateIndex
CREATE INDEX "report_instances_createdById_idx" ON "report_instances"("createdById");

-- CreateIndex
CREATE INDEX "report_instances_definitionId_idx" ON "report_instances"("definitionId");

-- CreateIndex
CREATE INDEX "report_schedules_isActive_nextRunAt_idx" ON "report_schedules"("isActive", "nextRunAt");

-- CreateIndex
CREATE INDEX "revenue_records_paymentId_idx" ON "revenue_records"("paymentId");

-- CreateIndex
CREATE INDEX "revenue_records_provider_idx" ON "revenue_records"("provider");

-- CreateIndex
CREATE INDEX "revenue_records_recordedAt_idx" ON "revenue_records"("recordedAt");

-- CreateIndex
CREATE INDEX "revenue_records_subscriptionId_idx" ON "revenue_records"("subscriptionId");

-- CreateIndex
CREATE INDEX "revenue_records_tier_idx" ON "revenue_records"("tier");

-- CreateIndex
CREATE INDEX "revenue_records_type_idx" ON "revenue_records"("type");

-- CreateIndex
CREATE INDEX "revenue_records_userId_idx" ON "revenue_records"("userId");

-- CreateIndex
CREATE INDEX "review_helpfuls_reviewId_idx" ON "review_helpfuls"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "review_helpfuls_reviewId_userId_key" ON "review_helpfuls"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "review_reports_reviewId_idx" ON "review_reports"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "review_reports_reviewId_userId_key" ON "review_reports"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "schedule_executions_scheduleId_idx" ON "schedule_executions"("scheduleId");

-- CreateIndex
CREATE INDEX "schedule_executions_status_idx" ON "schedule_executions"("status");

-- CreateIndex
CREATE INDEX "scheduled_messages_scheduledAt_idx" ON "scheduled_messages"("scheduledAt");

-- CreateIndex
CREATE INDEX "scheduled_messages_status_idx" ON "scheduled_messages"("status");

-- CreateIndex
CREATE INDEX "scheduled_messages_templateId_idx" ON "scheduled_messages"("templateId");

-- CreateIndex
CREATE INDEX "scheduled_messages_userId_idx" ON "scheduled_messages"("userId");

-- CreateIndex
CREATE INDEX "search_logs_createdAt_idx" ON "search_logs"("createdAt");

-- CreateIndex
CREATE INDEX "search_logs_query_idx" ON "search_logs"("query");

-- CreateIndex
CREATE INDEX "search_logs_userId_idx" ON "search_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "seasonal_event_participants_eventId_userId_key" ON "seasonal_event_participants"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "seasonal_events_slug_key" ON "seasonal_events"("slug");

-- CreateIndex
CREATE INDEX "seasonal_events_startDate_endDate_idx" ON "seasonal_events"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "shop_purchases_userId_idx" ON "shop_purchases"("userId");

-- CreateIndex
CREATE INDEX "sms_logs_messageType_idx" ON "sms_logs"("messageType");

-- CreateIndex
CREATE INDEX "sms_logs_phoneNumber_idx" ON "sms_logs"("phoneNumber");

-- CreateIndex
CREATE INDEX "sms_logs_status_idx" ON "sms_logs"("status");

-- CreateIndex
CREATE INDEX "sms_logs_userId_idx" ON "sms_logs"("userId");

-- CreateIndex
CREATE INDEX "social_shares_platform_idx" ON "social_shares"("platform");

-- CreateIndex
CREATE INDEX "social_shares_shareType_idx" ON "social_shares"("shareType");

-- CreateIndex
CREATE INDEX "social_shares_userId_idx" ON "social_shares"("userId");

-- CreateIndex
CREATE INDEX "streak_freezes_userId_idx" ON "streak_freezes"("userId");

-- CreateIndex
CREATE INDEX "subscription_plans_isActive_idx" ON "subscription_plans"("isActive");

-- CreateIndex
CREATE INDEX "subscription_plans_tier_idx" ON "subscription_plans"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_appleOriginalTransactionId_key" ON "subscriptions"("appleOriginalTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_googlePurchaseToken_key" ON "subscriptions"("googlePurchaseToken");

-- CreateIndex
CREATE INDEX "subscriptions_appleOriginalTransactionId_idx" ON "subscriptions"("appleOriginalTransactionId");

-- CreateIndex
CREATE INDEX "subscriptions_googlePurchaseToken_idx" ON "subscriptions"("googlePurchaseToken");

-- CreateIndex
CREATE INDEX "subscriptions_provider_idx" ON "subscriptions"("provider");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_stripeSubscriptionId_idx" ON "subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "sync_changes_entityType_idx" ON "sync_changes"("entityType");

-- CreateIndex
CREATE INDEX "sync_changes_userId_idx" ON "sync_changes"("userId");

-- CreateIndex
CREATE INDEX "sync_changes_version_idx" ON "sync_changes"("version");

-- CreateIndex
CREATE INDEX "sync_logs_processedAt_idx" ON "sync_logs"("processedAt");

-- CreateIndex
CREATE INDEX "sync_logs_userId_idx" ON "sync_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sync_logs_userId_clientActionId_key" ON "sync_logs"("userId", "clientActionId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "tax_rates_country_idx" ON "tax_rates"("country");

-- CreateIndex
CREATE INDEX "tax_rates_isActive_idx" ON "tax_rates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "tax_rates_country_state_key" ON "tax_rates"("country", "state");

-- CreateIndex
CREATE UNIQUE INDEX "titles_slug_key" ON "titles"("slug");

-- CreateIndex
CREATE INDEX "transcription_jobs_createdById_idx" ON "transcription_jobs"("createdById");

-- CreateIndex
CREATE INDEX "transcription_jobs_status_idx" ON "transcription_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "translation_keys_key_key" ON "translation_keys"("key");

-- CreateIndex
CREATE INDEX "translation_keys_namespace_idx" ON "translation_keys"("namespace");

-- CreateIndex
CREATE INDEX "translation_memory_sourceText_idx" ON "translation_memory"("sourceText");

-- CreateIndex
CREATE UNIQUE INDEX "translation_memory_sourceLanguageId_targetLanguageId_source_key" ON "translation_memory"("sourceLanguageId", "targetLanguageId", "sourceText");

-- CreateIndex
CREATE INDEX "translations_languageId_idx" ON "translations"("languageId");

-- CreateIndex
CREATE INDEX "translations_status_idx" ON "translations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "translations_keyId_languageId_key" ON "translations"("keyId", "languageId");

-- CreateIndex
CREATE UNIQUE INDEX "unsubscribe_tokens_token_key" ON "unsubscribe_tokens"("token");

-- CreateIndex
CREATE INDEX "unsubscribe_tokens_token_idx" ON "unsubscribe_tokens"("token");

-- CreateIndex
CREATE INDEX "unsubscribe_tokens_userId_idx" ON "unsubscribe_tokens"("userId");

-- CreateIndex
CREATE INDEX "user_achievements_userId_isCompleted_idx" ON "user_achievements"("userId", "isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "user_activities_activityType_idx" ON "user_activities"("activityType");

-- CreateIndex
CREATE INDEX "user_activities_createdAt_idx" ON "user_activities"("createdAt");

-- CreateIndex
CREATE INDEX "user_activities_userId_idx" ON "user_activities"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_ai_preferences_userId_key" ON "user_ai_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_avatar_frames_userId_frameId_key" ON "user_avatar_frames"("userId", "frameId");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "user_bans_isActive_idx" ON "user_bans"("isActive");

-- CreateIndex
CREATE INDEX "user_bans_userId_idx" ON "user_bans"("userId");

-- CreateIndex
CREATE INDEX "user_behaviors_createdAt_idx" ON "user_behaviors"("createdAt");

-- CreateIndex
CREATE INDEX "user_behaviors_eventType_idx" ON "user_behaviors"("eventType");

-- CreateIndex
CREATE INDEX "user_behaviors_userId_idx" ON "user_behaviors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_blocks_blockerId_blockedId_key" ON "user_blocks"("blockerId", "blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_rewards_userId_key" ON "user_daily_rewards"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_dashboard_widgets_userId_widgetId_key" ON "user_dashboard_widgets"("userId", "widgetId");

-- CreateIndex
CREATE UNIQUE INDEX "user_embeddings_userId_key" ON "user_embeddings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_engagement_stats_userId_key" ON "user_engagement_stats"("userId");

-- CreateIndex
CREATE INDEX "user_engagement_stats_engagementScore_idx" ON "user_engagement_stats"("engagementScore");

-- CreateIndex
CREATE INDEX "user_engagement_stats_lastActiveAt_idx" ON "user_engagement_stats"("lastActiveAt");

-- CreateIndex
CREATE INDEX "user_engagement_stats_userId_idx" ON "user_engagement_stats"("userId");

-- CreateIndex
CREATE INDEX "user_follows_followerId_idx" ON "user_follows"("followerId");

-- CreateIndex
CREATE INDEX "user_follows_followingId_idx" ON "user_follows"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "user_follows_followerId_followingId_key" ON "user_follows"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "user_language_preferences_userId_key" ON "user_language_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_levels_userId_key" ON "user_levels"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_message_preferences_userId_key" ON "user_message_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_message_preferences_userId_idx" ON "user_message_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_notes_userId_entityId_idx" ON "user_notes"("userId", "entityId");

-- CreateIndex
CREATE INDEX "user_quests_userId_isCompleted_isClaimed_idx" ON "user_quests"("userId", "isCompleted", "isClaimed");

-- CreateIndex
CREATE UNIQUE INDEX "user_quests_userId_questId_periodStart_key" ON "user_quests"("userId", "questId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "user_titles_userId_titleId_key" ON "user_titles"("userId", "titleId");

-- CreateIndex
CREATE INDEX "user_warnings_userId_idx" ON "user_warnings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "users_stripeCustomerId_idx" ON "users"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "video_progress_lessonId_idx" ON "video_progress"("lessonId");

-- CreateIndex
CREATE INDEX "video_progress_userId_idx" ON "video_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "video_progress_userId_lessonId_lessonType_key" ON "video_progress"("userId", "lessonId", "lessonType");

-- CreateIndex
CREATE INDEX "voice_over_jobs_createdById_idx" ON "voice_over_jobs"("createdById");

-- CreateIndex
CREATE INDEX "voice_over_jobs_status_idx" ON "voice_over_jobs"("status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_createdAt_idx" ON "webhook_deliveries"("createdAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_endpointId_idx" ON "webhook_deliveries"("endpointId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_event_idx" ON "webhook_deliveries"("event");

-- CreateIndex
CREATE INDEX "webhook_deliveries_nextRetryAt_idx" ON "webhook_deliveries"("nextRetryAt");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_idx" ON "webhook_deliveries"("status");

-- CreateIndex
CREATE INDEX "webhook_endpoints_isActive_idx" ON "webhook_endpoints"("isActive");

-- CreateIndex
CREATE INDEX "webhook_endpoints_userId_idx" ON "webhook_endpoints"("userId");

-- CreateIndex
CREATE INDEX "xp_transactions_createdAt_idx" ON "xp_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "xp_transactions_source_sourceId_idx" ON "xp_transactions"("source", "sourceId");

-- CreateIndex
CREATE INDEX "xp_transactions_userId_idx" ON "xp_transactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "meditation_categories_slug_key" ON "meditation_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "meditations_slug_key" ON "meditations"("slug");

-- CreateIndex
CREATE INDEX "meditations_categoryId_idx" ON "meditations"("categoryId");

-- CreateIndex
CREATE INDEX "meditations_instructorId_idx" ON "meditations"("instructorId");

-- CreateIndex
CREATE INDEX "meditations_isPremium_idx" ON "meditations"("isPremium");

-- CreateIndex
CREATE INDEX "meditations_isPublished_idx" ON "meditations"("isPublished");

-- CreateIndex
CREATE INDEX "meditation_progress_userId_idx" ON "meditation_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "meditation_progress_meditationId_userId_key" ON "meditation_progress"("meditationId", "userId");

-- CreateIndex
CREATE INDEX "meditation_favorites_userId_idx" ON "meditation_favorites"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "meditation_favorites_meditationId_userId_key" ON "meditation_favorites"("meditationId", "userId");

-- CreateIndex
CREATE INDEX "meditation_ratings_userId_idx" ON "meditation_ratings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "meditation_ratings_meditationId_userId_key" ON "meditation_ratings"("meditationId", "userId");

-- CreateIndex
CREATE INDEX "meditation_sessions_userId_idx" ON "meditation_sessions"("userId");

-- CreateIndex
CREATE INDEX "meditation_sessions_meditationId_idx" ON "meditation_sessions"("meditationId");

-- CreateIndex
CREATE INDEX "meditation_sessions_status_idx" ON "meditation_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "breathworks_slug_key" ON "breathworks"("slug");

-- CreateIndex
CREATE INDEX "breathwork_progress_userId_idx" ON "breathwork_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "breathwork_progress_breathworkId_userId_key" ON "breathwork_progress"("breathworkId", "userId");

-- CreateIndex
CREATE INDEX "breathwork_sessions_userId_idx" ON "breathwork_sessions"("userId");

-- CreateIndex
CREATE INDEX "breathwork_sessions_breathworkId_idx" ON "breathwork_sessions"("breathworkId");

-- CreateIndex
CREATE UNIQUE INDEX "soundscapes_slug_key" ON "soundscapes"("slug");

-- CreateIndex
CREATE INDEX "soundscape_favorites_userId_idx" ON "soundscape_favorites"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "soundscape_favorites_soundscapeId_userId_key" ON "soundscape_favorites"("soundscapeId", "userId");

-- CreateIndex
CREATE INDEX "user_sound_mixes_userId_idx" ON "user_sound_mixes"("userId");

-- CreateIndex
CREATE INDEX "user_sound_mixes_isPublic_idx" ON "user_sound_mixes"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "sound_mix_items_mixId_soundscapeId_key" ON "sound_mix_items"("mixId", "soundscapeId");

-- CreateIndex
CREATE UNIQUE INDEX "sleep_stories_slug_key" ON "sleep_stories"("slug");

-- CreateIndex
CREATE INDEX "sleep_stories_category_idx" ON "sleep_stories"("category");

-- CreateIndex
CREATE INDEX "sleep_stories_isPremium_idx" ON "sleep_stories"("isPremium");

-- CreateIndex
CREATE INDEX "sleep_story_progress_userId_idx" ON "sleep_story_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sleep_story_progress_storyId_userId_key" ON "sleep_story_progress"("storyId", "userId");

-- CreateIndex
CREATE INDEX "sleep_story_ratings_userId_idx" ON "sleep_story_ratings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sleep_story_ratings_storyId_userId_key" ON "sleep_story_ratings"("storyId", "userId");

-- CreateIndex
CREATE INDEX "daily_quotes_scheduledDate_idx" ON "daily_quotes"("scheduledDate");

-- CreateIndex
CREATE INDEX "daily_quotes_isActive_idx" ON "daily_quotes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "daily_content_date_key" ON "daily_content"("date");

-- CreateIndex
CREATE INDEX "daily_content_date_idx" ON "daily_content"("date");

-- CreateIndex
CREATE INDEX "mood_entries_userId_idx" ON "mood_entries"("userId");

-- CreateIndex
CREATE INDEX "mood_entries_date_idx" ON "mood_entries"("date");

-- CreateIndex
CREATE INDEX "journal_entries_userId_idx" ON "journal_entries"("userId");

-- CreateIndex
CREATE INDEX "journal_entries_date_idx" ON "journal_entries"("date");

-- CreateIndex
CREATE INDEX "journal_entries_type_idx" ON "journal_entries"("type");

-- CreateIndex
CREATE UNIQUE INDEX "user_onboarding_userId_key" ON "user_onboarding"("userId");

-- CreateIndex
CREATE INDEX "user_goals_userId_idx" ON "user_goals"("userId");

-- CreateIndex
CREATE INDEX "user_goals_isActive_idx" ON "user_goals"("isActive");

-- CreateIndex
CREATE INDEX "goal_progress_goalId_idx" ON "goal_progress"("goalId");

-- CreateIndex
CREATE INDEX "goal_progress_date_idx" ON "goal_progress"("date");

-- CreateIndex
CREATE INDEX "user_reminders_userId_idx" ON "user_reminders"("userId");

-- CreateIndex
CREATE INDEX "user_reminders_isEnabled_idx" ON "user_reminders"("isEnabled");

-- CreateIndex
CREATE INDEX "timer_presets_userId_idx" ON "timer_presets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sleep_timer_settings_userId_key" ON "sleep_timer_settings"("userId");

-- CreateIndex
CREATE INDEX "sleep_tracking_userId_idx" ON "sleep_tracking"("userId");

-- CreateIndex
CREATE INDEX "sleep_tracking_date_idx" ON "sleep_tracking"("date");

-- CreateIndex
CREATE UNIQUE INDEX "sleep_tracking_userId_date_key" ON "sleep_tracking"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "_PodcastToTag_AB_unique" ON "_PodcastToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_PodcastToTag_B_index" ON "_PodcastToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProgramToTag_AB_unique" ON "_ProgramToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ProgramToTag_B_index" ON "_ProgramToTag"("B");

-- AddForeignKey
ALTER TABLE "_ContentToContentTag" ADD CONSTRAINT "_ContentToContentTag_A_fkey" FOREIGN KEY ("A") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ContentToContentTag" ADD CONSTRAINT "_ContentToContentTag_B_fkey" FOREIGN KEY ("B") REFERENCES "content_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "achievements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "achievement_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_dashboard_preferences" ADD CONSTRAINT "admin_dashboard_preferences_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_webhook_deliveries" ADD CONSTRAINT "admin_webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhook_endpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generated_contents" ADD CONSTRAINT "ai_generated_contents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generated_contents" ADD CONSTRAINT "ai_generated_contents_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workflow_edges" ADD CONSTRAINT "ai_workflow_edges_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "ai_workflow_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workflow_edges" ADD CONSTRAINT "ai_workflow_edges_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "ai_workflow_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workflow_edges" ADD CONSTRAINT "ai_workflow_edges_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ai_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workflow_executions" ADD CONSTRAINT "ai_workflow_executions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ai_workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workflow_node_executions" ADD CONSTRAINT "ai_workflow_node_executions_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "ai_workflow_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workflow_node_executions" ADD CONSTRAINT "ai_workflow_node_executions_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "ai_workflow_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workflow_nodes" ADD CONSTRAINT "ai_workflow_nodes_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ai_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "alert_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_action_jobs" ADD CONSTRAINT "bulk_action_jobs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_enrollments" ADD CONSTRAINT "challenge_enrollments_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_enrollments" ADD CONSTRAINT "challenge_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_campaigns" ADD CONSTRAINT "communication_campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_campaigns" ADD CONSTRAINT "communication_campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "message_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_groups" ADD CONSTRAINT "community_groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_categories" ADD CONSTRAINT "content_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "content_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "forum_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "forum_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_translations" ADD CONSTRAINT "content_translations_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "content_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_queries" ADD CONSTRAINT "custom_queries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_checks" ADD CONSTRAINT "daily_checks_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_checks" ADD CONSTRAINT "daily_checks_programSessionId_fkey" FOREIGN KEY ("programSessionId") REFERENCES "program_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_checks" ADD CONSTRAINT "daily_checks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_insights" ADD CONSTRAINT "daily_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elevenlabs_jobs" ADD CONSTRAINT "elevenlabs_jobs_voiceId_fkey" FOREIGN KEY ("voiceId") REFERENCES "elevenlabs_voices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "faq_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_categories" ADD CONSTRAINT "forum_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "forum_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_post_likes" ADD CONSTRAINT "forum_post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "forum_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_post_likes" ADD CONSTRAINT "forum_post_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "forum_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "forum_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_topic_followers" ADD CONSTRAINT "forum_topic_followers_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "forum_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_topic_followers" ADD CONSTRAINT "forum_topic_followers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_topic_tags" ADD CONSTRAINT "forum_topic_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "forum_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_topic_tags" ADD CONSTRAINT "forum_topic_tags_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "forum_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_topics" ADD CONSTRAINT "forum_topics_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_topics" ADD CONSTRAINT "forum_topics_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "forum_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_topics" ADD CONSTRAINT "forum_topics_lastReplyById_fkey" FOREIGN KEY ("lastReplyById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "community_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_post_comments" ADD CONSTRAINT "group_post_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_post_comments" ADD CONSTRAINT "group_post_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "group_post_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_post_comments" ADD CONSTRAINT "group_post_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "group_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_post_likes" ADD CONSTRAINT "group_post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "group_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_post_likes" ADD CONSTRAINT "group_post_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_posts" ADD CONSTRAINT "group_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_posts" ADD CONSTRAINT "group_posts_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "community_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_analytics" ADD CONSTRAINT "instructor_analytics_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_earnings" ADD CONSTRAINT "instructor_earnings_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_earnings" ADD CONSTRAINT "instructor_earnings_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "instructor_payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_followers" ADD CONSTRAINT "instructor_followers_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_followers" ADD CONSTRAINT "instructor_followers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_payout_settings" ADD CONSTRAINT "instructor_payout_settings_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_payouts" ADD CONSTRAINT "instructor_payouts_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_profiles" ADD CONSTRAINT "instructor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_reviews" ADD CONSTRAINT "instructor_reviews_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_reviews" ADD CONSTRAINT "instructor_reviews_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "languages" ADD CONSTRAINT "languages_fallbackId_fkey" FOREIGN KEY ("fallbackId") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_chats" ADD CONSTRAINT "live_stream_chats_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "live_stream_chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_chats" ADD CONSTRAINT "live_stream_chats_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "live_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_chats" ADD CONSTRAINT "live_stream_chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_participants" ADD CONSTRAINT "live_stream_participants_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "live_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_participants" ADD CONSTRAINT "live_stream_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_reactions" ADD CONSTRAINT "live_stream_reactions_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "live_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_reactions" ADD CONSTRAINT "live_stream_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_recordings" ADD CONSTRAINT "live_stream_recordings_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "live_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_registrations" ADD CONSTRAINT "live_stream_registrations_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "live_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_registrations" ADD CONSTRAINT "live_stream_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_stream_schedules" ADD CONSTRAINT "live_stream_schedules_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_streams" ADD CONSTRAINT "live_streams_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_windows" ADD CONSTRAINT "maintenance_windows_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_usages" ADD CONSTRAINT "media_usages_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_variants" ADD CONSTRAINT "media_variants_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "navigation_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "navigation_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_contents" ADD CONSTRAINT "offline_contents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offline_downloads" ADD CONSTRAINT "offline_downloads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planner_entries" ADD CONSTRAINT "planner_entries_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planner_entries" ADD CONSTRAINT "planner_entries_programSessionId_fkey" FOREIGN KEY ("programSessionId") REFERENCES "program_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planner_entries" ADD CONSTRAINT "planner_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "podcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_likes" ADD CONSTRAINT "podcast_likes_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "podcast_episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_likes" ADD CONSTRAINT "podcast_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_listens" ADD CONSTRAINT "podcast_listens_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "podcast_episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_listens" ADD CONSTRAINT "podcast_listens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_subscriptions" ADD CONSTRAINT "podcast_subscriptions_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "podcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_subscriptions" ADD CONSTRAINT "podcast_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcasts" ADD CONSTRAINT "podcasts_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_sessions" ADD CONSTRAINT "program_sessions_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_receipts" ADD CONSTRAINT "purchase_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "report_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_instances" ADD CONSTRAINT "report_instances_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_instances" ADD CONSTRAINT "report_instances_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "report_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "report_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_executions" ADD CONSTRAINT "schedule_executions_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "report_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "message_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_messages" ADD CONSTRAINT "scheduled_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasonal_event_participants" ADD CONSTRAINT "seasonal_event_participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "seasonal_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasonal_event_participants" ADD CONSTRAINT "seasonal_event_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_purchases" ADD CONSTRAINT "shop_purchases_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "shop_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_purchases" ADD CONSTRAINT "shop_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "streak_freezes" ADD CONSTRAINT "streak_freezes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_changes" ADD CONSTRAINT "sync_changes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcription_jobs" ADD CONSTRAINT "transcription_jobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translations" ADD CONSTRAINT "translations_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "translation_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "translations" ADD CONSTRAINT "translations_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unsubscribe_tokens" ADD CONSTRAINT "unsubscribe_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_ai_preferences" ADD CONSTRAINT "user_ai_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_avatar_frames" ADD CONSTRAINT "user_avatar_frames_frameId_fkey" FOREIGN KEY ("frameId") REFERENCES "avatar_frames"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_avatar_frames" ADD CONSTRAINT "user_avatar_frames_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bans" ADD CONSTRAINT "user_bans_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bans" ADD CONSTRAINT "user_bans_unbannedById_fkey" FOREIGN KEY ("unbannedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bans" ADD CONSTRAINT "user_bans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_behaviors" ADD CONSTRAINT "user_behaviors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_daily_rewards" ADD CONSTRAINT "user_daily_rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dashboard_widgets" ADD CONSTRAINT "user_dashboard_widgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_dashboard_widgets" ADD CONSTRAINT "user_dashboard_widgets_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "dashboard_widgets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_embeddings" ADD CONSTRAINT "user_embeddings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_engagement_stats" ADD CONSTRAINT "user_engagement_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_language_preferences" ADD CONSTRAINT "user_language_preferences_preferredLanguageId_fkey" FOREIGN KEY ("preferredLanguageId") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_language_preferences" ADD CONSTRAINT "user_language_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_levels" ADD CONSTRAINT "user_levels_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_message_preferences" ADD CONSTRAINT "user_message_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_questId_fkey" FOREIGN KEY ("questId") REFERENCES "quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quests" ADD CONSTRAINT "user_quests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_titles" ADD CONSTRAINT "user_titles_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_titles" ADD CONSTRAINT "user_titles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_warnings" ADD CONSTRAINT "user_warnings_warnedById_fkey" FOREIGN KEY ("warnedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_over_jobs" ADD CONSTRAINT "voice_over_jobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meditations" ADD CONSTRAINT "meditations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "meditation_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meditations" ADD CONSTRAINT "meditations_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meditations" ADD CONSTRAINT "meditations_backgroundSoundId_fkey" FOREIGN KEY ("backgroundSoundId") REFERENCES "soundscapes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meditation_progress" ADD CONSTRAINT "meditation_progress_meditationId_fkey" FOREIGN KEY ("meditationId") REFERENCES "meditations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meditation_progress" ADD CONSTRAINT "meditation_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meditation_favorites" ADD CONSTRAINT "meditation_favorites_meditationId_fkey" FOREIGN KEY ("meditationId") REFERENCES "meditations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meditation_favorites" ADD CONSTRAINT "meditation_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meditation_ratings" ADD CONSTRAINT "meditation_ratings_meditationId_fkey" FOREIGN KEY ("meditationId") REFERENCES "meditations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meditation_ratings" ADD CONSTRAINT "meditation_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meditation_sessions" ADD CONSTRAINT "meditation_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meditation_sessions" ADD CONSTRAINT "meditation_sessions_meditationId_fkey" FOREIGN KEY ("meditationId") REFERENCES "meditations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meditation_sessions" ADD CONSTRAINT "meditation_sessions_backgroundSoundId_fkey" FOREIGN KEY ("backgroundSoundId") REFERENCES "soundscapes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breathwork_progress" ADD CONSTRAINT "breathwork_progress_breathworkId_fkey" FOREIGN KEY ("breathworkId") REFERENCES "breathworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breathwork_progress" ADD CONSTRAINT "breathwork_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breathwork_sessions" ADD CONSTRAINT "breathwork_sessions_breathworkId_fkey" FOREIGN KEY ("breathworkId") REFERENCES "breathworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breathwork_sessions" ADD CONSTRAINT "breathwork_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soundscape_favorites" ADD CONSTRAINT "soundscape_favorites_soundscapeId_fkey" FOREIGN KEY ("soundscapeId") REFERENCES "soundscapes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soundscape_favorites" ADD CONSTRAINT "soundscape_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sound_mixes" ADD CONSTRAINT "user_sound_mixes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sound_mix_items" ADD CONSTRAINT "sound_mix_items_mixId_fkey" FOREIGN KEY ("mixId") REFERENCES "user_sound_mixes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sound_mix_items" ADD CONSTRAINT "sound_mix_items_soundscapeId_fkey" FOREIGN KEY ("soundscapeId") REFERENCES "soundscapes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_stories" ADD CONSTRAINT "sleep_stories_backgroundSoundId_fkey" FOREIGN KEY ("backgroundSoundId") REFERENCES "soundscapes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_story_progress" ADD CONSTRAINT "sleep_story_progress_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "sleep_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_story_progress" ADD CONSTRAINT "sleep_story_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_story_ratings" ADD CONSTRAINT "sleep_story_ratings_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "sleep_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_story_ratings" ADD CONSTRAINT "sleep_story_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_content" ADD CONSTRAINT "daily_content_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "daily_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_content" ADD CONSTRAINT "daily_content_meditationId_fkey" FOREIGN KEY ("meditationId") REFERENCES "meditations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_content" ADD CONSTRAINT "daily_content_breathworkId_fkey" FOREIGN KEY ("breathworkId") REFERENCES "breathworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "journal_prompts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_onboarding" ADD CONSTRAINT "user_onboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_progress" ADD CONSTRAINT "goal_progress_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "user_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reminders" ADD CONSTRAINT "user_reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timer_presets" ADD CONSTRAINT "timer_presets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timer_presets" ADD CONSTRAINT "timer_presets_backgroundSoundId_fkey" FOREIGN KEY ("backgroundSoundId") REFERENCES "soundscapes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_timer_settings" ADD CONSTRAINT "sleep_timer_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_timer_settings" ADD CONSTRAINT "sleep_timer_settings_defaultSoundId_fkey" FOREIGN KEY ("defaultSoundId") REFERENCES "soundscapes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_tracking" ADD CONSTRAINT "sleep_tracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PodcastToTag" ADD CONSTRAINT "_PodcastToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "podcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PodcastToTag" ADD CONSTRAINT "_PodcastToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramToTag" ADD CONSTRAINT "_ProgramToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProgramToTag" ADD CONSTRAINT "_ProgramToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

