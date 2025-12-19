/*
  Warnings:

  - You are about to drop the `community_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `daily_rewards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `direct_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_post_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_topic_followers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_topic_tags` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `forum_topics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_post_comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_post_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `leaderboard_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `social_shares` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_daily_rewards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_follows` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_levels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_quests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `xp_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "community_groups" DROP CONSTRAINT "community_groups_createdById_fkey";

-- DropForeignKey
ALTER TABLE "content_reports" DROP CONSTRAINT "content_reports_postId_fkey";

-- DropForeignKey
ALTER TABLE "content_reports" DROP CONSTRAINT "content_reports_topicId_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_participant1Id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_participant2Id_fkey";

-- DropForeignKey
ALTER TABLE "direct_messages" DROP CONSTRAINT "direct_messages_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "direct_messages" DROP CONSTRAINT "direct_messages_senderId_fkey";

-- DropForeignKey
ALTER TABLE "forum_categories" DROP CONSTRAINT "forum_categories_parentId_fkey";

-- DropForeignKey
ALTER TABLE "forum_post_likes" DROP CONSTRAINT "forum_post_likes_postId_fkey";

-- DropForeignKey
ALTER TABLE "forum_post_likes" DROP CONSTRAINT "forum_post_likes_userId_fkey";

-- DropForeignKey
ALTER TABLE "forum_posts" DROP CONSTRAINT "forum_posts_authorId_fkey";

-- DropForeignKey
ALTER TABLE "forum_posts" DROP CONSTRAINT "forum_posts_parentId_fkey";

-- DropForeignKey
ALTER TABLE "forum_posts" DROP CONSTRAINT "forum_posts_topicId_fkey";

-- DropForeignKey
ALTER TABLE "forum_topic_followers" DROP CONSTRAINT "forum_topic_followers_topicId_fkey";

-- DropForeignKey
ALTER TABLE "forum_topic_followers" DROP CONSTRAINT "forum_topic_followers_userId_fkey";

-- DropForeignKey
ALTER TABLE "forum_topic_tags" DROP CONSTRAINT "forum_topic_tags_tagId_fkey";

-- DropForeignKey
ALTER TABLE "forum_topic_tags" DROP CONSTRAINT "forum_topic_tags_topicId_fkey";

-- DropForeignKey
ALTER TABLE "forum_topics" DROP CONSTRAINT "forum_topics_authorId_fkey";

-- DropForeignKey
ALTER TABLE "forum_topics" DROP CONSTRAINT "forum_topics_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "forum_topics" DROP CONSTRAINT "forum_topics_lastReplyById_fkey";

-- DropForeignKey
ALTER TABLE "group_members" DROP CONSTRAINT "group_members_groupId_fkey";

-- DropForeignKey
ALTER TABLE "group_members" DROP CONSTRAINT "group_members_userId_fkey";

-- DropForeignKey
ALTER TABLE "group_post_comments" DROP CONSTRAINT "group_post_comments_authorId_fkey";

-- DropForeignKey
ALTER TABLE "group_post_comments" DROP CONSTRAINT "group_post_comments_parentId_fkey";

-- DropForeignKey
ALTER TABLE "group_post_comments" DROP CONSTRAINT "group_post_comments_postId_fkey";

-- DropForeignKey
ALTER TABLE "group_post_likes" DROP CONSTRAINT "group_post_likes_postId_fkey";

-- DropForeignKey
ALTER TABLE "group_post_likes" DROP CONSTRAINT "group_post_likes_userId_fkey";

-- DropForeignKey
ALTER TABLE "group_posts" DROP CONSTRAINT "group_posts_authorId_fkey";

-- DropForeignKey
ALTER TABLE "group_posts" DROP CONSTRAINT "group_posts_groupId_fkey";

-- DropForeignKey
ALTER TABLE "leaderboard_entries" DROP CONSTRAINT "leaderboard_entries_userId_fkey";

-- DropForeignKey
ALTER TABLE "social_shares" DROP CONSTRAINT "social_shares_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_daily_rewards" DROP CONSTRAINT "user_daily_rewards_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_follows" DROP CONSTRAINT "user_follows_followerId_fkey";

-- DropForeignKey
ALTER TABLE "user_follows" DROP CONSTRAINT "user_follows_followingId_fkey";

-- DropForeignKey
ALTER TABLE "user_levels" DROP CONSTRAINT "user_levels_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_quests" DROP CONSTRAINT "user_quests_questId_fkey";

-- DropForeignKey
ALTER TABLE "user_quests" DROP CONSTRAINT "user_quests_userId_fkey";

-- DropForeignKey
ALTER TABLE "xp_transactions" DROP CONSTRAINT "xp_transactions_userId_fkey";

-- DropTable
DROP TABLE "community_groups";

-- DropTable
DROP TABLE "conversations";

-- DropTable
DROP TABLE "daily_rewards";

-- DropTable
DROP TABLE "direct_messages";

-- DropTable
DROP TABLE "forum_categories";

-- DropTable
DROP TABLE "forum_post_likes";

-- DropTable
DROP TABLE "forum_posts";

-- DropTable
DROP TABLE "forum_tags";

-- DropTable
DROP TABLE "forum_topic_followers";

-- DropTable
DROP TABLE "forum_topic_tags";

-- DropTable
DROP TABLE "forum_topics";

-- DropTable
DROP TABLE "group_members";

-- DropTable
DROP TABLE "group_post_comments";

-- DropTable
DROP TABLE "group_post_likes";

-- DropTable
DROP TABLE "group_posts";

-- DropTable
DROP TABLE "leaderboard_entries";

-- DropTable
DROP TABLE "quests";

-- DropTable
DROP TABLE "social_shares";

-- DropTable
DROP TABLE "user_daily_rewards";

-- DropTable
DROP TABLE "user_follows";

-- DropTable
DROP TABLE "user_levels";

-- DropTable
DROP TABLE "user_quests";

-- DropTable
DROP TABLE "xp_transactions";

-- DropEnum
DROP TYPE "DailyBonusType";

-- DropEnum
DROP TYPE "GroupRole";

-- DropEnum
DROP TYPE "LeaderboardPeriod";

-- DropEnum
DROP TYPE "QuestRequirementType";

-- DropEnum
DROP TYPE "QuestResetPeriod";

-- DropEnum
DROP TYPE "QuestType";

-- DropEnum
DROP TYPE "ShareType";

-- DropEnum
DROP TYPE "SocialPlatform";

-- DropEnum
DROP TYPE "XPSource";

-- DropEnum
DROP TYPE "XPTransactionType";
