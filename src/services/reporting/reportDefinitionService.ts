import { PrismaClient, ReportCategory, ReportType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Get all report definitions
export const getReportDefinitions = async (
  category?: ReportCategory,
  userRole?: string
) => {
  const where: Prisma.report_definitionsWhereInput = {
    isActive: true,
  };

  if (category) {
    where.category = category;
  }

  // Filter by role if not admin
  if (userRole && userRole !== 'ADMIN') {
    where.OR = [
      { isPublic: true },
      { requiredRole: userRole },
      { requiredRole: null },
    ];
  }

  return prisma.report_definitions.findMany({
    where,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
};

// Get single report definition by ID
export const getReportDefinition = async (id: string) => {
  return prisma.report_definitions.findUnique({
    where: { id },
  });
};

// Get report definition by slug
export const getReportDefinitionBySlug = async (slug: string) => {
  return prisma.report_definitions.findUnique({
    where: { slug },
  });
};

// Create report definition (Admin only)
export const createReportDefinition = async (data: {
  name: string;
  slug: string;
  description?: string;
  category: ReportCategory;
  type: ReportType;
  dataSource: string;
  baseQuery?: Prisma.InputJsonValue;
  availableFilters: Prisma.InputJsonValue;
  availableColumns: Prisma.InputJsonValue;
  defaultFilters?: Prisma.InputJsonValue;
  defaultColumns: string[];
  defaultSortBy?: string;
  defaultSortOrder?: string;
  chartTypes?: string[];
  defaultChartType?: string;
  requiredRole?: string;
  isPublic?: boolean;
  allowScheduling?: boolean;
}) => {
  return prisma.report_definitions.create({
    data: {
      ...data,
      chartTypes: data.chartTypes || [],
    },
  });
};

// Update report definition
export const updateReportDefinition = async (
  id: string,
  data: Partial<{
    name: string;
    description: string;
    baseQuery: Prisma.InputJsonValue;
    availableFilters: Prisma.InputJsonValue;
    availableColumns: Prisma.InputJsonValue;
    defaultFilters: Prisma.InputJsonValue;
    defaultColumns: string[];
    defaultSortBy: string;
    defaultSortOrder: string;
    chartTypes: string[];
    defaultChartType: string;
    requiredRole: string;
    isPublic: boolean;
    allowScheduling: boolean;
    isActive: boolean;
  }>
) => {
  return prisma.report_definitions.update({
    where: { id },
    data,
  });
};

// Delete report definition (soft delete)
export const deleteReportDefinition = async (id: string) => {
  return prisma.report_definitions.update({
    where: { id },
    data: { isActive: false },
  });
};

// Seed default report definitions
export const seedDefaultReportDefinitions = async () => {
  const definitions = [
    // USERS
    {
      name: 'User List Report',
      slug: 'user-list',
      description: 'List of all users with filtering options',
      category: ReportCategory.USERS,
      type: ReportType.TABLE,
      dataSource: 'users',
      availableFilters: [
        { key: 'role', type: 'select', options: ['USER', 'ADMIN', 'TEACHER'] },
        { key: 'status', type: 'select', options: ['active', 'inactive', 'banned'] },
        { key: 'subscriptionStatus', type: 'select', options: ['active', 'expired', 'none'] },
        { key: 'createdAt', type: 'dateRange' },
        { key: 'country', type: 'text' },
        { key: 'search', type: 'text' },
      ],
      availableColumns: [
        { key: 'id', label: 'ID', type: 'string' },
        { key: 'email', label: 'Email', type: 'string' },
        { key: 'name', label: 'Name', type: 'string' },
        { key: 'role', label: 'Role', type: 'string' },
        { key: 'subscriptionStatus', label: 'Subscription', type: 'string' },
        { key: 'totalSpent', label: 'Total Spent', type: 'currency' },
        { key: 'lastLoginAt', label: 'Last Login', type: 'datetime' },
        { key: 'createdAt', label: 'Registered', type: 'datetime' },
      ],
      defaultColumns: ['email', 'name', 'role', 'subscriptionStatus', 'createdAt'],
      chartTypes: [],
    },
    {
      name: 'User Growth Report',
      slug: 'user-growth',
      description: 'Track user registration trends over time',
      category: ReportCategory.USERS,
      type: ReportType.TIME_SERIES,
      dataSource: 'user_growth',
      availableFilters: [{ key: 'dateRange', type: 'dateRange' }],
      availableColumns: [
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'newUsers', label: 'New Users', type: 'number' },
        { key: 'totalUsers', label: 'Total Users', type: 'number' },
      ],
      defaultColumns: ['date', 'newUsers', 'totalUsers'],
      chartTypes: ['line', 'bar', 'area'],
      defaultChartType: 'line',
    },
    {
      name: 'User Retention Cohort',
      slug: 'user-retention-cohort',
      description: 'Cohort analysis of user retention',
      category: ReportCategory.USERS,
      type: ReportType.COHORT,
      dataSource: 'user_retention',
      availableFilters: [{ key: 'dateRange', type: 'dateRange' }],
      availableColumns: [],
      defaultColumns: [],
      chartTypes: [],
    },

    // REVENUE
    {
      name: 'Revenue Report',
      slug: 'revenue-report',
      description: 'Revenue trends and analysis',
      category: ReportCategory.REVENUE,
      type: ReportType.TIME_SERIES,
      dataSource: 'revenue',
      availableFilters: [
        { key: 'dateRange', type: 'dateRange' },
        { key: 'plan', type: 'multiselect' },
        { key: 'country', type: 'multiselect' },
        { key: 'paymentMethod', type: 'select' },
      ],
      availableColumns: [
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'revenue', label: 'Revenue', type: 'currency' },
        { key: 'transactions', label: 'Transactions', type: 'number' },
      ],
      defaultColumns: ['date', 'revenue', 'transactions'],
      chartTypes: ['line', 'bar', 'area'],
      defaultChartType: 'area',
    },
    {
      name: 'MRR Report',
      slug: 'mrr-report',
      description: 'Monthly Recurring Revenue tracking',
      category: ReportCategory.REVENUE,
      type: ReportType.TIME_SERIES,
      dataSource: 'mrr',
      availableFilters: [{ key: 'dateRange', type: 'dateRange' }],
      availableColumns: [
        { key: 'month', label: 'Month', type: 'date' },
        { key: 'mrr', label: 'MRR', type: 'currency' },
        { key: 'growth', label: 'Growth %', type: 'percentage' },
      ],
      defaultColumns: ['month', 'mrr', 'growth'],
      chartTypes: ['line', 'bar'],
      defaultChartType: 'line',
    },
    {
      name: 'Payment Transactions',
      slug: 'payment-transactions',
      description: 'All payment transactions',
      category: ReportCategory.REVENUE,
      type: ReportType.TABLE,
      dataSource: 'payments',
      availableFilters: [
        { key: 'dateRange', type: 'dateRange' },
        { key: 'status', type: 'select', options: ['completed', 'pending', 'failed', 'refunded'] },
        { key: 'paymentMethod', type: 'select' },
      ],
      availableColumns: [
        { key: 'id', label: 'Transaction ID', type: 'string' },
        { key: 'userId', label: 'User', type: 'string' },
        { key: 'amount', label: 'Amount', type: 'currency' },
        { key: 'currency', label: 'Currency', type: 'string' },
        { key: 'status', label: 'Status', type: 'string' },
        { key: 'paymentMethod', label: 'Method', type: 'string' },
        { key: 'createdAt', label: 'Date', type: 'datetime' },
      ],
      defaultColumns: ['id', 'amount', 'status', 'paymentMethod', 'createdAt'],
      chartTypes: [],
    },
    {
      name: 'Revenue by Plan',
      slug: 'revenue-by-plan',
      description: 'Revenue breakdown by subscription plan',
      category: ReportCategory.REVENUE,
      type: ReportType.COMPARISON,
      dataSource: 'revenue_by_plan',
      availableFilters: [{ key: 'dateRange', type: 'dateRange' }],
      availableColumns: [
        { key: 'plan', label: 'Plan', type: 'string' },
        { key: 'revenue', label: 'Revenue', type: 'currency' },
        { key: 'percentage', label: 'Percentage', type: 'percentage' },
      ],
      defaultColumns: ['plan', 'revenue', 'percentage'],
      chartTypes: ['pie', 'bar', 'donut'],
      defaultChartType: 'pie',
    },
    {
      name: 'LTV Analysis',
      slug: 'ltv-analysis',
      description: 'Customer Lifetime Value analysis',
      category: ReportCategory.REVENUE,
      type: ReportType.SUMMARY,
      dataSource: 'ltv',
      availableFilters: [{ key: 'segment', type: 'select' }],
      availableColumns: [],
      defaultColumns: [],
      chartTypes: [],
    },

    // SUBSCRIPTIONS
    {
      name: 'Subscription Report',
      slug: 'subscription-report',
      description: 'All subscriptions with status',
      category: ReportCategory.SUBSCRIPTIONS,
      type: ReportType.TABLE,
      dataSource: 'subscriptions',
      availableFilters: [
        { key: 'dateRange', type: 'dateRange' },
        { key: 'status', type: 'select', options: ['active', 'cancelled', 'expired', 'trialing'] },
        { key: 'plan', type: 'select' },
      ],
      availableColumns: [
        { key: 'id', label: 'ID', type: 'string' },
        { key: 'userId', label: 'User', type: 'string' },
        { key: 'plan', label: 'Plan', type: 'string' },
        { key: 'status', label: 'Status', type: 'string' },
        { key: 'startDate', label: 'Start Date', type: 'datetime' },
        { key: 'endDate', label: 'End Date', type: 'datetime' },
      ],
      defaultColumns: ['userId', 'plan', 'status', 'startDate', 'endDate'],
      chartTypes: [],
    },
    {
      name: 'Churn Analysis',
      slug: 'churn-analysis',
      description: 'Customer churn rate analysis',
      category: ReportCategory.SUBSCRIPTIONS,
      type: ReportType.TIME_SERIES,
      dataSource: 'churn',
      availableFilters: [{ key: 'dateRange', type: 'dateRange' }],
      availableColumns: [
        { key: 'month', label: 'Month', type: 'date' },
        { key: 'churnRate', label: 'Churn Rate', type: 'percentage' },
        { key: 'churned', label: 'Churned Users', type: 'number' },
      ],
      defaultColumns: ['month', 'churnRate', 'churned'],
      chartTypes: ['line', 'bar'],
      defaultChartType: 'line',
    },
    {
      name: 'Subscription Funnel',
      slug: 'subscription-funnel',
      description: 'Conversion funnel from signup to subscription',
      category: ReportCategory.SUBSCRIPTIONS,
      type: ReportType.FUNNEL,
      dataSource: 'subscription_funnel',
      availableFilters: [{ key: 'dateRange', type: 'dateRange' }],
      availableColumns: [],
      defaultColumns: [],
      chartTypes: ['funnel'],
      defaultChartType: 'funnel',
    },

    // CONTENT
    {
      name: 'Content Performance',
      slug: 'content-performance',
      description: 'Performance metrics for all content',
      category: ReportCategory.CONTENT,
      type: ReportType.TABLE,
      dataSource: 'content_stats',
      availableFilters: [
        { key: 'dateRange', type: 'dateRange' },
        { key: 'contentType', type: 'select', options: ['program', 'class', 'pose'] },
      ],
      availableColumns: [
        { key: 'id', label: 'ID', type: 'string' },
        { key: 'title', label: 'Title', type: 'string' },
        { key: 'type', label: 'Type', type: 'string' },
        { key: 'views', label: 'Views', type: 'number' },
        { key: 'completions', label: 'Completions', type: 'number' },
        { key: 'rating', label: 'Rating', type: 'number' },
      ],
      defaultColumns: ['title', 'type', 'views', 'completions', 'rating'],
      chartTypes: [],
    },
    {
      name: 'Program Analytics',
      slug: 'program-analytics',
      description: 'Detailed program performance',
      category: ReportCategory.CONTENT,
      type: ReportType.SUMMARY,
      dataSource: 'program_analytics',
      availableFilters: [{ key: 'programId', type: 'select' }],
      availableColumns: [],
      defaultColumns: [],
      chartTypes: [],
    },
    {
      name: 'Class Completion Report',
      slug: 'class-completion',
      description: 'Class completion rates',
      category: ReportCategory.CONTENT,
      type: ReportType.TABLE,
      dataSource: 'class_completion',
      availableFilters: [{ key: 'dateRange', type: 'dateRange' }],
      availableColumns: [
        { key: 'classId', label: 'Class', type: 'string' },
        { key: 'title', label: 'Title', type: 'string' },
        { key: 'starts', label: 'Starts', type: 'number' },
        { key: 'completions', label: 'Completions', type: 'number' },
        { key: 'completionRate', label: 'Completion Rate', type: 'percentage' },
      ],
      defaultColumns: ['title', 'starts', 'completions', 'completionRate'],
      chartTypes: [],
    },

    // ENGAGEMENT
    {
      name: 'User Engagement Report',
      slug: 'user-engagement',
      description: 'Overall user engagement metrics',
      category: ReportCategory.ENGAGEMENT,
      type: ReportType.SUMMARY,
      dataSource: 'user_engagement',
      availableFilters: [{ key: 'dateRange', type: 'dateRange' }],
      availableColumns: [],
      defaultColumns: [],
      chartTypes: [],
    },
    {
      name: 'Daily Active Users',
      slug: 'daily-active-users',
      description: 'DAU trends over time',
      category: ReportCategory.ENGAGEMENT,
      type: ReportType.TIME_SERIES,
      dataSource: 'dau',
      availableFilters: [{ key: 'dateRange', type: 'dateRange' }],
      availableColumns: [
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'dau', label: 'DAU', type: 'number' },
        { key: 'wau', label: 'WAU', type: 'number' },
        { key: 'mau', label: 'MAU', type: 'number' },
      ],
      defaultColumns: ['date', 'dau', 'wau', 'mau'],
      chartTypes: ['line', 'area'],
      defaultChartType: 'line',
    },
    {
      name: 'Session Analytics',
      slug: 'session-analytics',
      description: 'User session duration and frequency',
      category: ReportCategory.ENGAGEMENT,
      type: ReportType.TIME_SERIES,
      dataSource: 'sessions',
      availableFilters: [{ key: 'dateRange', type: 'dateRange' }],
      availableColumns: [
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'avgDuration', label: 'Avg Duration', type: 'duration' },
        { key: 'totalSessions', label: 'Total Sessions', type: 'number' },
      ],
      defaultColumns: ['date', 'avgDuration', 'totalSessions'],
      chartTypes: ['line', 'bar'],
      defaultChartType: 'line',
    },

    // INSTRUCTORS
    {
      name: 'Instructor Performance',
      slug: 'instructor-performance',
      description: 'Performance metrics for instructors',
      category: ReportCategory.INSTRUCTORS,
      type: ReportType.TABLE,
      dataSource: 'instructor_performance',
      availableFilters: [
        { key: 'dateRange', type: 'dateRange' },
        { key: 'instructorId', type: 'select' },
      ],
      availableColumns: [
        { key: 'instructorId', label: 'Instructor', type: 'string' },
        { key: 'name', label: 'Name', type: 'string' },
        { key: 'classes', label: 'Classes', type: 'number' },
        { key: 'students', label: 'Students', type: 'number' },
        { key: 'rating', label: 'Rating', type: 'number' },
        { key: 'revenue', label: 'Revenue', type: 'currency' },
      ],
      defaultColumns: ['name', 'classes', 'students', 'rating', 'revenue'],
      chartTypes: [],
    },
    {
      name: 'Instructor Earnings',
      slug: 'instructor-earnings',
      description: 'Earnings breakdown by instructor',
      category: ReportCategory.INSTRUCTORS,
      type: ReportType.TABLE,
      dataSource: 'instructor_earnings',
      availableFilters: [{ key: 'dateRange', type: 'dateRange' }],
      availableColumns: [
        { key: 'instructorId', label: 'Instructor', type: 'string' },
        { key: 'name', label: 'Name', type: 'string' },
        { key: 'grossEarnings', label: 'Gross', type: 'currency' },
        { key: 'commission', label: 'Commission', type: 'currency' },
        { key: 'netEarnings', label: 'Net', type: 'currency' },
      ],
      defaultColumns: ['name', 'grossEarnings', 'commission', 'netEarnings'],
      chartTypes: [],
    },
    {
      name: 'Instructor Payout Report',
      slug: 'instructor-payouts',
      description: 'Payout history for instructors',
      category: ReportCategory.INSTRUCTORS,
      type: ReportType.TABLE,
      dataSource: 'instructor_payouts',
      availableFilters: [
        { key: 'dateRange', type: 'dateRange' },
        { key: 'status', type: 'select', options: ['pending', 'completed', 'failed'] },
      ],
      availableColumns: [
        { key: 'id', label: 'Payout ID', type: 'string' },
        { key: 'instructorId', label: 'Instructor', type: 'string' },
        { key: 'amount', label: 'Amount', type: 'currency' },
        { key: 'status', label: 'Status', type: 'string' },
        { key: 'paidAt', label: 'Paid At', type: 'datetime' },
      ],
      defaultColumns: ['instructorId', 'amount', 'status', 'paidAt'],
      chartTypes: [],
    },
  ];

  for (const def of definitions) {
    await prisma.report_definitions.upsert({
      where: { slug: def.slug },
      update: def,
      create: def,
    });
  }

  return definitions.length;
};
