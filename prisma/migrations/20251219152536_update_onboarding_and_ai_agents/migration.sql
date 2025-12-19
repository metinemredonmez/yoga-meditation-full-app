/*
  Warnings:

  - The values [BASIC] on the enum `SubscriptionTier` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[appleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('ONBOARDING', 'PERSONALIZATION', 'RETENTION', 'MOOD_WELLNESS', 'STREAK_GAMIFICATION', 'SUBSCRIPTION', 'CONTENT_SCHEDULING', 'SLEEP', 'INSTRUCTOR', 'SUPPORT');

-- CreateEnum
CREATE TYPE "AgentEventStatus" AS ENUM ('PENDING', 'SCHEDULED', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'DISMISSED', 'FAILED');

-- CreateEnum
CREATE TYPE "AgentChannel" AS ENUM ('PUSH', 'EMAIL', 'IN_APP', 'SMS');

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionTier_new" AS ENUM ('FREE', 'MEDITATION', 'YOGA', 'PREMIUM', 'FAMILY', 'ENTERPRISE');
ALTER TABLE "users" ALTER COLUMN "subscriptionTier" DROP DEFAULT;
ALTER TABLE "live_streams" ALTER COLUMN "minimumTier" TYPE "SubscriptionTier_new" USING ("minimumTier"::text::"SubscriptionTier_new");
ALTER TABLE "revenue_records" ALTER COLUMN "tier" TYPE "SubscriptionTier_new" USING ("tier"::text::"SubscriptionTier_new");
ALTER TABLE "subscription_plans" ALTER COLUMN "tier" TYPE "SubscriptionTier_new" USING ("tier"::text::"SubscriptionTier_new");
ALTER TABLE "users" ALTER COLUMN "subscriptionTier" TYPE "SubscriptionTier_new" USING ("subscriptionTier"::text::"SubscriptionTier_new");
ALTER TYPE "SubscriptionTier" RENAME TO "SubscriptionTier_old";
ALTER TYPE "SubscriptionTier_new" RENAME TO "SubscriptionTier";
DROP TYPE "SubscriptionTier_old";
ALTER TABLE "users" ALTER COLUMN "subscriptionTier" SET DEFAULT 'FREE';
COMMIT;

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "hasAICoach" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasFamilySharing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasLiveClasses" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasOfflineDownload" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "includedCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maxFamilyMembers" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "user_onboarding" ADD COLUMN     "activityLevel" TEXT,
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "fitnessLevel" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "hasMeditationExperience" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasPilatesExperience" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasYogaExperience" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "preferredCategories" TEXT[],
ADD COLUMN     "primaryGoal" TEXT,
ADD COLUMN     "reminderTime" TEXT,
ADD COLUMN     "secondaryGoals" TEXT[],
ADD COLUMN     "weight" DOUBLE PRECISION,
ALTER COLUMN "totalSteps" SET DEFAULT 7;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "appleId" TEXT,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "provider" TEXT DEFAULT 'email';

-- CreateTable
CREATE TABLE "integration_settings" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "integration_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "channel" "AgentChannel" NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "action" JSONB,
    "payload" JSONB,
    "status" "AgentEventStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "ruleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_agent_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "agentType" "AgentType" NOT NULL,
    "trigger" JSONB NOT NULL,
    "conditions" JSONB,
    "action" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "cooldownHours" INTEGER NOT NULL DEFAULT 24,
    "maxPerDay" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agent_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "channel" "AgentChannel" NOT NULL,
    "titleTemplate" TEXT NOT NULL,
    "bodyTemplate" TEXT NOT NULL,
    "variables" TEXT[],
    "language" TEXT NOT NULL DEFAULT 'tr',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agent_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_agent_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "maxDailyPush" INTEGER NOT NULL DEFAULT 5,
    "maxDailyEmail" INTEGER NOT NULL DEFAULT 2,
    "preferredTime" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "onboardingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "personalizationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "retentionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "moodEnabled" BOOLEAN NOT NULL DEFAULT true,
    "streakEnabled" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sleepEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_agent_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_analytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "agentType" "AgentType" NOT NULL,
    "channel" "AgentChannel" NOT NULL,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "totalClicked" INTEGER NOT NULL DEFAULT 0,
    "totalDismissed" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "conversionCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_agent_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_engagement_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "streakScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "socialScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purchaseScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "churnRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lifetimeValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "factors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_engagement_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "integration_settings_category_idx" ON "integration_settings"("category");

-- CreateIndex
CREATE INDEX "integration_settings_provider_idx" ON "integration_settings"("provider");

-- CreateIndex
CREATE INDEX "integration_settings_isActive_idx" ON "integration_settings"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "integration_settings_category_provider_key_key" ON "integration_settings"("category", "provider", "key");

-- CreateIndex
CREATE INDEX "integration_logs_category_idx" ON "integration_logs"("category");

-- CreateIndex
CREATE INDEX "integration_logs_provider_idx" ON "integration_logs"("provider");

-- CreateIndex
CREATE INDEX "integration_logs_action_idx" ON "integration_logs"("action");

-- CreateIndex
CREATE INDEX "integration_logs_createdAt_idx" ON "integration_logs"("createdAt");

-- CreateIndex
CREATE INDEX "ai_agent_events_userId_idx" ON "ai_agent_events"("userId");

-- CreateIndex
CREATE INDEX "ai_agent_events_agentType_idx" ON "ai_agent_events"("agentType");

-- CreateIndex
CREATE INDEX "ai_agent_events_status_idx" ON "ai_agent_events"("status");

-- CreateIndex
CREATE INDEX "ai_agent_events_scheduledAt_idx" ON "ai_agent_events"("scheduledAt");

-- CreateIndex
CREATE INDEX "ai_agent_events_createdAt_idx" ON "ai_agent_events"("createdAt");

-- CreateIndex
CREATE INDEX "ai_agent_rules_agentType_idx" ON "ai_agent_rules"("agentType");

-- CreateIndex
CREATE INDEX "ai_agent_rules_isActive_idx" ON "ai_agent_rules"("isActive");

-- CreateIndex
CREATE INDEX "ai_agent_templates_agentType_idx" ON "ai_agent_templates"("agentType");

-- CreateIndex
CREATE INDEX "ai_agent_templates_channel_idx" ON "ai_agent_templates"("channel");

-- CreateIndex
CREATE INDEX "ai_agent_templates_language_idx" ON "ai_agent_templates"("language");

-- CreateIndex
CREATE UNIQUE INDEX "user_agent_preferences_userId_key" ON "user_agent_preferences"("userId");

-- CreateIndex
CREATE INDEX "ai_agent_analytics_date_idx" ON "ai_agent_analytics"("date");

-- CreateIndex
CREATE INDEX "ai_agent_analytics_agentType_idx" ON "ai_agent_analytics"("agentType");

-- CreateIndex
CREATE UNIQUE INDEX "ai_agent_analytics_date_agentType_channel_key" ON "ai_agent_analytics"("date", "agentType", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "user_engagement_scores_userId_key" ON "user_engagement_scores"("userId");

-- CreateIndex
CREATE INDEX "user_engagement_scores_overallScore_idx" ON "user_engagement_scores"("overallScore");

-- CreateIndex
CREATE INDEX "user_engagement_scores_churnRisk_idx" ON "user_engagement_scores"("churnRisk");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_appleId_key" ON "users"("appleId");

-- CreateIndex
CREATE INDEX "users_googleId_idx" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_appleId_idx" ON "users"("appleId");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- AddForeignKey
ALTER TABLE "integration_settings" ADD CONSTRAINT "integration_settings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_events" ADD CONSTRAINT "ai_agent_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_events" ADD CONSTRAINT "ai_agent_events_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ai_agent_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_agent_preferences" ADD CONSTRAINT "user_agent_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_engagement_scores" ADD CONSTRAINT "user_engagement_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
