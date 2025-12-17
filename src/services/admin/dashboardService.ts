import { prisma } from '../../utils/database';
import { Prisma } from '@prisma/client';

export interface DashboardStats {
  users: { total: number; active: number; new: number; premium: number; byRole: Record<string, number> };
  subscriptions: { active: number; expiringSoon: number; revenue: { daily: number; weekly: number; monthly: number } };
  content: { programs: number; classes: number; poses: number; challenges: number };
  activity: { dailyActiveUsers: number; weeklyActiveUsers: number; sessionsToday: number };
}

export interface DashboardWidget {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { w: number; h: number };
}

const toNumber = (val: Prisma.Decimal | number | null) => {
  if (val === null) return 0;
  if (typeof val === 'number') return val;
  return parseFloat(val.toString());
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, newUsers, usersByRole, activeSubscriptions, programs, classes, poses, challenges, dailyRevenue, weeklyRevenue, monthlyRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.program.count(),
    prisma.class.count(),
    prisma.pose.count(),
    prisma.challenge.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', createdAt: { gte: today } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', createdAt: { gte: weekAgo } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', createdAt: { gte: monthAgo } } }),
  ]);

  const roleMap: Record<string, number> = {};
  usersByRole.forEach((r: { role: string; _count: number }) => { roleMap[r.role] = r._count; });

  return {
    users: { total: totalUsers, active: 0, new: newUsers, premium: activeSubscriptions, byRole: roleMap },
    subscriptions: { active: activeSubscriptions, expiringSoon: 0, revenue: { daily: toNumber(dailyRevenue._sum.amount), weekly: toNumber(weeklyRevenue._sum.amount), monthly: toNumber(monthlyRevenue._sum.amount) } },
    content: { programs, classes, poses, challenges },
    activity: { dailyActiveUsers: 0, weeklyActiveUsers: 0, sessionsToday: 0 },
  };
}

export async function getQuickStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [totalUsers, newUsersToday, activeSubscriptions, revenueToday] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', createdAt: { gte: today } } }),
  ]);
  return {
    totalUsers: { value: totalUsers, change: 0 },
    activeSubscriptions: { value: activeSubscriptions },
    revenue: { value: toNumber(revenueToday._sum.amount), change: 0 },
    sessions: { value: 0, change: 0 },
  };
}

export async function getRecentActivity(limit = 20) {
  const recentUsers = await prisma.user.findMany({ take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } });
  return recentUsers.map(user => ({
    type: 'user_registered',
    message: `New user: ${user.firstName || user.email}`,
    timestamp: user.createdAt,
    data: { userId: user.id },
  }));
}

export async function getDashboardPreference(adminId: string) {
  return prisma.adminDashboardPreference.findUnique({ where: { adminId } });
}

export async function setDashboardPreference(adminId: string, widgets: DashboardWidget[]) {
  return prisma.adminDashboardPreference.upsert({
    where: { adminId },
    update: { widgets: widgets as unknown as Prisma.JsonArray },
    create: { adminId, widgets: widgets as unknown as Prisma.JsonArray },
  });
}

export async function getSystemHealth() {
  let dbStatus = 'healthy';
  try { await prisma.$queryRaw`SELECT 1`; } catch { dbStatus = 'unhealthy'; }
  return { database: dbStatus, maintenance: { active: false }, webhooks: { failedRecent: 0, status: 'healthy' }, overall: dbStatus };
}

export async function getChartData(metric: string, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  if (metric === 'users') {
    const users = await prisma.user.findMany({ where: { createdAt: { gte: startDate } }, select: { createdAt: true } });
    const grouped: Record<string, number> = {};
    users.forEach(u => { const d = u.createdAt.toISOString().split('T')[0]!; grouped[d] = (grouped[d] || 0) + 1; });
    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }
  return [];
}
