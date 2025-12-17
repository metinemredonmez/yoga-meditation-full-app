import { prisma } from '../utils/database';

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDateKey(date: Date): string {
  return startOfDay(date).toISOString();
}

export async function getProgressSummary(userId: string) {
  const checks = await prisma.dailyCheck.findMany({
    where: { userId },
    include: {
      session: {
        select: {
          durationMin: true,
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  let totalMinutes = 0;
  let completedSessions = 0;
  const uniqueDays = new Set<string>();

  for (const check of checks) {
    const key = formatDateKey(check.date);
    uniqueDays.add(key);

    if (check.session?.durationMin) {
      totalMinutes += check.session.durationMin;
      completedSessions += 1;
    }
  }

  const dateKeys = Array.from(uniqueDays).sort((a, b) => (a < b ? 1 : -1));
  const today = startOfDay(new Date());
  let streak = 0;
  let cursor = today;

  const dateSet = new Set(dateKeys);

  while (dateSet.has(cursor.toISOString())) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    totalMinutes,
    completedSessions,
    streak,
  };
}
