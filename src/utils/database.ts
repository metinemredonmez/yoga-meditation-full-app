import { PrismaClient } from '@prisma/client';

let basePrisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  basePrisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  basePrisma = global.__prisma;
}

// Create a proxy to map singular/camelCase model names to plural/snake_case (db pull renamed them)
// This allows code using prisma.user to work with prisma.users
const modelAliases: Record<string, string> = {
  // Core models
  users: 'users',
  auditLog: 'audit_logs',
  refreshToken: 'refresh_tokens',
  passwordResetToken: 'password_reset_tokens',

  // Content models
  program: 'programs',
  programSession: 'program_sessions',
  class: 'classes',
  pose: 'poses',
  content: 'contents',
  contentCategory: 'content_categories',
  contentTag: 'content_tags',
  contentReport: 'content_reports',
  contentTemplate: 'content_templates',
  contentVersion: 'content_versions',
  contentTranslation: 'content_translations',
  contentEmbedding: 'content_embeddings',

  // User related
  userLevel: 'user_levels',
  userAchievement: 'user_achievements',
  userBadge: 'user_badges',
  userTitle: 'user_titles',
  userQuest: 'user_quests',
  userFollow: 'user_follows',
  userAvatarFrame: 'user_avatar_frames',
  userBan: 'user_bans',
  userBlock: 'user_blocks',
  userWarning: 'user_warnings',
  userNote: 'user_notes',
  userActivity: 'user_activities',
  userBehavior: 'user_behaviors',
  userEngagementStat: 'user_engagement_stats',
  userDailyReward: 'user_daily_rewards',
  userDashboardWidget: 'user_dashboard_widgets',
  userLanguagePreference: 'user_language_preferences',
  userMessagePreference: 'user_message_preferences',
  userAiPreference: 'user_ai_preferences',
  userEmbedding: 'user_embeddings',

  // Subscription & Payments
  subscriptions: 'subscriptions',
  subscriptionPlan: 'subscription_plans',
  payments: 'payments',
  invoice: 'invoices',
  invoiceItem: 'invoice_items',
  refund: 'refunds',
  coupon: 'coupons',
  couponUsage: 'coupon_usages',
  taxRate: 'tax_rates',
  purchaseReceipt: 'purchase_receipts',

  // Instructor related
  instructorProfile: 'instructor_profiles',
  instructorReview: 'instructor_reviews',
  instructorFollower: 'instructor_followers',
  instructorEarning: 'instructor_earnings',
  instructorPayout: 'instructor_payouts',
  instructorPayoutSetting: 'instructor_payout_settings',
  instructorAnalytic: 'instructor_analytics',

  // Live streaming
  liveStream: 'live_streams',
  liveStreamChat: 'live_stream_chats',
  liveStreamParticipant: 'live_stream_participants',
  liveStreamReaction: 'live_stream_reactions',
  liveStreamRecording: 'live_stream_recordings',
  liveStreamRegistration: 'live_stream_registrations',
  liveStreamSchedule: 'live_stream_schedules',

  // Gamification
  achievement: 'achievements',
  achievementTier: 'achievement_tiers',
  badge: 'badges',
  avatarFrame: 'avatar_frames',
  title: 'titles',
  milestone: 'milestones',
  challenge: 'challenges',
  challengeEnrollment: 'challenge_enrollments',
  quest: 'quests',
  dailyReward: 'daily_rewards',
  dailyCheck: 'daily_checks',
  dailyInsight: 'daily_insights',
  streakFreeze: 'streak_freezes',
  xpTransaction: 'xp_transactions',
  leaderboardEntry: 'leaderboard_entries',
  gamificationConfig: 'gamification_config',
  seasonalEvent: 'seasonal_events',
  seasonalEventParticipant: 'seasonal_event_participants',
  shopItem: 'shop_items',
  shopPurchase: 'shop_purchases',

  // Podcasts
  podcast: 'podcasts',
  podcastEpisode: 'podcast_episodes',
  podcastLike: 'podcast_likes',
  podcastListen: 'podcast_listens',
  podcastSubscription: 'podcast_subscriptions',

  // Forum & Community
  forumCategory: 'forum_categories',
  forumTopic: 'forum_topics',
  forumPost: 'forum_posts',
  forumTag: 'forum_tags',
  forumTopicTag: 'forum_topic_tags',
  forumPostLike: 'forum_post_likes',
  forumTopicFollower: 'forum_topic_followers',
  communityGroup: 'community_groups',
  groupMember: 'group_members',
  groupPost: 'group_posts',
  groupPostComment: 'group_post_comments',
  groupPostLike: 'group_post_likes',

  // Comments & Social
  comment: 'comments',
  commentLike: 'comment_likes',
  favorite: 'favorites',
  socialShare: 'social_shares',
  recommendation: 'recommendations',

  // Messaging
  conversation: 'conversations',
  directMessage: 'direct_messages',
  messageTemplate: 'message_templates',
  messageLog: 'message_logs',
  scheduledMessage: 'scheduled_messages',
  communicationCampaign: 'communication_campaigns',

  // Notifications
  notificationLog: 'notification_logs',
  notificationPreference: 'notification_preferences',
  deviceToken: 'device_tokens',
  announcement: 'announcements',

  // Bookings
  booking: 'bookings',
  plannerEntry: 'planner_entries',

  // Video
  videoProgress: 'video_progress',
  mediaFile: 'media_files',
  mediaFolder: 'media_folders',
  mediaUsage: 'media_usages',
  mediaVariant: 'media_variants',

  // Webhooks
  webhookEndpoint: 'webhook_endpoints',
  webhookDelivery: 'webhook_deliveries',
  adminWebhookDelivery: 'admin_webhook_deliveries',

  // Admin
  adminAuditLog: 'admin_audit_logs',
  adminDashboardPreference: 'admin_dashboard_preferences',
  adminNote: 'admin_notes',
  dashboardWidget: 'dashboard_widgets',

  // Analytics & Reports
  analyticsSnapshot: 'analytics_snapshots',
  revenueRecord: 'revenue_records',
  reportDefinition: 'report_definitions',
  reportInstance: 'report_instances',
  reportSchedule: 'report_schedules',
  reportExport: 'report_exports',
  savedReport: 'saved_reports',
  customQuery: 'custom_queries',
  searchLog: 'search_logs',

  // System settings
  systemSetting: 'system_settings',
  featureFlag: 'feature_flags',
  apiKey: 'api_keys',
  maintenanceWindow: 'maintenance_windows',
  alertRule: 'alert_rules',
  alert: 'alerts',
  rateLimitLog: 'rate_limit_logs',
  blockedIp: 'blocked_ips',
  bulkActionJob: 'bulk_action_jobs',
  exportJob: 'export_jobs',
  scheduleExecution: 'schedule_executions',

  // FAQ & Help
  faqCategory: 'faq_categories',
  faqItem: 'faq_items',
  glossary: 'glossary',

  // Banner & Navigation
  banner: 'banners',
  navigationMenu: 'navigation_menus',
  navigationItem: 'navigation_items',

  // Translation & i18n
  translation: 'translations',
  translationKey: 'translation_keys',
  translationJob: 'translation_jobs',
  translationMemory: 'translation_memory',
  language: 'languages',

  // AI
  aiConfiguration: 'ai_configurations',
  aiConversation: 'ai_conversations',
  aiMessage: 'ai_messages',
  aiGeneratedContent: 'ai_generated_contents',
  aiModelPerformance: 'ai_model_performances',
  aiResponseValidation: 'ai_response_validations',
  aiUsageLog: 'ai_usage_logs',
  aiWorkflow: 'ai_workflows',
  aiWorkflowNode: 'ai_workflow_nodes',
  aiWorkflowEdge: 'ai_workflow_edges',
  aiWorkflowExecution: 'ai_workflow_executions',
  aiWorkflowNodeExecution: 'ai_workflow_node_executions',
  groundingDocument: 'grounding_documents',
  hallucinationCheck: 'hallucination_checks',

  // Jobs
  elevenlabsJob: 'elevenlabs_jobs',
  elevenlabsVoice: 'elevenlabs_voices',
  voiceOverJob: 'voice_over_jobs',
  transcriptionJob: 'transcription_jobs',

  // Offline
  offlineContent: 'offline_contents',
  offlineDownload: 'offline_downloads',
  syncChange: 'sync_changes',
  syncLog: 'sync_logs',

  // Referral
  referralCode: 'referral_codes',
  referral: 'referrals',

  // Reviews
  reviewHelpful: 'review_helpfuls',
  reviewReport: 'review_reports',

  // SMS & Email
  smsLog: 'sms_logs',
  unsubscribeToken: 'unsubscribe_tokens',
  otpVerification: 'otp_verifications',

  // Tags
  tag: 'tags',
};

const prisma = new Proxy(basePrisma, {
  get(target, prop: string) {
    const aliasedProp = modelAliases[prop] || prop;
    return (target as unknown as Record<string, unknown>)[aliasedProp];
  },
}) as PrismaClient;

export { prisma };