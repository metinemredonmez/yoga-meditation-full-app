import { prisma } from '../../utils/database';
import { SettingType, SettingCategory, Prisma } from '@prisma/client';
import { HttpError } from '../../middleware/errorHandler';

// ============================================
// System Settings
// ============================================

export async function getSettings(category?: SettingCategory) {
  const where: Prisma.system_settingsWhereInput = category ? { category } : {};

  return prisma.system_settings.findMany({
    where,
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
    include: {
      users: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}

export async function getSetting(key: string) {
  const setting = await prisma.system_settings.findUnique({
    where: { key },
    include: {
      users: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (!setting) throw new HttpError(404, 'Setting not found');
  return setting;
}

export async function getSettingValue<T>(key: string, defaultValue: T): Promise<T> {
  const setting = await prisma.system_settings.findUnique({
    where: { key },
  });

  if (!setting) return defaultValue;

  try {
    // value is already Json type
    const val = setting.value;
    if (val === null) return defaultValue;
    return val as T;
  } catch {
    return defaultValue;
  }
}

export async function setSetting(
  key: string,
  value: unknown,
  adminId: string,
  options?: {
    type?: SettingType;
    category?: SettingCategory;
    description?: string;
    isPublic?: boolean;
  },
) {
  const existing = await prisma.system_settings.findUnique({ where: { key } });

  if (existing) {
    return prisma.system_settings.update({
      where: { key },
      data: {
        value: value as Prisma.InputJsonValue,
        updatedById: adminId,
        ...(options?.description && { description: options.description }),
      },
    });
  }

  return prisma.system_settings.create({
    data: {
      key,
      value: value as Prisma.InputJsonValue,
      type: options?.type || 'STRING',
      category: options?.category || 'GENERAL',
      description: options?.description,
      isPublic: options?.isPublic ?? false,
      updatedById: adminId,
    },
  });
}

export async function deleteSetting(key: string) {
  const setting = await prisma.system_settings.findUnique({ where: { key } });
  if (!setting) throw new HttpError(404, 'Setting not found');

  await prisma.system_settings.delete({ where: { key } });
  return { deleted: true };
}

export async function getPublicSettings() {
  return prisma.system_settings.findMany({
    where: { isPublic: true },
    select: { key: true, value: true, type: true },
  });
}

// ============================================
// Feature Flags
// ============================================

export async function getFeatureFlags(includeInactive = false) {
  const where: Prisma.feature_flagsWhereInput = includeInactive ? {} : { isEnabled: true };

  return prisma.feature_flags.findMany({
    where,
    orderBy: { key: 'asc' },
    include: {
      users: { select: { firstName: true, lastName: true, email: true } },
    },
  });
}

export async function getFeatureFlag(key: string) {
  const flag = await prisma.feature_flags.findUnique({
    where: { key },
    include: {
      users: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (!flag) throw new HttpError(404, 'Feature flag not found');
  return flag;
}

export async function isFeatureEnabled(key: string, userId?: string): Promise<boolean> {
  const flag = await prisma.feature_flags.findUnique({ where: { key } });
  if (!flag || !flag.isEnabled) return false;

  // Check user allowlist
  if (userId && flag.allowedUserIds?.includes(userId)) return true;

  // Check rollout percentage
  if (flag.rolloutPercentage !== null && flag.rolloutPercentage < 100) {
    if (!userId) return false;
    // Deterministic rollout based on userId hash
    const hash = simpleHash(userId + key);
    return (hash % 100) < flag.rolloutPercentage;
  }

  return true;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export async function createFeatureFlag(
  adminId: string,
  data: {
    key: string;
    name?: string;
    description?: string;
    isEnabled?: boolean;
    rolloutPercentage?: number;
    allowedUserIds?: string[];
    metadata?: object;
  },
) {
  const existing = await prisma.feature_flags.findUnique({ where: { key: data.key } });
  if (existing) throw new HttpError(400, 'Feature flag already exists');

  return prisma.feature_flags.create({
    data: {
      key: data.key,
      name: data.name || data.key,
      description: data.description,
      isEnabled: data.isEnabled ?? false,
      rolloutPercentage: data.rolloutPercentage ?? 0,
      allowedUserIds: data.allowedUserIds,
      metadata: data.metadata ? (data.metadata as Prisma.JsonObject) : undefined,
      updatedById: adminId,
    },
  });
}

export async function updateFeatureFlag(
  key: string,
  adminId: string,
  data: Partial<{
    name: string;
    description: string;
    isEnabled: boolean;
    rolloutPercentage: number;
    allowedUserIds: string[];
    metadata: object;
  }>,
) {
  const flag = await prisma.feature_flags.findUnique({ where: { key } });
  if (!flag) throw new HttpError(404, 'Feature flag not found');

  return prisma.feature_flags.update({
    where: { key },
    data: {
      ...data,
      metadata: data.metadata ? (data.metadata as Prisma.JsonObject) : undefined,
      updatedById: adminId,
    },
  });
}

export async function toggleFeatureFlag(key: string, adminId: string) {
  const flag = await prisma.feature_flags.findUnique({ where: { key } });
  if (!flag) throw new HttpError(404, 'Feature flag not found');

  return prisma.feature_flags.update({
    where: { key },
    data: {
      isEnabled: !flag.isEnabled,
      updatedById: adminId,
    },
  });
}

export async function deleteFeatureFlag(key: string) {
  const flag = await prisma.feature_flags.findUnique({ where: { key } });
  if (!flag) throw new HttpError(404, 'Feature flag not found');

  await prisma.feature_flags.delete({ where: { key } });
  return { deleted: true };
}

// ============================================
// Seed Default Settings
// ============================================

export async function seedDefaultSettings(adminId: string) {
  const defaultSettings = [
    { key: 'app.name', value: 'Yoga App', type: 'STRING' as SettingType, category: 'GENERAL' as SettingCategory, description: 'Application name', isPublic: true },
    { key: 'app.version', value: '1.0.0', type: 'STRING' as SettingType, category: 'GENERAL' as SettingCategory, description: 'Current app version', isPublic: true },
    { key: 'app.maintenance_mode', value: false, type: 'BOOLEAN' as SettingType, category: 'MAINTENANCE' as SettingCategory, description: 'Enable maintenance mode' },
    { key: 'users.max_sessions', value: 5, type: 'NUMBER' as SettingType, category: 'LIMITS' as SettingCategory, description: 'Max concurrent sessions per user' },
    { key: 'users.session_timeout', value: 3600, type: 'NUMBER' as SettingType, category: 'SECURITY' as SettingCategory, description: 'Session timeout in seconds' },
    { key: 'payments.currency', value: 'USD', type: 'STRING' as SettingType, category: 'PAYMENTS' as SettingCategory, description: 'Default currency', isPublic: true },
    { key: 'payments.tax_rate', value: 0, type: 'NUMBER' as SettingType, category: 'PAYMENTS' as SettingCategory, description: 'Tax rate percentage' },
    { key: 'notifications.email_enabled', value: true, type: 'BOOLEAN' as SettingType, category: 'NOTIFICATIONS' as SettingCategory, description: 'Enable email notifications' },
    { key: 'notifications.push_enabled', value: true, type: 'BOOLEAN' as SettingType, category: 'NOTIFICATIONS' as SettingCategory, description: 'Enable push notifications' },
    { key: 'content.default_language', value: 'en', type: 'STRING' as SettingType, category: 'GENERAL' as SettingCategory, description: 'Default content language', isPublic: true },
    { key: 'trial.duration_days', value: 7, type: 'NUMBER' as SettingType, category: 'FEATURES' as SettingCategory, description: 'Trial period in days' },
    { key: 'security.password_min_length', value: 8, type: 'NUMBER' as SettingType, category: 'SECURITY' as SettingCategory, description: 'Minimum password length' },
    { key: 'security.2fa_enabled', value: false, type: 'BOOLEAN' as SettingType, category: 'SECURITY' as SettingCategory, description: 'Enable two-factor authentication' },
  ];

  const results = [];
  for (const setting of defaultSettings) {
    const existing = await prisma.system_settings.findUnique({ where: { key: setting.key } });
    if (!existing) {
      await prisma.system_settings.create({
        data: {
          key: setting.key,
          value: setting.value as Prisma.InputJsonValue,
          type: setting.type,
          category: setting.category,
          description: setting.description,
          isPublic: setting.isPublic ?? false,
          updatedById: adminId,
        },
      });
      results.push({ key: setting.key, action: 'created' });
    } else {
      results.push({ key: setting.key, action: 'skipped' });
    }
  }

  return results;
}

export async function seedDefaultFeatureFlags(adminId: string) {
  const defaultFlags = [
    { key: 'mood_tracking_feature', name: 'Mood Tracking', description: 'Enable mood tracking for users', isEnabled: true },
    { key: 'dark_mode_feature', name: 'Dark Mode', description: 'Enable dark mode UI', isEnabled: true },
    { key: 'social_login_feature', name: 'Social Login', description: 'Enable social login (Google, Apple)', isEnabled: true },
    { key: 'offline_mode_feature', name: 'Offline Mode', description: 'Enable offline content access', isEnabled: false },
    { key: 'ai_recommendations_feature', name: 'AI Recommendations', description: 'AI-powered class recommendations', isEnabled: false, rolloutPercentage: 0 },
    { key: 'live_classes_feature', name: 'Live Classes', description: 'Enable live streaming classes', isEnabled: false },
    { key: 'community_features', name: 'Community', description: 'Enable community features (forums, comments)', isEnabled: true },
    { key: 'advanced_analytics_feature', name: 'Advanced Analytics', description: 'Show advanced user analytics', isEnabled: true },
    { key: 'beta_features', name: 'Beta Features', description: 'Enable beta features for testing', isEnabled: false, rolloutPercentage: 10 },
    { key: 'push_notifications_feature', name: 'Push Notifications', description: 'Enable push notifications', isEnabled: true },
    { key: 'workout_reminders_feature', name: 'Workout Reminders', description: 'Enable workout reminder notifications', isEnabled: true },
    { key: 'streak_tracking_feature', name: 'Streak Tracking', description: 'Enable streak tracking for users', isEnabled: true },
  ];

  const results = [];
  for (const flag of defaultFlags) {
    const existing = await prisma.feature_flags.findUnique({ where: { key: flag.key } });
    if (!existing) {
      await prisma.feature_flags.create({
        data: {
          key: flag.key,
          name: flag.name,
          description: flag.description,
          isEnabled: flag.isEnabled,
          rolloutPercentage: flag.rolloutPercentage ?? 0,
          updatedById: adminId,
        },
      });
      results.push({ key: flag.key, action: 'created' });
    } else {
      results.push({ key: flag.key, action: 'skipped' });
    }
  }

  return results;
}
