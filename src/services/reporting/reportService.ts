import { PrismaClient, DateRangeType, Prisma } from '@prisma/client';
import { getReportDefinition, getReportDefinitionBySlug } from './reportDefinitionService';

const prisma = new PrismaClient();

// Date range calculation helpers
const getDateRange = (
  dateRangeType: DateRangeType,
  customFrom?: Date,
  customTo?: Date
): { from: Date; to: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (dateRangeType) {
    case 'TODAY':
      return { from: today, to: now };
    case 'YESTERDAY':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: yesterday, to: today };
    case 'LAST_7_DAYS':
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      return { from: last7, to: now };
    case 'LAST_30_DAYS':
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 30);
      return { from: last30, to: now };
    case 'LAST_90_DAYS':
      const last90 = new Date(today);
      last90.setDate(last90.getDate() - 90);
      return { from: last90, to: now };
    case 'THIS_MONTH':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
    case 'LAST_MONTH':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: lastMonthStart, to: lastMonthEnd };
    case 'THIS_QUARTER':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return { from: quarterStart, to: now };
    case 'LAST_QUARTER':
      const lastQuarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0);
      const lastQuarterStart = new Date(lastQuarterEnd.getFullYear(), lastQuarterEnd.getMonth() - 2, 1);
      return { from: lastQuarterStart, to: lastQuarterEnd };
    case 'THIS_YEAR':
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
    case 'LAST_YEAR':
      return {
        from: new Date(now.getFullYear() - 1, 0, 1),
        to: new Date(now.getFullYear() - 1, 11, 31)
      };
    case 'CUSTOM':
      if (!customFrom || !customTo) {
        throw new Error('Custom date range requires from and to dates');
      }
      return { from: customFrom, to: customTo };
    case 'ALL_TIME':
    default:
      return { from: new Date(0), to: now };
  }
};

// Generate report based on definition
export interface ReportConfig {
  filters?: Record<string, unknown>;
  columns?: string[];
  dateRangeType?: DateRangeType;
  dateFrom?: Date;
  dateTo?: Date;
  groupBy?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const generateReport = async (
  definitionIdOrSlug: string,
  config: ReportConfig
) => {
  // Get definition
  let definition = await getReportDefinition(definitionIdOrSlug);
  if (!definition) {
    definition = await getReportDefinitionBySlug(definitionIdOrSlug);
  }
  if (!definition) {
    throw new Error('Report definition not found');
  }

  const startTime = Date.now();
  const dateRange = config.dateRangeType
    ? getDateRange(config.dateRangeType, config.dateFrom, config.dateTo)
    : getDateRange('LAST_30_DAYS');

  // Execute query based on data source
  const data = await executeQuery(definition.dataSource, {
    filters: config.filters || {},
    dateRange,
    columns: config.columns || definition.defaultColumns,
    groupBy: config.groupBy || [],
    sortBy: config.sortBy || definition.defaultSortBy || undefined,
    sortOrder: config.sortOrder || (definition.defaultSortOrder as 'asc' | 'desc') || 'desc',
    page: config.page || 1,
    limit: config.limit || 100,
  });

  const executionTime = Date.now() - startTime;

  return {
    definition,
    data: data.rows,
    totalCount: data.totalCount,
    page: config.page || 1,
    limit: config.limit || 100,
    executionTime,
    dateRange,
  };
};

// Execute query based on data source
const executeQuery = async (
  dataSource: string,
  options: {
    filters: Record<string, unknown>;
    dateRange: { from: Date; to: Date };
    columns: string[];
    groupBy: string[];
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
    page: number;
    limit: number;
  }
): Promise<{ rows: unknown[]; totalCount: number }> => {
  const skip = (options.page - 1) * options.limit;

  switch (dataSource) {
    case 'users':
      return queryUsers(options);
    case 'user_growth':
      return queryUserGrowth(options);
    case 'revenue':
      return queryRevenue(options);
    case 'payments':
      return queryPayments(options);
    case 'subscriptions':
      return querySubscriptions(options);
    case 'content_stats':
      return queryContentStats(options);
    case 'instructor_performance':
      return queryInstructorPerformance(options);
    default:
      throw new Error(`Unknown data source: ${dataSource}`);
  }
};

// Query implementations
const queryUsers = async (options: {
  filters: Record<string, unknown>;
  dateRange: { from: Date; to: Date };
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}) => {
  const where: Prisma.usersWhereInput = {
    createdAt: {
      gte: options.dateRange.from,
      lte: options.dateRange.to,
    },
  };

  if (options.filters.role) {
    where.role = options.filters.role as Prisma.EnumUserRoleFilter;
  }
  if (options.filters.search) {
    const search = options.filters.search as string;
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [rows, totalCount] = await Promise.all([
    prisma.users.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        subscriptionTier: true,
        createdAt: true,
      },
      orderBy: options.sortBy
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.users.count({ where }),
  ]);

  return {
    rows: rows.map(u => ({
      ...u,
      name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
      subscriptionStatus: u.subscriptionTier,
    })),
    totalCount,
  };
};

const queryUserGrowth = async (options: {
  dateRange: { from: Date; to: Date };
}) => {
  // Group users by date
  const users = await prisma.users.findMany({
    where: {
      createdAt: {
        gte: options.dateRange.from,
        lte: options.dateRange.to,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Aggregate by date
  const growthMap = new Map<string, number>();
  let cumulative = 0;

  // Get initial count before date range
  const initialCount = await prisma.users.count({
    where: { createdAt: { lt: options.dateRange.from } },
  });
  cumulative = initialCount;

  users.forEach(user => {
    const dateKey = user.createdAt.toISOString().split('T')[0]!;
    growthMap.set(dateKey, (growthMap.get(dateKey) || 0) + 1);
  });

  const rows: { date: string; newUsers: number; totalUsers: number }[] = [];
  for (const [date, newUsers] of growthMap) {
    cumulative += newUsers;
    rows.push({ date, newUsers, totalUsers: cumulative });
  }

  return { rows, totalCount: rows.length };
};

const queryRevenue = async (options: {
  filters: Record<string, unknown>;
  dateRange: { from: Date; to: Date };
}) => {
  const payments = await prisma.payments.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: {
        gte: options.dateRange.from,
        lte: options.dateRange.to,
      },
    },
    select: {
      amount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Aggregate by date
  const revenueMap = new Map<string, { revenue: number; transactions: number }>();

  payments.forEach(payment => {
    const dateKey = payment.createdAt.toISOString().split('T')[0]!;
    const existing = revenueMap.get(dateKey) || { revenue: 0, transactions: 0 };
    existing.revenue += Number(payment.amount);
    existing.transactions += 1;
    revenueMap.set(dateKey, existing);
  });

  const rows = Array.from(revenueMap).map(([date, data]) => ({
    date,
    revenue: data.revenue / 100, // Convert from cents
    transactions: data.transactions,
  }));

  return { rows, totalCount: rows.length };
};

const queryPayments = async (options: {
  filters: Record<string, unknown>;
  dateRange: { from: Date; to: Date };
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}) => {
  const where: Prisma.paymentsWhereInput = {
    createdAt: {
      gte: options.dateRange.from,
      lte: options.dateRange.to,
    },
  };

  if (options.filters.status) {
    where.status = options.filters.status as Prisma.EnumPaymentStatusFilter;
  }

  const [rows, totalCount] = await Promise.all([
    prisma.payments.findMany({
      where,
      select: {
        id: true,
        userId: true,
        amount: true,
        currency: true,
        status: true,
        provider: true,
        createdAt: true,
      },
      orderBy: options.sortBy
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.payments.count({ where }),
  ]);

  return {
    rows: rows.map(p => ({
      ...p,
      amount: Number(p.amount) / 100, // Convert from cents
      paymentMethod: p.provider,
    })),
    totalCount,
  };
};

const querySubscriptions = async (options: {
  filters: Record<string, unknown>;
  dateRange: { from: Date; to: Date };
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}) => {
  const where: Prisma.subscriptionsWhereInput = {
    createdAt: {
      gte: options.dateRange.from,
      lte: options.dateRange.to,
    },
  };

  if (options.filters.status) {
    where.status = options.filters.status as Prisma.EnumSubscriptionStatusFilter;
  }

  const [rows, totalCount] = await Promise.all([
    prisma.subscriptions.findMany({
      where,
      select: {
        id: true,
        userId: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        plan: {
          select: {
            tier: true,
            name: true,
          },
        },
      },
      orderBy: options.sortBy
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    }),
    prisma.subscriptions.count({ where }),
  ]);

  return {
    rows: rows.map(s => ({
      ...s,
      tier: s.plan.tier,
      planName: s.plan.name,
      startDate: s.currentPeriodStart,
      endDate: s.currentPeriodEnd,
    })),
    totalCount,
  };
};

const queryContentStats = async (options: {
  filters: Record<string, unknown>;
  dateRange: { from: Date; to: Date };
  page: number;
  limit: number;
}) => {
  const programs = await prisma.programs.findMany({
    select: {
      id: true,
      title: true,
      _count: {
        select: {
          sessions: true,
        },
      },
    },
    skip: (options.page - 1) * options.limit,
    take: options.limit,
  });

  const rows = programs.map(p => ({
    id: p.id,
    title: p.title,
    type: 'program',
    views: 0, // Would need view tracking
    completions: 0, // Would need progress tracking
    rating: 0, // Would need rating system
  }));

  const totalCount = await prisma.programs.count();

  return { rows, totalCount };
};

const queryInstructorPerformance = async (options: {
  filters: Record<string, unknown>;
  dateRange: { from: Date; to: Date };
  page: number;
  limit: number;
}) => {
  const instructors = await prisma.instructor_profiles.findMany({
    include: {
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      _count: {
        select: {
          live_streams: true,
          meditations: true,
        },
      },
    },
    skip: (options.page - 1) * options.limit,
    take: options.limit,
  });

  const rows = instructors.map(i => ({
    instructorId: i.userId,
    name: [i.users.firstName, i.users.lastName].filter(Boolean).join(' ') || i.users.email,
    classes: i._count.live_streams + i._count.meditations,
    students: 0, // Would need enrollment tracking
    rating: Number(i.averageRating) || 0,
    revenue: 0, // Would need revenue tracking per instructor
  }));

  const totalCount = await prisma.instructor_profiles.count();

  return { rows, totalCount };
};

// Create report instance
export const createReportInstance = async (
  definitionId: string,
  config: ReportConfig,
  userId: string
) => {
  return prisma.report_instances.create({
    data: {
      definitionId,
      filters: config.filters as Prisma.InputJsonValue || {},
      columns: config.columns || [],
      sortBy: config.sortBy,
      sortOrder: config.sortOrder,
      groupBy: config.groupBy || [],
      dateRangeType: config.dateRangeType || 'LAST_30_DAYS',
      dateFrom: config.dateFrom,
      dateTo: config.dateTo,
      createdById: userId,
    },
    include: {
      report_definitions: true,
    },
  });
};

// Get report instance
export const getReportInstance = async (id: string) => {
  return prisma.report_instances.findUnique({
    where: { id },
    include: {
      report_definitions: true,
      report_exports: true,
    },
  });
};

// Get user's report instances
export const getUserReportInstances = async (userId: string) => {
  return prisma.report_instances.findMany({
    where: { createdById: userId },
    include: {
      report_definitions: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Delete report instance
export const deleteReportInstance = async (id: string) => {
  return prisma.report_instances.delete({
    where: { id },
  });
};

// Refresh report instance (regenerate data)
export const refreshReportInstance = async (id: string) => {
  const instance = await prisma.report_instances.findUnique({
    where: { id },
    include: { report_definitions: true },
  });

  if (!instance) {
    throw new Error('Report instance not found');
  }

  const reportData = await generateReport(instance.definitionId, {
    filters: instance.filters as Record<string, unknown>,
    columns: instance.columns,
    dateRangeType: instance.dateRangeType,
    dateFrom: instance.dateFrom || undefined,
    dateTo: instance.dateTo || undefined,
    groupBy: instance.groupBy,
    sortBy: instance.sortBy || undefined,
    sortOrder: instance.sortOrder as 'asc' | 'desc' | undefined,
  });

  // Update cache
  await prisma.report_instances.update({
    where: { id },
    data: {
      cachedData: reportData.data as Prisma.InputJsonValue,
      cachedAt: new Date(),
      cacheExpiresAt: new Date(Date.now() + 3600000), // 1 hour
      rowCount: reportData.totalCount,
      executionTime: reportData.executionTime,
    },
  });

  return reportData;
};

// Cache management
export const cacheReportData = async (
  instanceId: string,
  data: unknown[],
  executionTime: number
) => {
  return prisma.report_instances.update({
    where: { id: instanceId },
    data: {
      cachedData: data as Prisma.InputJsonValue,
      cachedAt: new Date(),
      cacheExpiresAt: new Date(Date.now() + 3600000), // 1 hour
      rowCount: data.length,
      executionTime,
    },
  });
};

export const getCachedData = async (instanceId: string) => {
  const instance = await prisma.report_instances.findUnique({
    where: { id: instanceId },
    select: {
      cachedData: true,
      cachedAt: true,
      cacheExpiresAt: true,
    },
  });

  if (!instance || !instance.cachedData || !instance.cacheExpiresAt) {
    return null;
  }

  if (new Date() > instance.cacheExpiresAt) {
    return null; // Cache expired
  }

  return instance.cachedData;
};

export const invalidateCache = async (instanceId: string) => {
  return prisma.report_instances.update({
    where: { id: instanceId },
    data: {
      cachedData: Prisma.JsonNull,
      cachedAt: null,
      cacheExpiresAt: null,
    },
  });
};
