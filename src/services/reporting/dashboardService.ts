import { PrismaClient, WidgetType, Prisma } from '@prisma/client';
import { getRealtimeStats, getOverviewDashboard } from './analyticsService';

const prisma = new PrismaClient();

// Get all widgets
export const getWidgets = async () => {
  return prisma.dashboardWidget.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
};

// Get single widget
export const getWidget = async (id: string) => {
  return prisma.dashboardWidget.findUnique({
    where: { id },
  });
};

// Create widget
export const createWidget = async (data: {
  name: string;
  description?: string;
  type: WidgetType;
  dataSource: string;
  query?: Prisma.InputJsonValue;
  chartType?: string;
  chartConfig?: Prisma.InputJsonValue;
  refreshInterval?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  isDefault?: boolean;
}) => {
  return prisma.dashboardWidget.create({
    data,
  });
};

// Update widget
export const updateWidget = async (
  id: string,
  data: Partial<{
    name: string;
    description: string;
    dataSource: string;
    query: Prisma.InputJsonValue;
    chartType: string;
    chartConfig: Prisma.InputJsonValue;
    refreshInterval: number;
    defaultWidth: number;
    defaultHeight: number;
    isActive: boolean;
    isDefault: boolean;
  }>
) => {
  return prisma.dashboardWidget.update({
    where: { id },
    data,
  });
};

// Delete widget
export const deleteWidget = async (id: string) => {
  // First remove all user placements
  await prisma.userDashboardWidget.deleteMany({
    where: { widgetId: id },
  });

  return prisma.dashboardWidget.delete({
    where: { id },
  });
};

// Get widget data
export const getWidgetData = async (
  widgetId: string,
  params?: Record<string, unknown>
) => {
  const widget = await prisma.dashboardWidget.findUnique({
    where: { id: widgetId },
  });

  if (!widget) {
    throw new Error('Widget not found');
  }

  return fetchWidgetData(widget.dataSource, widget.type, params);
};

// Fetch data based on data source
const fetchWidgetData = async (
  dataSource: string,
  type: WidgetType,
  params?: Record<string, unknown>
) => {
  switch (dataSource) {
    case 'revenue_total':
      return getRevenueTotalData();
    case 'subscribers_active':
      return getActiveSubscribersData();
    case 'users_new_today':
      return getNewUsersTodayData();
    case 'mrr_current':
      return getCurrentMRRData();
    case 'revenue_chart':
      return getRevenueChartData(params);
    case 'user_growth_chart':
      return getUserGrowthChartData(params);
    case 'top_programs':
      return getTopProgramsData();
    case 'recent_transactions':
      return getRecentTransactionsData();
    case 'realtime':
      return getRealtimeStats();
    case 'overview':
      return getOverviewDashboard();
    default:
      throw new Error(`Unknown data source: ${dataSource}`);
  }
};

// Number widget data sources
const getRevenueTotalData = async () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const result = await prisma.payment.aggregate({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: monthStart },
    },
    _sum: { amount: true },
  });

  return {
    value: (result._sum.amount || 0) / 100,
    label: 'Revenue This Month',
    format: 'currency',
  };
};

const getActiveSubscribersData = async () => {
  const count = await prisma.subscription.count({
    where: { status: 'ACTIVE' },
  });

  return {
    value: count,
    label: 'Active Subscribers',
    format: 'number',
  };
};

const getNewUsersTodayData = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const count = await prisma.user.count({
    where: { createdAt: { gte: todayStart } },
  });

  return {
    value: count,
    label: 'New Users Today',
    format: 'number',
  };
};

const getCurrentMRRData = async () => {
  const activeSubscriptions = await prisma.subscription.count({
    where: { status: 'ACTIVE' },
  });

  // Calculate based on subscription tiers
  const subscriptionsByTier = await prisma.subscription.groupBy({
    by: ['tier'],
    where: { status: 'ACTIVE' },
    _count: true,
  });

  // Example pricing (should come from actual pricing config)
  const pricing: Record<string, number> = {
    FREE: 0,
    BASIC: 9.99,
    PREMIUM: 29.99,
    ENTERPRISE: 99.99,
  };

  let mrr = 0;
  subscriptionsByTier.forEach(s => {
    mrr += (pricing[s.tier] || 0) * s._count;
  });

  return {
    value: Math.round(mrr * 100) / 100,
    label: 'Monthly Recurring Revenue',
    format: 'currency',
  };
};

// Chart widget data sources
const getRevenueChartData = async (params?: Record<string, unknown>) => {
  const days = (params?.days as number) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const payments = await prisma.payment.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: startDate },
    },
    select: {
      amount: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Aggregate by date
  const dataMap = new Map<string, number>();
  payments.forEach(p => {
    const dateKey = p.createdAt.toISOString().split('T')[0];
    dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + p.amount);
  });

  const labels: string[] = [];
  const data: number[] = [];

  for (const [date, amount] of dataMap) {
    labels.push(date);
    data.push(amount / 100);
  }

  return {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data,
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
      },
    ],
  };
};

const getUserGrowthChartData = async (params?: Record<string, unknown>) => {
  const days = (params?.days as number) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Get initial count
  const initialCount = await prisma.user.count({
    where: { createdAt: { lt: startDate } },
  });

  // Aggregate by date
  const dataMap = new Map<string, number>();
  users.forEach(u => {
    const dateKey = u.createdAt.toISOString().split('T')[0];
    dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + 1);
  });

  const labels: string[] = [];
  const newUsersData: number[] = [];
  const totalUsersData: number[] = [];
  let cumulative = initialCount;

  for (const [date, count] of dataMap) {
    labels.push(date);
    newUsersData.push(count);
    cumulative += count;
    totalUsersData.push(cumulative);
  }

  return {
    labels,
    datasets: [
      {
        label: 'New Users',
        data: newUsersData,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: false,
      },
      {
        label: 'Total Users',
        data: totalUsersData,
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: false,
        yAxisID: 'y1',
      },
    ],
  };
};

// List widget data sources
const getTopProgramsData = async () => {
  const programs = await prisma.program.findMany({
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      _count: {
        select: {
          sessions: true,
        },
      },
    },
    take: 5,
    orderBy: {
      sessions: { _count: 'desc' },
    },
  });

  return programs.map((p, index) => ({
    rank: index + 1,
    id: p.id,
    title: p.title,
    thumbnail: p.thumbnailUrl,
    sessions: p._count.sessions,
  }));
};

// Table widget data sources
const getRecentTransactionsData = async () => {
  const transactions = await prisma.payment.findMany({
    where: { status: 'COMPLETED' },
    select: {
      id: true,
      amount: true,
      currency: true,
      provider: true,
      createdAt: true,
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return transactions.map(t => ({
    id: t.id,
    user:
      [t.user.firstName, t.user.lastName].filter(Boolean).join(' ') ||
      t.user.email,
    amount: t.amount / 100,
    currency: t.currency,
    provider: t.provider,
    date: t.createdAt,
  }));
};

// User Dashboard Management
export const getUserDashboard = async (userId: string) => {
  // Get user's widget placements
  let placements = await prisma.userDashboardWidget.findMany({
    where: { userId },
    include: { widget: true },
    orderBy: [{ positionY: 'asc' }, { positionX: 'asc' }],
  });

  // If no placements, create default dashboard
  if (placements.length === 0) {
    await initializeDefaultDashboard(userId);
    placements = await prisma.userDashboardWidget.findMany({
      where: { userId },
      include: { widget: true },
      orderBy: [{ positionY: 'asc' }, { positionX: 'asc' }],
    });
  }

  return placements.map(p => ({
    id: p.id,
    widgetId: p.widgetId,
    widget: p.widget,
    position: {
      x: p.positionX,
      y: p.positionY,
      width: p.width,
      height: p.height,
    },
    customConfig: p.customConfig,
    isVisible: p.isVisible,
  }));
};

// Initialize default dashboard for user
const initializeDefaultDashboard = async (userId: string) => {
  const defaultWidgets = await prisma.dashboardWidget.findMany({
    where: { isDefault: true, isActive: true },
  });

  // Default layout positions
  const layout = [
    { x: 0, y: 0, width: 3, height: 1 },
    { x: 3, y: 0, width: 3, height: 1 },
    { x: 6, y: 0, width: 3, height: 1 },
    { x: 9, y: 0, width: 3, height: 1 },
    { x: 0, y: 1, width: 8, height: 3 },
    { x: 8, y: 1, width: 4, height: 3 },
    { x: 0, y: 4, width: 4, height: 3 },
    { x: 4, y: 4, width: 8, height: 3 },
  ];

  const placements = defaultWidgets.map((widget, index) => ({
    userId,
    widgetId: widget.id,
    positionX: layout[index]?.x || 0,
    positionY: layout[index]?.y || index,
    width: layout[index]?.width || widget.defaultWidth,
    height: layout[index]?.height || widget.defaultHeight,
    isVisible: true,
  }));

  await prisma.userDashboardWidget.createMany({
    data: placements,
    skipDuplicates: true,
  });
};

// Update widget position
export const updateWidgetPosition = async (
  userId: string,
  widgetId: string,
  position: { x: number; y: number; width: number; height: number }
) => {
  return prisma.userDashboardWidget.update({
    where: {
      userId_widgetId: { userId, widgetId },
    },
    data: {
      positionX: position.x,
      positionY: position.y,
      width: position.width,
      height: position.height,
    },
  });
};

// Add widget to dashboard
export const addWidgetToDashboard = async (
  userId: string,
  widgetId: string,
  position: { x: number; y: number; width: number; height: number }
) => {
  const widget = await prisma.dashboardWidget.findUnique({
    where: { id: widgetId },
  });

  if (!widget) {
    throw new Error('Widget not found');
  }

  return prisma.userDashboardWidget.create({
    data: {
      userId,
      widgetId,
      positionX: position.x,
      positionY: position.y,
      width: position.width || widget.defaultWidth,
      height: position.height || widget.defaultHeight,
      isVisible: true,
    },
    include: { widget: true },
  });
};

// Remove widget from dashboard
export const removeWidgetFromDashboard = async (
  userId: string,
  widgetId: string
) => {
  return prisma.userDashboardWidget.delete({
    where: {
      userId_widgetId: { userId, widgetId },
    },
  });
};

// Reset dashboard to defaults
export const resetDashboard = async (userId: string) => {
  await prisma.userDashboardWidget.deleteMany({
    where: { userId },
  });

  await initializeDefaultDashboard(userId);

  return getUserDashboard(userId);
};

// Update dashboard layout (batch update)
export const updateDashboardLayout = async (
  userId: string,
  widgets: Array<{
    widgetId: string;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
  }>
) => {
  const updates = widgets.map(w =>
    prisma.userDashboardWidget.update({
      where: {
        userId_widgetId: { userId, widgetId: w.widgetId },
      },
      data: {
        positionX: w.positionX,
        positionY: w.positionY,
        width: w.width,
        height: w.height,
      },
    })
  );

  await prisma.$transaction(updates);

  return getUserDashboard(userId);
};

// Seed default widgets
export const seedDefaultWidgets = async () => {
  const widgets = [
    {
      name: 'Total Revenue',
      description: 'Total revenue this month',
      type: WidgetType.NUMBER,
      dataSource: 'revenue_total',
      defaultWidth: 3,
      defaultHeight: 1,
      isDefault: true,
    },
    {
      name: 'Active Subscribers',
      description: 'Number of active subscribers',
      type: WidgetType.NUMBER,
      dataSource: 'subscribers_active',
      defaultWidth: 3,
      defaultHeight: 1,
      isDefault: true,
    },
    {
      name: 'New Users Today',
      description: 'Users registered today',
      type: WidgetType.NUMBER,
      dataSource: 'users_new_today',
      defaultWidth: 3,
      defaultHeight: 1,
      isDefault: true,
    },
    {
      name: 'MRR',
      description: 'Monthly Recurring Revenue',
      type: WidgetType.NUMBER,
      dataSource: 'mrr_current',
      defaultWidth: 3,
      defaultHeight: 1,
      isDefault: true,
    },
    {
      name: 'Revenue Chart',
      description: 'Revenue trend over time',
      type: WidgetType.CHART,
      dataSource: 'revenue_chart',
      chartType: 'area',
      defaultWidth: 8,
      defaultHeight: 3,
      isDefault: true,
    },
    {
      name: 'User Growth',
      description: 'User growth trend',
      type: WidgetType.CHART,
      dataSource: 'user_growth_chart',
      chartType: 'line',
      defaultWidth: 4,
      defaultHeight: 3,
      isDefault: true,
    },
    {
      name: 'Top Programs',
      description: 'Most popular programs',
      type: WidgetType.LIST,
      dataSource: 'top_programs',
      defaultWidth: 4,
      defaultHeight: 3,
      isDefault: true,
    },
    {
      name: 'Recent Transactions',
      description: 'Latest payment transactions',
      type: WidgetType.TABLE,
      dataSource: 'recent_transactions',
      defaultWidth: 8,
      defaultHeight: 3,
      isDefault: true,
    },
  ];

  for (const widget of widgets) {
    await prisma.dashboardWidget.upsert({
      where: {
        id: widget.name.toLowerCase().replace(/\s+/g, '-'),
      },
      update: widget,
      create: {
        id: widget.name.toLowerCase().replace(/\s+/g, '-'),
        ...widget,
      },
    });
  }

  return widgets.length;
};
