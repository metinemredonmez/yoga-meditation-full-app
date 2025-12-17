import { prisma } from '../../utils/database';

export async function getUserAnalytics(options: { startDate?: Date; endDate?: Date }) {
  const { startDate, endDate } = options;
  const where: any = {};
  if (startDate || endDate) { where.createdAt = {}; if (startDate) where.createdAt.gte = startDate; if (endDate) where.createdAt.lte = endDate; }
  const [totalUsers, newUsers, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
  ]);
  return { totalUsers, newUsers, activeUsers, retention: 0, churnRate: 0 };
}

export async function getContentAnalytics(_options: object) {
  const [programs, classes, poses, challenges] = await Promise.all([
    prisma.program.count(),
    prisma.class.count(),
    prisma.pose.count(),
    prisma.challenge.count(),
  ]);
  return { programs, classes, poses, challenges, topPrograms: [], topClasses: [] };
}

export async function getRevenueAnalytics(options: { startDate?: Date; endDate?: Date }) {
  const { startDate, endDate } = options;
  const where: any = { status: 'COMPLETED' };
  if (startDate || endDate) { where.createdAt = {}; if (startDate) where.createdAt.gte = startDate; if (endDate) where.createdAt.lte = endDate; }
  const aggregate = await prisma.payment.aggregate({ where, _sum: { amount: true }, _count: true });
  const toNum = (v: any) => v ? parseFloat(v.toString()) : 0;
  return { totalRevenue: toNum(aggregate._sum.amount), transactionCount: aggregate._count, averageOrderValue: 0, revenueByDay: [] };
}

export async function getEngagementAnalytics(_options: object) {
  return { dailyActiveUsers: 0, weeklyActiveUsers: 0, monthlyActiveUsers: 0, sessionsPerUser: 0, avgSessionDuration: 0 };
}

export async function getRealTimeStats() {
  const [activeUsers, recentSignups] = await Promise.all([
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);
  return { activeUsers, recentSignups, ongoingSessions: 0, recentPayments: 0 };
}

export async function getGrowthTrends(period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  const days = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const users = await prisma.user.findMany({ where: { createdAt: { gte: startDate } }, select: { createdAt: true } });
  const grouped: Record<string, number> = {};
  users.forEach(u => { const d = u.createdAt.toISOString().split('T')[0]!; grouped[d] = (grouped[d] || 0) + 1; });
  return { userGrowth: Object.entries(grouped).map(([date, count]) => ({ date, count })), revenueGrowth: [], subscriptionGrowth: [] };
}

export async function getChallengeAnalytics(_options: object) {
  const [totalChallenges, activeEnrollments] = await Promise.all([
    prisma.challenge.count(),
    prisma.challengeEnrollment.count(),
  ]);
  return { totalChallenges, activeEnrollments, completionRate: 0, topChallenges: [] };
}

export async function getRetentionAnalytics(_options: object) {
  return { day1: 0, day7: 0, day30: 0, cohorts: [] };
}
