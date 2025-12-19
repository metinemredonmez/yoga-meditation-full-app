import { prisma } from '../utils/database';
import type { ReminderType } from '@prisma/client';
import type {
  CreateUserReminderInput,
  UpdateUserReminderInput,
  UserReminderFilters,
} from '../validation/userReminderSchemas';

// ==================== USER REMINDERS ====================

export async function getReminders(userId: string, filters: UserReminderFilters) {
  const { type, isEnabled, page, limit } = filters;

  const where: any = { userId };
  if (type) where.type = type;
  if (isEnabled !== undefined) where.isEnabled = isEnabled;

  const [reminders, total] = await Promise.all([
    prisma.user_reminders.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isEnabled: 'desc' }, { time: 'asc' }],
    }),
    prisma.user_reminders.count({ where }),
  ]);

  return {
    reminders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getReminder(userId: string, id: string) {
  return prisma.user_reminders.findFirst({
    where: { id, userId },
  });
}

export async function createReminder(userId: string, input: CreateUserReminderInput) {
  return prisma.user_reminders.create({
    data: {
      userId,
      type: input.type as ReminderType,
      title: input.title,
      message: input.message,
      time: input.time,
      days: input.days,
      timezone: input.timezone,
      isEnabled: input.isEnabled,
      soundEnabled: input.soundEnabled,
      vibrationEnabled: input.vibrationEnabled,
    },
  });
}

export async function updateReminder(userId: string, id: string, input: UpdateUserReminderInput) {
  const existing = await prisma.user_reminders.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Reminder not found');
  }

  return prisma.user_reminders.update({
    where: { id },
    data: {
      ...input,
      type: input.type as ReminderType | undefined,
    },
  });
}

export async function deleteReminder(userId: string, id: string) {
  const existing = await prisma.user_reminders.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Reminder not found');
  }

  return prisma.user_reminders.delete({
    where: { id },
  });
}

export async function toggleReminder(userId: string, id: string) {
  const existing = await prisma.user_reminders.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error('Reminder not found');
  }

  return prisma.user_reminders.update({
    where: { id },
    data: { isEnabled: !existing.isEnabled },
  });
}

// ==================== TEMPLATES ====================

export function getReminderTemplates() {
  return [
    {
      type: 'MORNING',
      title: 'Sabah Meditasyonu',
      titleEn: 'Morning Meditation',
      message: 'Güne huzurlu başla 🧘',
      messageEn: 'Start your day peacefully 🧘',
      time: '07:00',
      icon: '🌅',
    },
    {
      type: 'EVENING',
      title: 'Akşam Gevşeme',
      titleEn: 'Evening Relaxation',
      message: 'Günün stresini bırak 🌙',
      messageEn: 'Release the stress of the day 🌙',
      time: '21:00',
      icon: '🌙',
    },
    {
      type: 'MOOD',
      title: 'Mood Takibi',
      titleEn: 'Mood Tracking',
      message: 'Bugün nasıl hissediyorsun? 😊',
      messageEn: 'How are you feeling today? 😊',
      time: '20:00',
      icon: '😊',
    },
    {
      type: 'JOURNAL',
      title: 'Günlük Yazma',
      titleEn: 'Journal Writing',
      message: 'Düşüncelerini yaz ✍️',
      messageEn: 'Write your thoughts ✍️',
      time: '21:30',
      icon: '📝',
    },
    {
      type: 'HYDRATION',
      title: 'Su İç',
      titleEn: 'Drink Water',
      message: 'Su içmeyi unutma 💧',
      messageEn: "Don't forget to drink water 💧",
      time: '10:00',
      icon: '💧',
    },
    {
      type: 'POSTURE',
      title: 'Duruş Kontrolü',
      titleEn: 'Posture Check',
      message: 'Duruşunu düzelt 🧍',
      messageEn: 'Check your posture 🧍',
      time: '14:00',
      icon: '🧍',
    },
    {
      type: 'BREAK',
      title: 'Mola Ver',
      titleEn: 'Take a Break',
      message: 'Kısa bir mola zamanı ☕',
      messageEn: 'Time for a short break ☕',
      time: '15:00',
      icon: '☕',
    },
    {
      type: 'BEDTIME',
      title: 'Yatma Vakti',
      titleEn: 'Bedtime',
      message: 'Uyku vakti yaklaşıyor 💤',
      messageEn: 'Bedtime is approaching 💤',
      time: '22:30',
      icon: '💤',
    },
  ];
}

// ==================== REMINDER CHECK (for cron job) ====================

export async function getDueReminders(currentTime: string, currentDay: string) {
  return prisma.user_reminders.findMany({
    where: {
      isEnabled: true,
      time: currentTime,
      OR: [
        { days: { has: currentDay } },
        { days: { has: 'EVERYDAY' } },
      ],
    },
    include: {
      user: {
        select: { id: true, email: true, firstName: true },
      },
    },
  });
}

export async function updateLastTriggered(id: string) {
  return prisma.user_reminders.update({
    where: { id },
    data: { lastTriggeredAt: new Date() },
  });
}
