'use client';

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearSession, setSession } from './auth';

// API client with interceptors
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
  withCredentials: true, // Essential for HttpOnly cookies
  validateStatus: (status) => status >= 200 && status < 400,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor - handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying, attempt to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token (uses HttpOnly cookie)
        await api.post('/api/users/refresh-token');
        processQueue(null);
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        // Refresh failed - clear session and redirect to login
        clearSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTH ENDPOINTS
// ============================================

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post('/api/users/login', payload);
  // Token is now set as HttpOnly cookie by the server
  // Store user info in session for client-side access
  if (data.user) {
    setSession({
      userId: data.user.id,
      email: data.user.email,
      role: data.user.role,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
    });
  }
  return data;
}

export async function signup(payload: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) {
  const { data } = await api.post('/api/users/signup', payload);
  // Token is now set as HttpOnly cookie by the server
  // Store user info in session for client-side access
  if (data.user) {
    setSession({
      userId: data.user.id,
      email: data.user.email,
      role: data.user.role,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
    });
  }
  return data;
}

export async function logout() {
  try {
    const { data } = await api.post('/api/users/logout');
    return data;
  } finally {
    // Always clear local session, even if API call fails
    clearSession();
  }
}

export async function refreshAccessToken() {
  const { data } = await api.post('/api/users/refresh-token');
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post('/api/users/forgot-password', { email });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post('/api/users/reset-password', { token, password });
  return data;
}

export async function getMe() {
  const { data } = await api.get('/api/users/me');
  // Update session with latest user info
  if (data.user) {
    setSession({
      userId: data.user.id,
      email: data.user.email,
      role: data.user.role,
      firstName: data.user.firstName,
      lastName: data.user.lastName,
    });
  }
  return data;
}

export async function updateMe(payload: {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
}) {
  const { data } = await api.put('/api/users/me', payload);
  return data;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  const { data } = await api.post('/api/users/me/change-password', payload);
  return data;
}

export async function deleteAccount(password: string) {
  const { data } = await api.post('/api/users/me/delete', { password });
  return data;
}

export async function getAvatarUploadUrl(filename: string, contentType: string) {
  const { data } = await api.post('/api/users/me/avatar-upload-url', { filename, contentType });
  return data as { uploadUrl: string; fileUrl: string; expiresAt: string };
}

export async function uploadFileToS3(uploadUrl: string, file: File) {
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
  });
}

// ============================================
// ADMIN DASHBOARD STATS
// ============================================

export async function getDashboardStats() {
  const { data } = await api.get('/api/admin/dashboard/stats');
  return data;
}

export async function getFinancialStats() {
  const { data } = await api.get('/api/admin/dashboard/financial');
  return data;
}

export async function getAnalyticsOverview() {
  const { data } = await api.get('/api/admin/dashboard/analytics/overview');
  return data;
}

// ============================================
// USERS MANAGEMENT
// ============================================

export async function getUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/users', { params });
  return data;
}

export async function getUserById(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/users/${id}`);
  return data;
}

export async function banUser(id: string, reason: string) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/ban`, { reason });
  return data;
}

export async function unbanUser(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/unban`);
  return data;
}

export async function warnUser(id: string, reason: string) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/warn`, { reason });
  return data;
}

export async function changeUserRole(id: string, role: string) {
  const { data } = await api.patch(`/api/admin/dashboard/users/${id}/role`, { role });
  return data;
}

export async function resetUserPassword(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/reset-password`);
  return data;
}

export async function getUserActivity(id: string, params?: { page?: number; limit?: number; filter?: string }) {
  const { data } = await api.get(`/api/admin/dashboard/users/${id}/activity`, { params });
  return data;
}

// ============================================
// USER DETAILS - TAB ENDPOINTS
// ============================================

export async function getUserOverview(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/users/${id}/overview`);
  return data;
}

export async function getUserLoginHistory(id: string, params?: { page?: number; limit?: number }) {
  const { data } = await api.get(`/api/admin/dashboard/users/${id}/login-history`, { params });
  return data;
}

export async function getUserActiveSessions(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/users/${id}/sessions`);
  return data;
}

export async function revokeUserSession(userId: string, sessionId: string) {
  const { data } = await api.delete(`/api/admin/dashboard/users/${userId}/sessions/${sessionId}`);
  return data;
}

export async function revokeAllUserSessions(id: string) {
  const { data } = await api.delete(`/api/admin/dashboard/users/${id}/sessions`);
  return data;
}

export async function getUserProgress(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/users/${id}/progress`);
  return data;
}

export async function getUserPayments(id: string, params?: { page?: number; limit?: number }) {
  const { data } = await api.get(`/api/admin/dashboard/users/${id}/payments`, { params });
  return data;
}

export async function extendUserSubscription(id: string, days: number) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/extend-subscription`, { days });
  return data;
}

export async function grantUserPremium(id: string, days: number, planId: string) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/grant-premium`, { days, planId });
  return data;
}

export async function getUserSupport(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/users/${id}/support`);
  return data;
}

export async function addAdminNote(userId: string, content: string, isPinned?: boolean) {
  const { data } = await api.post(`/api/admin/dashboard/users/${userId}/notes`, { content, isPinned });
  return data;
}

export async function deleteAdminNote(userId: string, noteId: string) {
  const { data } = await api.delete(`/api/admin/dashboard/users/${userId}/notes/${noteId}`);
  return data;
}

export async function toggleNotePin(userId: string, noteId: string) {
  const { data } = await api.patch(`/api/admin/dashboard/users/${userId}/notes/${noteId}/pin`);
  return data;
}

export async function addUserXP(id: string, amount: number, reason: string) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/xp`, { amount, reason });
  return data;
}

export async function grantUserBadge(id: string, badgeId: string) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/badges`, { badgeId });
  return data;
}

export async function grantUserTitle(id: string, titleId: string) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/titles`, { titleId });
  return data;
}

export async function addUserStreakFreeze(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/streak-freeze`);
  return data;
}

export async function verifyUserEmail(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/verify-email`);
  return data;
}

export async function verifyUserPhone(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/verify-phone`);
  return data;
}

export async function exportUserData(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/users/${id}/export`);
  return data;
}

export async function getTeacherProfile(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/users/${id}/teacher`);
  return data;
}

export async function updateInstructorStatus(id: string, status: string) {
  const { data } = await api.patch(`/api/admin/dashboard/users/${id}/instructor/status`, { status });
  return data;
}

export async function updateInstructorTier(id: string, tier: string) {
  const { data } = await api.patch(`/api/admin/dashboard/users/${id}/instructor/tier`, { tier });
  return data;
}

export async function toggleInstructorVerified(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/instructor/verify`);
  return data;
}

export async function toggleInstructorFeatured(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/users/${id}/instructor/feature`);
  return data;
}

export async function updateInstructorCommission(id: string, rate: number) {
  const { data } = await api.patch(`/api/admin/dashboard/users/${id}/instructor/commission`, { rate });
  return data;
}

// ============================================
// PROGRAMS MANAGEMENT
// ============================================

export async function getPrograms(params?: {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/content/programs', { params });
  return data;
}

export async function getProgramById(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/content/programs/${id}`);
  return data;
}

export async function createProgram(payload: {
  title: string;
  description: string;
  level: string;
  durationWeeks?: number;
  coverImageUrl?: string;
  isPublished?: boolean;
}) {
  const { data } = await api.post('/api/admin/dashboard/content/programs', payload);
  return data;
}

export async function updateProgram(id: string, payload: Partial<{
  title: string;
  description: string;
  level: string;
  durationWeeks: number;
  thumbnailUrl: string;
  coverImageUrl: string;
  isPublished: boolean;
}>) {
  const { data } = await api.put(`/api/admin/dashboard/content/programs/${id}`, payload);
  return data;
}

export async function deleteProgram(id: string) {
  const { data } = await api.delete(`/api/admin/dashboard/content/programs/${id}`);
  return data;
}

// ============================================
// CLASSES MANAGEMENT
// ============================================

export async function getClasses(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/content/classes', { params });
  return data;
}

export async function getClassById(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/content/classes/${id}`);
  return data;
}

export async function createClass(payload: {
  title: string;
  description: string;
  level: string;
  durationMinutes?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  isPublished?: boolean;
  instructorId?: string;
}) {
  const { data } = await api.post('/api/admin/dashboard/content/classes', payload);
  return data;
}

export async function updateClass(id: string, payload: Partial<{
  title: string;
  description: string;
  level: string;
  durationMinutes: number;
  videoUrl: string;
  thumbnailUrl: string;
  isPublished: boolean;
  instructorId: string;
}>) {
  const { data } = await api.put(`/api/admin/dashboard/content/classes/${id}`, payload);
  return data;
}

export async function deleteClass(id: string) {
  const { data } = await api.delete(`/api/admin/dashboard/content/classes/${id}`);
  return data;
}

// ============================================
// POSES MANAGEMENT
// ============================================

export async function getPoses(params?: {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/content/poses', { params });
  return data;
}

export async function getPoseById(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/content/poses/${id}`);
  return data;
}

export async function createPose(payload: {
  name?: string;
  englishName?: string;
  sanskritName?: string;
  description: string;
  difficulty: string;
  benefits?: string[];
  instructions?: string[];
  bodyAreas?: string[];
  imageUrl?: string;
  videoUrl?: string;
}) {
  const { data } = await api.post('/api/admin/dashboard/content/poses', payload);
  return data;
}

export async function updatePose(id: string, payload: Partial<{
  name: string;
  englishName: string;
  sanskritName: string;
  description: string;
  difficulty: string;
  benefits: string[];
  instructions: string[];
  bodyAreas: string[];
  imageUrl: string;
  videoUrl: string;
}>) {
  const { data } = await api.put(`/api/admin/dashboard/content/poses/${id}`, payload);
  return data;
}

export async function deletePose(id: string) {
  const { data } = await api.delete(`/api/admin/dashboard/content/poses/${id}`);
  return data;
}

// ============================================
// CHALLENGES MANAGEMENT
// ============================================

export async function getChallenges(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/content/challenges', { params });
  return data;
}

export async function getChallengeById(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/content/challenges/${id}`);
  return data;
}

export async function createChallenge(payload: {
  title: string;
  description: string;
  startAt?: string;
  endAt?: string;
  startDate?: string;
  endDate?: string;
  dailyGoal?: number;
  rewardXp?: number;
  goalType?: string;
  goalValue?: number;
  thumbnailUrl?: string;
}) {
  const { data } = await api.post('/api/admin/dashboard/content/challenges', payload);
  return data;
}

export async function updateChallenge(id: string, payload: Partial<{
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  startDate: string;
  endDate: string;
  dailyGoal: number;
  rewardXp: number;
  goalType: string;
  goalValue: number;
  thumbnailUrl: string;
}>) {
  const { data } = await api.put(`/api/admin/dashboard/content/challenges/${id}`, payload);
  return data;
}

export async function deleteChallenge(id: string) {
  const { data } = await api.delete(`/api/admin/dashboard/content/challenges/${id}`);
  return data;
}

// ============================================
// INSTRUCTORS MANAGEMENT
// ============================================

export async function getInstructors(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { data } = await api.get('/api/admin/instructors', { params });
  return data;
}

export async function getInstructorById(id: string) {
  const { data } = await api.get(`/api/admin/instructors/${id}`);
  return data;
}

export async function approveInstructor(id: string) {
  const { data } = await api.post(`/api/admin/instructors/${id}/approve`);
  return data;
}

export async function rejectInstructor(id: string, reason: string) {
  const { data } = await api.post(`/api/admin/instructors/${id}/reject`, { reason });
  return data;
}

export async function getInstructorEarnings(id: string) {
  const { data } = await api.get(`/api/admin/instructors/${id}/earnings`);
  return data;
}

export async function createInstructorPayout(id: string, amount: number) {
  const { data } = await api.post(`/api/admin/instructors/${id}/payouts`, { amount });
  return data;
}

export async function getInstructorAnalytics(id: string) {
  const { data } = await api.get(`/api/admin/instructors/${id}/analytics`);
  return data;
}

// ============================================
// FINANCIAL MANAGEMENT
// ============================================

export async function getSubscriptionPlans() {
  const { data } = await api.get('/api/admin/dashboard/financial/plans');
  return data;
}

export async function createSubscriptionPlan(payload: {
  name: string;
  tier: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isActive?: boolean;
}) {
  const { data } = await api.post('/api/admin/dashboard/financial/plans', payload);
  return data;
}

export async function updateSubscriptionPlan(id: string, payload: Partial<{
  name: string;
  tier: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isActive: boolean;
}>) {
  const { data } = await api.put(`/api/admin/dashboard/financial/plans/${id}`, payload);
  return data;
}

export async function deleteSubscriptionPlan(id: string) {
  const { data } = await api.delete(`/api/admin/dashboard/financial/plans/${id}`);
  return data;
}

export async function getSubscriptions(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/financial/subscriptions', { params });
  return data;
}

export async function cancelSubscription(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/financial/subscriptions/${id}/cancel`);
  return data;
}

export async function extendSubscription(id: string, days: number) {
  const { data } = await api.post(`/api/admin/dashboard/financial/subscriptions/${id}/extend`, { days });
  return data;
}

export async function getPayments(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/financial/payments', { params });
  return data;
}

export async function getPaymentById(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/financial/payments/${id}`);
  return data;
}

export async function refundPayment(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/financial/payments/${id}/refund`);
  return data;
}

export async function getCoupons(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/financial/coupons', { params });
  return data;
}

export async function createCoupon(payload: {
  code: string;
  discountType: string;
  discountValue: number;
  maxUses?: number;
  expiresAt?: string;
}) {
  const { data } = await api.post('/api/admin/dashboard/financial/coupons', payload);
  return data;
}

export async function updateCoupon(id: string, payload: Partial<{
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number;
  expiresAt: string;
  isActive: boolean;
}>) {
  const { data } = await api.put(`/api/admin/dashboard/financial/coupons/${id}`, payload);
  return data;
}

export async function deleteCoupon(id: string) {
  const { data } = await api.delete(`/api/admin/dashboard/financial/coupons/${id}`);
  return data;
}

// ============================================
// MODERATION
// ============================================

export async function getModerationReports(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/moderation/reports', { params });
  return data;
}

export async function reviewReport(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/moderation/reports/${id}/review`);
  return data;
}

export async function resolveReport(id: string, action: string, note?: string) {
  const { data } = await api.post(`/api/admin/dashboard/moderation/reports/${id}/resolve`, { action, note });
  return data;
}

export async function getModerationComments(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/moderation/comments', { params });
  return data;
}

export async function deleteComment(id: string) {
  const { data } = await api.delete(`/api/admin/dashboard/moderation/comments/${id}`);
  return data;
}

export async function hideComment(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/moderation/comments/${id}/hide`);
  return data;
}

export async function getModerationStats() {
  const { data } = await api.get('/api/admin/dashboard/moderation/stats');
  return data;
}

// ============================================
// ANALYTICS
// ============================================

export async function getRealtimeAnalytics() {
  const { data } = await api.get('/api/admin/dashboard/analytics/realtime');
  return data;
}

export async function getUserAnalytics(period: string) {
  const { data } = await api.get('/api/admin/dashboard/analytics/users', { params: { period } });
  return data;
}

export async function getRevenueAnalytics(period: string) {
  const { data } = await api.get('/api/admin/dashboard/analytics/revenue', { params: { period } });
  return data;
}

export async function getContentAnalytics(period: string) {
  const { data } = await api.get('/api/admin/dashboard/analytics/content', { params: { period } });
  return data;
}

export async function getChallengeAnalytics(period: string) {
  const { data } = await api.get('/api/admin/dashboard/analytics/challenges', { params: { period } });
  return data;
}

export async function createExport(params: {
  type: string;
  dateRange: string;
  format: string;
  includeCharts?: boolean;
}) {
  const { data } = await api.post('/api/admin/dashboard/exports', params);
  return data;
}

export async function getExportStatus(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/exports/${id}`);
  return data;
}

// ============================================
// SETTINGS
// ============================================

export async function getFeatureFlags() {
  const { data } = await api.get('/api/admin/dashboard/settings/features');
  return data;
}

export async function toggleFeatureFlag(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/settings/features/${id}/toggle`);
  return data;
}

export async function createFeatureFlag(flagData: {
  key: string;
  name: string;
  description: string;
  environment: string;
}) {
  const { data } = await api.post('/api/admin/dashboard/settings/features', flagData);
  return data;
}

export async function deleteFeatureFlag(id: string) {
  const { data } = await api.delete(`/api/admin/dashboard/settings/features/${id}`);
  return data;
}

// System Settings
export async function getSystemSettings() {
  const { data } = await api.get('/api/admin/dashboard/settings/system');
  return data;
}

export async function updateSystemSetting(key: string, value: any) {
  const { data } = await api.put(`/api/admin/dashboard/settings/system/${key}`, { value });
  return data;
}

// i18n
export async function getLanguages() {
  const { data } = await api.get('/api/admin/i18n/languages');
  return data;
}

export async function getTranslations() {
  const { data } = await api.get('/api/admin/i18n/translations');
  return data;
}

export async function updateTranslation(key: string, values: Record<string, string>) {
  const { data } = await api.put(`/api/admin/i18n/translations/${key}`, values);
  return data;
}

// CMS - Banners
export async function getBanners() {
  const { data } = await api.get('/api/cms/banners');
  return data;
}

export async function createBanner(bannerData: {
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}) {
  const { data } = await api.post('/api/cms/banners', bannerData);
  return data;
}

export async function updateBanner(id: string, bannerData: any) {
  const { data } = await api.put(`/api/cms/banners/${id}`, bannerData);
  return data;
}

export async function deleteBanner(id: string) {
  const { data } = await api.delete(`/api/cms/banners/${id}`);
  return data;
}

export async function getAnnouncements() {
  const { data } = await api.get('/api/cms/announcements');
  return data;
}

// Notifications (legacy - use sendBroadcastNotification instead)
export async function sendNotificationLegacy(notificationData: {
  title: string;
  body: string;
  type: string;
  targetAudience: string;
  templateId?: string;
}) {
  const { data } = await api.post('/api/admin/dashboard/bulk/notifications', notificationData);
  return data;
}

export async function getNotificationTemplates() {
  const { data } = await api.get('/api/admin/communication/templates');
  return data;
}

export async function getNotificationCampaigns() {
  const { data } = await api.get('/api/admin/communication/campaigns');
  return data;
}

// Maintenance
export async function getMaintenanceWindows() {
  const { data } = await api.get('/api/admin/dashboard/maintenance/windows');
  return data;
}

export async function createMaintenanceWindow(windowData: {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}) {
  const { data } = await api.post('/api/admin/dashboard/maintenance/windows', windowData);
  return data;
}

export async function clearCache() {
  const { data } = await api.delete('/api/admin/dashboard/maintenance/cache');
  return data;
}

export async function optimizeDatabase() {
  const { data } = await api.post('/api/admin/dashboard/maintenance/optimize');
  return data;
}

export async function getHealthCheck() {
  const { data } = await api.get('/api/admin/dashboard/maintenance/health');
  return data;
}

export async function getBackups() {
  const { data } = await api.get('/api/admin/dashboard/maintenance/backups');
  return data;
}

export async function createBackup() {
  const { data } = await api.post('/api/admin/dashboard/maintenance/backups');
  return data;
}

// ============================================
// AUDIT LOGS
// ============================================

export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await api.get('/api/admin/audit', { params });
  return data;
}

export async function getAuditLogDetails(id: string) {
  const { data } = await api.get(`/api/admin/audit/${id}`);
  return data;
}

export async function searchAuditLogs(params: {
  q: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get('/api/admin/audit/search', { params });
  return data;
}

export async function exportAuditLogs(params?: {
  adminId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await api.get('/api/admin/audit/export', { params });
  return data;
}

export async function getAuditStats(days?: number) {
  const { data } = await api.get('/api/admin/audit/stats', { params: { days } });
  return data;
}

export async function getAdminActivitySummary(adminId: string, params?: {
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await api.get(`/api/admin/audit/admin/${adminId}`, { params });
  return data;
}

export async function getEntityAuditHistory(entityType: string, entityId: string) {
  const { data } = await api.get(`/api/admin/audit/entity/${entityType}/${entityId}`);
  return data;
}

// ============================================
// LIVE STREAMS
// ============================================

export async function getLiveStreams() {
  const { data } = await api.get('/api/admin/live-streams');
  return data;
}

export async function getLiveStream(id: string) {
  const { data } = await api.get(`/api/admin/live-streams/${id}`);
  return data;
}

export async function endLiveStream(id: string) {
  const { data } = await api.post(`/api/admin/live-streams/${id}/end`);
  return data;
}

// ============================================
// LEGACY ENDPOINTS (from original frontend)
// ============================================

export async function fetchPrograms() {
  const { data } = await api.get('/api/programs');
  return data?.programs ?? [];
}

export async function fetchChallenges() {
  const { data } = await api.get('/api/challenges');
  return data?.challenges ?? [];
}

export async function fetchPlanner() {
  try {
    const { data } = await api.get('/api/planner');
    return data?.entries ?? [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 402) {
      return [];
    }
    throw error;
  }
}

// ============================================
// FORUM / COMMUNITY
// ============================================

// Categories
export async function getForumCategories(params?: { includeInactive?: boolean; parentId?: string }) {
  const { data } = await api.get('/api/forum/categories', { params });
  return data;
}

export async function getForumCategoryBySlug(slug: string) {
  const { data } = await api.get(`/api/forum/categories/slug/${slug}`);
  return data;
}

export async function createForumCategory(payload: {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  parentId?: string;
}) {
  const { data } = await api.post('/api/forum/admin/categories', payload);
  return data;
}

export async function updateForumCategory(id: string, payload: {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
  parentId?: string;
}) {
  const { data } = await api.put(`/api/forum/admin/categories/${id}`, payload);
  return data;
}

export async function deleteForumCategory(id: string) {
  const { data } = await api.delete(`/api/forum/admin/categories/${id}`);
  return data;
}

// Topics
export async function getForumTopics(params?: {
  categoryId?: string;
  authorId?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  isFeatured?: boolean;
  tagIds?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { data } = await api.get('/api/forum/topics', { params });
  return data;
}

export async function getForumTopicById(id: string) {
  const { data } = await api.get(`/api/forum/topics/${id}`);
  return data;
}

export async function getForumTopicBySlug(slug: string) {
  const { data } = await api.get(`/api/forum/topics/slug/${slug}`);
  return data;
}

export async function updateForumTopic(id: string, payload: {
  title?: string;
  slug?: string;
  content?: string;
  categoryId?: string;
  isPinned?: boolean;
  isLocked?: boolean;
  isFeatured?: boolean;
  tagIds?: string[];
}) {
  const { data } = await api.put(`/api/forum/topics/${id}`, payload);
  return data;
}

export async function deleteForumTopic(id: string) {
  const { data } = await api.delete(`/api/forum/topics/${id}`);
  return data;
}

// Posts
export async function getForumPostsByTopic(topicId: string, params?: { page?: number; limit?: number }) {
  const { data } = await api.get(`/api/forum/topics/${topicId}/posts`, { params });
  return data;
}

export async function updateForumPost(id: string, payload: { content: string }) {
  const { data } = await api.put(`/api/forum/posts/${id}`, payload);
  return data;
}

export async function deleteForumPost(id: string) {
  const { data } = await api.delete(`/api/forum/posts/${id}`);
  return data;
}

// Tags
export async function getForumTags() {
  const { data } = await api.get('/api/forum/tags');
  return data;
}

export async function createForumTag(payload: { name: string; slug: string; color?: string }) {
  const { data } = await api.post('/api/forum/admin/tags', payload);
  return data;
}

export async function deleteForumTag(id: string) {
  const { data } = await api.delete(`/api/forum/admin/tags/${id}`);
  return data;
}

// Stats
export async function getForumStats() {
  const { data } = await api.get('/api/forum/stats');
  return data;
}

// ============================================
// CONTENT REPORTS (Community Moderation)
// ============================================

export async function getContentReports(params?: {
  status?: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  contentType?: 'TOPIC' | 'POST' | 'COMMENT' | 'USER';
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get('/api/reports/admin', { params });
  return data;
}

export async function getContentReportById(id: string) {
  const { data } = await api.get(`/api/reports/admin/${id}`);
  return data;
}

export async function getContentReportStats() {
  const { data } = await api.get('/api/reports/admin/stats');
  return data;
}

export async function resolveContentReport(id: string, payload: {
  action: 'WARNING' | 'CONTENT_REMOVED' | 'USER_SUSPENDED' | 'USER_BANNED' | 'NO_ACTION';
  notes?: string;
}) {
  const { data } = await api.post(`/api/reports/admin/${id}/resolve`, payload);
  return data;
}

export async function dismissContentReport(id: string) {
  const { data } = await api.post(`/api/reports/admin/${id}/dismiss`);
  return data;
}

export async function updateContentReportStatus(id: string, status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED') {
  const { data } = await api.put(`/api/reports/admin/${id}/status`, { status });
  return data;
}

export async function getUserReportHistory(userId: string) {
  const { data } = await api.get(`/api/reports/admin/users/${userId}/history`);
  return data;
}

// Admin Moderation Queue
export async function getContentReviewQueue(params?: {
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get('/api/admin/moderation/queue', { params });
  return data;
}

export async function bulkResolveReports(reportIds: string[], action: string, notes?: string) {
  const { data } = await api.post('/api/admin/moderation/reports/bulk-resolve', {
    reportIds,
    action,
    notes
  });
  return data;
}

// ============================================
// NOTIFICATIONS (Admin)
// ============================================

// Notification Preferences
export async function getNotificationPreferences() {
  const { data } = await api.get('/api/notification-preferences');
  return data;
}

export async function updateNotificationPreferences(payload: {
  emailEnabled?: boolean;
  smsEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  marketingEmails?: boolean;
  marketingSms?: boolean;
  challengeReminders?: boolean;
  challengeUpdates?: boolean;
  sessionReminders?: boolean;
  weeklyProgress?: boolean;
  newProgramAlerts?: boolean;
  communityUpdates?: boolean;
  paymentAlerts?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone?: string;
}) {
  const { data } = await api.put('/api/notification-preferences', payload);
  return data;
}

export async function resetNotificationPreferences() {
  const { data } = await api.post('/api/notification-preferences/reset');
  return data;
}

export async function getNotificationOptions() {
  const { data } = await api.get('/api/notification-preferences/options');
  return data;
}

export async function getQuietHoursStatus() {
  const { data } = await api.get('/api/notification-preferences/quiet-hours/status');
  return data;
}

// Push Notifications
export async function getPushNotificationStatus() {
  const { data } = await api.get('/api/push-notifications/status');
  return data;
}

export async function getRegisteredDevices() {
  const { data } = await api.get('/api/push-notifications/devices');
  return data;
}

export async function registerDevice(payload: {
  token: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  deviceName?: string;
}) {
  const { data } = await api.post('/api/push-notifications/devices', payload);
  return data;
}

export async function unregisterDevice(token: string) {
  const { data } = await api.delete('/api/push-notifications/devices', { data: { token } });
  return data;
}

export async function sendTestPushNotification(payload: {
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  const { data } = await api.post('/api/push-notifications/test', payload);
  return data;
}

// Bulk Notifications (Admin)
export async function sendBulkNotification(payload: {
  userIds?: string[];
  roles?: string[];
  title: string;
  body: string;
  channels?: ('push' | 'email' | 'inApp')[];
  type?: 'push' | 'email' | 'sms';
  targetAudience?: 'all' | 'subscribers' | 'free' | 'inactive';
  templateId?: string;
  data?: Record<string, string>;
}) {
  const { data } = await api.post('/api/admin/bulk/notifications/send', payload);
  return data;
}

// Notification History
export async function getNotificationHistory(params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}) {
  const { data } = await api.get('/api/admin/notifications/history', { params });
  return data;
}

export async function getNotificationStats() {
  const { data } = await api.get('/api/admin/notifications/stats');
  return data;
}

// ============================================
// CONTENT MANAGEMENT (Admin)
// ============================================

// Content Stats
export async function getContentStats() {
  const { data } = await api.get('/api/admin/content/stats');
  return data;
}

// Programs
export async function getAdminPrograms(params?: {
  page?: number;
  limit?: number;
  level?: string;
  status?: string;
  search?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/content/programs', { params });
  return data;
}

export async function getAdminProgramById(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/content/programs/${id}`);
  return data;
}

export async function publishProgram(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/content/programs/${id}/publish`);
  return data;
}

export async function unpublishProgram(id: string) {
  const { data } = await api.post(`/api/admin/dashboard/content/programs/${id}/unpublish`);
  return data;
}

// Classes
export async function getAdminClasses(params?: {
  page?: number;
  limit?: number;
  programId?: string;
  instructorId?: string;
  level?: string;
  search?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/content/classes', { params });
  return data;
}

export async function getAdminClassById(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/content/classes/${id}`);
  return data;
}

// Poses
export async function getAdminPoses(params?: {
  page?: number;
  limit?: number;
  difficulty?: string;
  bodyArea?: string;
  search?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/content/poses', { params });
  return data;
}

export async function getAdminPoseById(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/content/poses/${id}`);
  return data;
}

// Challenges
export async function getAdminChallenges(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const { data } = await api.get('/api/admin/dashboard/content/challenges', { params });
  return data;
}

export async function getAdminChallengeById(id: string) {
  const { data } = await api.get(`/api/admin/dashboard/content/challenges/${id}`);
  return data;
}

// ============================================
// INSTRUCTOR PORTAL
// ============================================

// Instructor Dashboard Stats
export async function getInstructorDashboard() {
  const { data } = await api.get('/api/instructor/dashboard');
  return data;
}

// Instructor's Own Classes
export async function getMyClasses(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const { data } = await api.get('/api/instructor/classes', { params });
  return data;
}

export async function getMyClassById(id: string) {
  const { data } = await api.get(`/api/instructor/classes/${id}`);
  return data;
}

export async function createMyClass(payload: {
  title: string;
  description: string;
  duration: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  videoUrl?: string;
  thumbnailUrl?: string;
  programId?: string;
  poseIds?: string[];
}) {
  const { data } = await api.post('/api/instructor/classes', payload);
  return data;
}

export async function updateMyClass(id: string, payload: Partial<{
  title: string;
  description: string;
  duration: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  videoUrl: string;
  thumbnailUrl: string;
  programId: string;
  poseIds: string[];
}>) {
  const { data } = await api.put(`/api/instructor/classes/${id}`, payload);
  return data;
}

export async function deleteMyClass(id: string) {
  const { data } = await api.delete(`/api/instructor/classes/${id}`);
  return data;
}

// Instructor's Own Programs
export async function getMyPrograms(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const { data } = await api.get('/api/instructor/programs', { params });
  return data;
}

export async function getMyProgramById(id: string) {
  const { data } = await api.get(`/api/instructor/programs/${id}`);
  return data;
}

export async function createMyProgram(payload: {
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationWeeks: number;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  tagIds?: string[];
}) {
  const { data } = await api.post('/api/instructor/programs', payload);
  return data;
}

export async function updateMyProgram(id: string, payload: Partial<{
  title: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationWeeks: number;
  thumbnailUrl: string;
  coverImageUrl: string;
  tagIds: string[];
}>) {
  const { data } = await api.put(`/api/instructor/programs/${id}`, payload);
  return data;
}

export async function deleteMyProgram(id: string) {
  const { data } = await api.delete(`/api/instructor/programs/${id}`);
  return data;
}

export async function submitProgramForReview(id: string) {
  const { data } = await api.post(`/api/instructor/programs/${id}/submit`);
  return data;
}

export async function submitClassForReview(id: string) {
  const { data } = await api.post(`/api/instructor/classes/${id}/submit`);
  return data;
}

// Instructor Analytics
export async function getMyAnalytics(params?: {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month';
}) {
  const { data } = await api.get('/api/instructor/analytics', { params });
  return data;
}

export async function getMyStudents(params?: {
  page?: number;
  limit?: number;
  classId?: string;
  programId?: string;
}) {
  const { data } = await api.get('/api/instructor/students', { params });
  return data;
}

export async function getMyEarnings(params?: {
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await api.get('/api/instructor/earnings', { params });
  return data;
}

// Instructor Profile
export async function getInstructorProfile() {
  const { data } = await api.get('/api/instructor/profile');
  return data;
}

export async function updateInstructorProfile(payload: {
  bio?: string;
  specialties?: string[];
  socialLinks?: { platform: string; url: string }[];
  avatarUrl?: string;
}) {
  const { data } = await api.put('/api/instructor/profile', payload);
  return data;
}

// Media Upload for Instructors
export async function uploadInstructorMedia(file: File, type: 'video' | 'image' | 'thumbnail') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  const { data } = await api.post('/api/instructor/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

// ============================================
// GAMIFICATION - ACHIEVEMENTS (Admin)
// ============================================

export async function getAchievements(params?: {
  page?: number;
  limit?: number;
  category?: string;
  isSecret?: boolean;
}) {
  const { data } = await api.get('/api/achievements', { params });
  return data;
}

export async function getAchievementById(id: string) {
  const { data } = await api.get(`/api/achievements/${id}`);
  return data;
}

export async function getAchievementCategories() {
  const { data } = await api.get('/api/achievements/categories');
  return data;
}

export async function createAchievement(payload: {
  name: string;
  description: string;
  category: string;
  icon?: string;
  xpReward: number;
  condition: string;
  conditionValue: number;
  isSecret?: boolean;
  badgeImageUrl?: string;
}) {
  const { data } = await api.post('/api/admin/gamification/achievements', payload);
  return data;
}

export async function updateAchievement(id: string, payload: Partial<{
  name: string;
  description: string;
  category: string;
  icon: string;
  xpReward: number;
  condition: string;
  conditionValue: number;
  isSecret: boolean;
  badgeImageUrl: string;
  isActive: boolean;
}>) {
  const { data } = await api.put(`/api/admin/gamification/achievements/${id}`, payload);
  return data;
}

export async function deleteAchievement(id: string) {
  const { data } = await api.delete(`/api/admin/gamification/achievements/${id}`);
  return data;
}

// ============================================
// GAMIFICATION - QUESTS (Admin)
// ============================================

export async function getQuests(params?: {
  page?: number;
  limit?: number;
  type?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIAL';
  isActive?: boolean;
}) {
  const { data } = await api.get('/api/admin/gamification/quests', { params });
  return data;
}

export async function createQuest(payload: {
  title: string;
  description: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIAL';
  xpReward: number;
  coinReward?: number;
  condition: string;
  conditionValue: number;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await api.post('/api/admin/gamification/quests', payload);
  return data;
}

export async function updateQuest(id: string, payload: Partial<{
  title: string;
  description: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SPECIAL';
  xpReward: number;
  coinReward: number;
  condition: string;
  conditionValue: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}>) {
  const { data } = await api.put(`/api/admin/gamification/quests/${id}`, payload);
  return data;
}

export async function deleteQuest(id: string) {
  const { data } = await api.delete(`/api/admin/gamification/quests/${id}`);
  return data;
}

// ============================================
// GAMIFICATION - LEADERBOARD
// ============================================

export async function getLeaderboard(params?: {
  type?: 'xp' | 'streak' | 'minutes' | 'sessions';
  period?: 'daily' | 'weekly' | 'monthly' | 'allTime';
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get('/api/leaderboard', { params });
  return data;
}

export async function getLeaderboardStats() {
  const { data } = await api.get('/api/leaderboard/stats');
  return data;
}

export async function getTopByMinutes(params?: { limit?: number }) {
  const { data } = await api.get('/api/leaderboard/top/minutes', { params });
  return data;
}

export async function getTopByStreaks(params?: { limit?: number }) {
  const { data } = await api.get('/api/leaderboard/top/streaks', { params });
  return data;
}

export async function getTopBySessions(params?: { limit?: number }) {
  const { data } = await api.get('/api/leaderboard/top/sessions', { params });
  return data;
}

export async function recalculateLeaderboardRanks() {
  const { data } = await api.post('/api/leaderboard/admin/recalculate');
  return data;
}

// ============================================
// GAMIFICATION - XP MANAGEMENT (Admin)
// ============================================

export async function adminAddXP(userId: string, payload: {
  amount: number;
  reason: string;
  source?: string;
}) {
  const { data } = await api.post(`/api/admin/gamification/users/${userId}/xp/add`, payload);
  return data;
}

export async function adminDeductXP(userId: string, payload: {
  amount: number;
  reason: string;
}) {
  const { data } = await api.post(`/api/admin/gamification/users/${userId}/xp/deduct`, payload);
  return data;
}

export async function adminGrantStreakFreeze(userId: string, payload: {
  count: number;
  reason?: string;
}) {
  const { data } = await api.post(`/api/admin/gamification/users/${userId}/streak/freeze`, payload);
  return data;
}

// ============================================
// GAMIFICATION - SHOP MANAGEMENT (Admin)
// ============================================

export async function getShopItems(params?: {
  page?: number;
  limit?: number;
  category?: string;
  isActive?: boolean;
}) {
  const { data } = await api.get('/api/shop', { params });
  return data;
}

export async function getShopItemById(id: string) {
  const { data } = await api.get(`/api/shop/item/${id}`);
  return data;
}

export async function getShopStats() {
  const { data } = await api.get('/api/admin/gamification/shop/stats');
  return data;
}

export async function createShopItem(payload: {
  name: string;
  description: string;
  category: 'STREAK_FREEZE' | 'XP_BOOST' | 'COSMETIC' | 'PREMIUM_CONTENT';
  price: number;
  currency: 'COINS' | 'GEMS';
  imageUrl?: string;
  isLimitedTime?: boolean;
  availableUntil?: string;
  maxPurchases?: number;
}) {
  const { data } = await api.post('/api/admin/gamification/shop/items', payload);
  return data;
}

export async function updateShopItem(id: string, payload: Partial<{
  name: string;
  description: string;
  category: 'STREAK_FREEZE' | 'XP_BOOST' | 'COSMETIC' | 'PREMIUM_CONTENT';
  price: number;
  currency: 'COINS' | 'GEMS';
  imageUrl: string;
  isLimitedTime: boolean;
  availableUntil: string;
  maxPurchases: number;
  isActive: boolean;
}>) {
  const { data } = await api.put(`/api/admin/gamification/shop/items/${id}`, payload);
  return data;
}

export async function deleteShopItem(id: string) {
  const { data } = await api.delete(`/api/admin/gamification/shop/items/${id}`);
  return data;
}

// ============================================
// GAMIFICATION - DAILY REWARDS (Admin)
// ============================================

export async function getDailyRewards() {
  const { data } = await api.get('/api/admin/gamification/daily-rewards');
  return data;
}

export async function createDailyReward(payload: {
  day: number;
  xpReward: number;
  coinReward?: number;
  bonusType?: string;
  bonusValue?: number;
  isMilestone?: boolean;
}) {
  const { data } = await api.post('/api/admin/gamification/daily-rewards', payload);
  return data;
}

export async function updateDailyReward(id: string, payload: Partial<{
  day: number;
  xpReward: number;
  coinReward: number;
  bonusType: string;
  bonusValue: number;
  isMilestone: boolean;
}>) {
  const { data } = await api.put(`/api/admin/gamification/daily-rewards/${id}`, payload);
  return data;
}

export async function deleteDailyReward(id: string) {
  const { data } = await api.delete(`/api/admin/gamification/daily-rewards/${id}`);
  return data;
}

export async function seedDailyRewards() {
  const { data } = await api.post('/api/admin/gamification/daily-rewards/seed');
  return data;
}

export async function resetUserDailyRewards(userId: string) {
  const { data } = await api.post(`/api/admin/gamification/users/${userId}/daily-rewards/reset`);
  return data;
}

// ============================================
// GAMIFICATION - EVENTS (Admin)
// ============================================

export async function getGamificationEvents(params?: {
  page?: number;
  limit?: number;
  isActive?: boolean;
}) {
  const { data } = await api.get('/api/event', { params });
  return data;
}

export async function createGamificationEvent(payload: {
  name: string;
  description: string;
  type: 'XP_BOOST' | 'DOUBLE_COINS' | 'SPECIAL_QUEST' | 'BONUS_REWARDS';
  multiplier?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}) {
  const { data } = await api.post('/api/admin/gamification/events', payload);
  return data;
}

export async function updateGamificationEvent(id: string, payload: Partial<{
  name: string;
  description: string;
  type: 'XP_BOOST' | 'DOUBLE_COINS' | 'SPECIAL_QUEST' | 'BONUS_REWARDS';
  multiplier: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}>) {
  const { data } = await api.put(`/api/admin/gamification/events/${id}`, payload);
  return data;
}

export async function deleteGamificationEvent(id: string) {
  const { data } = await api.delete(`/api/admin/gamification/events/${id}`);
  return data;
}

export async function getGamificationEventStats(id: string) {
  const { data } = await api.get(`/api/admin/gamification/events/${id}/stats`);
  return data;
}

// ============================================
// GAMIFICATION - TITLES & FRAMES (Admin)
// ============================================

export async function getTitles(params?: { page?: number; limit?: number }) {
  const { data } = await api.get('/api/customization/titles', { params });
  return data;
}

export async function createTitle(payload: {
  name: string;
  description?: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  requirement?: string;
  isDefault?: boolean;
}) {
  const { data } = await api.post('/api/admin/gamification/titles', payload);
  return data;
}

export async function updateTitle(id: string, payload: Partial<{
  name: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  requirement: string;
  isDefault: boolean;
  isActive: boolean;
}>) {
  const { data } = await api.put(`/api/admin/gamification/titles/${id}`, payload);
  return data;
}

export async function deleteTitle(id: string) {
  const { data } = await api.delete(`/api/admin/gamification/titles/${id}`);
  return data;
}

export async function grantTitleToUser(userId: string, titleId: string) {
  const { data } = await api.post(`/api/admin/gamification/users/${userId}/titles`, { titleId });
  return data;
}

export async function getFrames(params?: { page?: number; limit?: number }) {
  const { data } = await api.get('/api/customization/frames', { params });
  return data;
}

export async function createFrame(payload: {
  name: string;
  imageUrl: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  requirement?: string;
  isDefault?: boolean;
}) {
  const { data } = await api.post('/api/admin/gamification/frames', payload);
  return data;
}

export async function updateFrame(id: string, payload: Partial<{
  name: string;
  imageUrl: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  requirement: string;
  isDefault: boolean;
  isActive: boolean;
}>) {
  const { data } = await api.put(`/api/admin/gamification/frames/${id}`, payload);
  return data;
}

export async function deleteFrame(id: string) {
  const { data } = await api.delete(`/api/admin/gamification/frames/${id}`);
  return data;
}

export async function grantFrameToUser(userId: string, frameId: string) {
  const { data } = await api.post(`/api/admin/gamification/users/${userId}/frames`, { frameId });
  return data;
}

// ============================================
// GAMIFICATION - REFERRAL (Admin)
// ============================================

export async function getReferralLeaderboard(params?: {
  page?: number;
  limit?: number;
}) {
  const { data } = await api.get('/api/referrals/leaderboard', { params });
  return data;
}

export async function updateUserReferralSettings(userId: string, payload: {
  customCode?: string;
  isActive?: boolean;
  bonusMultiplier?: number;
}) {
  const { data } = await api.put(`/api/admin/gamification/users/${userId}/referral`, payload);
  return data;
}

// ============================================
// PODCASTS (Admin)
// ============================================

export async function getAdminPodcasts(params?: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  hostId?: string;
  q?: string;
}) {
  const { data } = await api.get('/api/admin/podcasts', { params });
  return data;
}

export async function getAdminPodcastById(id: string) {
  const { data } = await api.get(`/api/admin/podcasts/${id}`);
  return data;
}

export async function createPodcast(payload: {
  title: string;
  description: string;
  shortDescription?: string;
  coverImage?: string;
  category: string;
  hostName?: string;
  hostBio?: string;
  isExplicit?: boolean;
  language?: string;
  websiteUrl?: string;
  rssEnabled?: boolean;
  tagIds?: string[];
}) {
  const { data } = await api.post('/api/admin/podcasts', payload);
  return data;
}

export async function updatePodcast(id: string, payload: Partial<{
  title: string;
  description: string;
  shortDescription: string;
  coverImage: string;
  category: string;
  hostName: string;
  hostBio: string;
  isExplicit: boolean;
  language: string;
  websiteUrl: string;
  rssEnabled: boolean;
  status: string;
  tagIds: string[];
}>) {
  const { data } = await api.put(`/api/admin/podcasts/${id}`, payload);
  return data;
}

export async function deletePodcast(id: string) {
  const { data } = await api.delete(`/api/admin/podcasts/${id}`);
  return data;
}

export async function publishPodcast(id: string) {
  const { data } = await api.post(`/api/admin/podcasts/${id}/publish`);
  return data;
}

export async function unpublishPodcast(id: string) {
  const { data } = await api.post(`/api/admin/podcasts/${id}/unpublish`);
  return data;
}

export async function getPodcastAnalytics(id: string, params?: {
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await api.get(`/api/admin/podcasts/${id}/analytics`, { params });
  return data;
}

// Episodes
export async function getAdminEpisodes(podcastId: string, params?: {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}) {
  const { data } = await api.get(`/api/admin/podcasts/${podcastId}/episodes`, { params });
  return data;
}

export async function getAdminEpisodeById(podcastId: string, episodeId: string) {
  const { data } = await api.get(`/api/admin/podcasts/${podcastId}/episodes/${episodeId}`);
  return data;
}

export async function createEpisode(podcastId: string, payload: {
  title: string;
  description: string;
  audioUrl?: string;
  audioFormat?: string;
  audioSize?: number;
  duration?: number;
  isExplicit?: boolean;
  seasonNumber?: number;
  episodeNumber?: number;
  publishAt?: string;
}) {
  const { data } = await api.post(`/api/admin/podcasts/${podcastId}/episodes`, payload);
  return data;
}

export async function updateEpisode(podcastId: string, episodeId: string, payload: Partial<{
  title: string;
  description: string;
  audioUrl: string;
  audioFormat: string;
  audioSize: number;
  duration: number;
  isExplicit: boolean;
  seasonNumber: number;
  episodeNumber: number;
  publishAt: string;
  status: string;
}>) {
  const { data } = await api.put(`/api/admin/podcasts/${podcastId}/episodes/${episodeId}`, payload);
  return data;
}

export async function deleteEpisode(podcastId: string, episodeId: string) {
  const { data } = await api.delete(`/api/admin/podcasts/${podcastId}/episodes/${episodeId}`);
  return data;
}

export async function publishEpisode(podcastId: string, episodeId: string) {
  const { data } = await api.post(`/api/admin/podcasts/${podcastId}/episodes/${episodeId}/publish`);
  return data;
}

// Audio Upload
export async function getPodcastAudioUploadUrl(filename: string, contentType: string) {
  const { data } = await api.post('/api/media/upload', {
    filename,
    contentType,
    type: 'podcast'
  });
  return data as { upload: { uploadUrl: string; fileUrl: string; expiresAt: string } };
}

// ============================================
// WELLNESS - MEDITATIONS (Admin)
// ============================================

export async function getAdminMeditations(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  instructorId?: string;
  difficulty?: string;
  isPremium?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { data } = await api.get('/api/admin/meditations', { params });
  return data;
}

export async function getAdminMeditationById(id: string) {
  const { data } = await api.get(`/api/admin/meditations/${id}`);
  return data;
}

export async function createMeditation(payload: {
  categoryId: string;
  instructorId?: string;
  title: string;
  titleTr?: string;
  slug: string;
  description: string;
  descriptionTr?: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationSeconds: number;
  audioUrl: string;
  audioUrlTr?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  backgroundMusicUrl?: string;
  isFree?: boolean;
  isPremium?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  tags?: string[];
  benefits?: string[];
  benefitsTr?: string[];
}) {
  const { data } = await api.post('/api/admin/meditations', payload);
  return data;
}

export async function updateMeditation(id: string, payload: Partial<{
  categoryId: string;
  instructorId: string;
  title: string;
  titleTr: string;
  slug: string;
  description: string;
  descriptionTr: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  durationSeconds: number;
  audioUrl: string;
  audioUrlTr: string;
  imageUrl: string;
  thumbnailUrl: string;
  backgroundMusicUrl: string;
  isFree: boolean;
  isPremium: boolean;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  tags: string[];
  benefits: string[];
  benefitsTr: string[];
}>) {
  const { data } = await api.put(`/api/admin/meditations/${id}`, payload);
  return data;
}

export async function deleteMeditation(id: string) {
  const { data } = await api.delete(`/api/admin/meditations/${id}`);
  return data;
}

export async function getMeditationStats() {
  const { data } = await api.get('/api/admin/meditations/stats');
  return data;
}

// Meditation Categories
export async function getMeditationCategories(params?: {
  includeInactive?: boolean;
}) {
  const { data } = await api.get('/api/admin/meditations/categories', { params });
  return data;
}

export async function createMeditationCategory(payload: {
  name: string;
  nameTr?: string;
  slug: string;
  description?: string;
  descriptionTr?: string;
  iconUrl?: string;
  imageUrl?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const { data } = await api.post('/api/admin/meditations/categories', payload);
  return data;
}

export async function updateMeditationCategory(id: string, payload: Partial<{
  name: string;
  nameTr: string;
  slug: string;
  description: string;
  descriptionTr: string;
  iconUrl: string;
  imageUrl: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
}>) {
  const { data } = await api.put(`/api/admin/meditations/categories/${id}`, payload);
  return data;
}

export async function deleteMeditationCategory(id: string) {
  const { data } = await api.delete(`/api/admin/meditations/categories/${id}`);
  return data;
}

// ============================================
// WELLNESS - BREATHWORK (Admin)
// ============================================

export async function getAdminBreathwork(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  pattern?: string;
  difficulty?: string;
  isPremium?: boolean;
  isPublished?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { data } = await api.get('/api/admin/breathwork', { params });
  return data;
}

export async function getAdminBreathworkById(id: string) {
  const { data } = await api.get(`/api/admin/breathwork/${id}`);
  return data;
}

export async function createBreathwork(payload: {
  title: string;
  titleTr?: string;
  slug: string;
  description: string;
  descriptionTr?: string;
  category: string;
  pattern: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  cycles: number;
  coverImage?: string;
  audioUrl?: string;
  animationType?: string;
  primaryColor?: string;
  secondaryColor?: string;
  benefits?: string[];
  tags?: string[];
  isPremium?: boolean;
  isFeatured?: boolean;
  isPublished?: boolean;
}) {
  const { data } = await api.post('/api/admin/breathwork', payload);
  return data;
}

export async function updateBreathwork(id: string, payload: Partial<{
  title: string;
  titleTr: string;
  slug: string;
  description: string;
  descriptionTr: string;
  category: string;
  pattern: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  cycles: number;
  coverImage: string;
  audioUrl: string;
  animationType: string;
  primaryColor: string;
  secondaryColor: string;
  benefits: string[];
  tags: string[];
  isPremium: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  isActive: boolean;
}>) {
  const { data } = await api.put(`/api/admin/breathwork/${id}`, payload);
  return data;
}

export async function deleteBreathwork(id: string) {
  const { data } = await api.delete(`/api/admin/breathwork/${id}`);
  return data;
}

export async function getBreathworkStats() {
  const { data } = await api.get('/api/admin/breathwork/stats');
  return data;
}

// ============================================
// WELLNESS - SOUNDSCAPES (Admin)
// ============================================

export async function getAdminSoundscapes(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isLoop?: boolean;
  isMixable?: boolean;
  isPremium?: boolean;
  isPublished?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { data } = await api.get('/api/admin/soundscapes', { params });
  return data;
}

export async function getAdminSoundscapeById(id: string) {
  const { data } = await api.get(`/api/admin/soundscapes/${id}`);
  return data;
}

export async function createSoundscape(payload: {
  title: string;
  titleTr?: string;
  slug: string;
  category: string;
  audioUrl: string;
  coverImage?: string;
  duration?: number;
  isLoop?: boolean;
  isMixable?: boolean;
  defaultVolume?: number;
  tags?: string[];
  isPremium?: boolean;
  isPublished?: boolean;
}) {
  const { data } = await api.post('/api/admin/soundscapes', payload);
  return data;
}

export async function updateSoundscape(id: string, payload: Partial<{
  title: string;
  titleTr: string;
  slug: string;
  category: string;
  audioUrl: string;
  coverImage: string;
  duration: number;
  isLoop: boolean;
  isMixable: boolean;
  defaultVolume: number;
  tags: string[];
  isPremium: boolean;
  isPublished: boolean;
  isActive: boolean;
}>) {
  const { data } = await api.put(`/api/admin/soundscapes/${id}`, payload);
  return data;
}

export async function deleteSoundscape(id: string) {
  const { data } = await api.delete(`/api/admin/soundscapes/${id}`);
  return data;
}

export async function getSoundscapeStats() {
  const { data } = await api.get('/api/admin/soundscapes/stats');
  return data;
}

// ============================================
// MEDIA LIBRARY
// ============================================

export type MediaUploadType = 'video' | 'image' | 'thumbnail' | 'pose' | 'podcast';

export async function getMediaUploadUrl(
  filename: string,
  contentType: string,
  type: MediaUploadType = 'image'
) {
  const { data } = await api.post('/api/media/upload', {
    filename,
    contentType,
    type
  });
  return data as {
    message: string;
    upload: {
      id: string;
      uploadUrl: string;
      fileUrl: string;
      expiresAt: string;
      key: string;
    };
  };
}

export async function getMediaUrl(id: string) {
  const { data } = await api.get(`/api/media/${id}`);
  return data as { id: string; fileUrl: string; message: string };
}

export async function getSignedMediaUrl(id: string) {
  const { data } = await api.get(`/api/media/${id}/signed`);
  return data as { message: string; signedUrl: string; expiresIn: number };
}

// Helper function to upload file directly to local storage
export async function uploadMediaToS3(
  file: File,
  type: MediaUploadType = 'image',
  onProgress?: (progress: number) => void
): Promise<{ fileUrl: string; key: string }> {
  // Use local upload endpoint with FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const { data } = await api.post('/api/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress);
      }
    },
  });

  return { fileUrl: data.upload.fileUrl, key: data.upload.key };
}

// ============================================
// WELLNESS - SLEEP STORIES (Admin)
// ============================================

export async function getAdminSleepStories(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isPremium?: boolean;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { data } = await api.get('/api/admin/sleep-stories', { params });
  return data;
}

export async function getAdminSleepStoryById(id: string) {
  const { data } = await api.get(`/api/admin/sleep-stories/${id}`);
  return data;
}

export async function createSleepStory(payload: {
  title: string;
  titleEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  category: string;
  narratorName?: string;
  duration: number;
  audioUrl: string;
  coverImageUrl?: string;
  backgroundSoundId?: string;
  tags?: string[];
  isPremium?: boolean;
  isFeatured?: boolean;
  isPublished?: boolean;
}) {
  const { data } = await api.post('/api/admin/sleep-stories', payload);
  return data;
}

export async function updateSleepStory(id: string, payload: Partial<{
  title: string;
  titleEn: string;
  slug: string;
  description: string;
  descriptionEn: string;
  category: string;
  narratorName: string;
  duration: number;
  audioUrl: string;
  coverImageUrl: string;
  backgroundSoundId: string;
  tags: string[];
  isPremium: boolean;
  isFeatured: boolean;
  isPublished: boolean;
}>) {
  const { data } = await api.put(`/api/admin/sleep-stories/${id}`, payload);
  return data;
}

export async function deleteSleepStory(id: string) {
  const { data } = await api.delete(`/api/admin/sleep-stories/${id}`);
  return data;
}

export async function getSleepStoryStats() {
  const { data } = await api.get('/api/admin/sleep-stories/stats');
  return data;
}

// ============================================
// WELLNESS - TIMER PRESETS (Admin)
// ============================================

export async function getAdminTimerPresets(params?: {
  page?: number;
  limit?: number;
  isSystem?: boolean;
}) {
  const { data } = await api.get('/api/admin/timer-presets', { params });
  return data;
}

export async function getAdminTimerPresetById(id: string) {
  const { data } = await api.get(`/api/admin/timer-presets/${id}`);
  return data;
}

export async function createTimerPreset(payload: {
  name: string;
  nameEn?: string;
  description?: string;
  icon?: string;
  color?: string;
  duration: number;
  intervalBell?: number;
  startBell?: string;
  endBell?: string;
  intervalBellSound?: string;
  backgroundSoundId?: string;
  backgroundVolume?: number;
  isSystem?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}) {
  const { data } = await api.post('/api/admin/timer-presets', payload);
  return data;
}

export async function updateTimerPreset(id: string, payload: Partial<{
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  duration: number;
  intervalBell: number;
  startBell: string;
  endBell: string;
  intervalBellSound: string;
  backgroundSoundId: string;
  backgroundVolume: number;
  isSystem: boolean;
  isDefault: boolean;
  sortOrder: number;
}>) {
  const { data } = await api.put(`/api/admin/timer-presets/${id}`, payload);
  return data;
}

export async function deleteTimerPreset(id: string) {
  const { data } = await api.delete(`/api/admin/timer-presets/${id}`);
  return data;
}

export async function reorderTimerPresets(presetIds: string[]) {
  const { data } = await api.put('/api/admin/timer-presets/reorder', { presetIds });
  return data;
}

export async function getTimerPresetStats() {
  const { data } = await api.get('/api/admin/timer-presets/stats');
  return data;
}

// ============================================
// JOURNAL PROMPTS (Admin)
// ============================================

export async function getAdminJournalPrompts(params?: {
  page?: number;
  limit?: number;
  type?: string;
  category?: string;
  isActive?: boolean;
}) {
  const { data } = await api.get('/api/admin/journal-prompts', { params });
  return data;
}

export async function getAdminJournalPromptById(id: string) {
  const { data } = await api.get(`/api/admin/journal-prompts/${id}`);
  return data;
}

export async function createJournalPrompt(payload: {
  prompt: string;
  promptEn?: string;
  type: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const { data } = await api.post('/api/admin/journal-prompts', payload);
  return data;
}

export async function updateJournalPrompt(id: string, payload: Partial<{
  prompt: string;
  promptEn: string;
  type: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}>) {
  const { data } = await api.put(`/api/admin/journal-prompts/${id}`, payload);
  return data;
}

export async function deleteJournalPrompt(id: string) {
  const { data } = await api.delete(`/api/admin/journal-prompts/${id}`);
  return data;
}

export async function reorderJournalPrompts(promptIds: string[]) {
  const { data } = await api.put('/api/admin/journal-prompts/reorder', { promptIds });
  return data;
}

export async function getJournalPromptStats() {
  const { data } = await api.get('/api/admin/journal-prompts/stats');
  return data;
}

// ============================================
// DAILY QUOTES (Admin)
// ============================================

export async function getAdminDailyQuotes(params?: {
  page?: number;
  limit?: number;
  category?: string;
  language?: string;
  isActive?: boolean;
}) {
  const { data } = await api.get('/api/admin/daily-quotes', { params });
  return data;
}

export async function getAdminDailyQuoteById(id: string) {
  const { data } = await api.get(`/api/admin/daily-quotes/${id}`);
  return data;
}

export async function createDailyQuote(payload: {
  text: string;
  textEn?: string;
  author?: string;
  category?: string;
  language?: string;
  scheduledDate?: string;
  isActive?: boolean;
}) {
  const { data } = await api.post('/api/admin/daily-quotes', payload);
  return data;
}

export async function updateDailyQuote(id: string, payload: Partial<{
  text: string;
  textEn: string;
  author: string;
  category: string;
  language: string;
  scheduledDate: string;
  isActive: boolean;
}>) {
  const { data } = await api.put(`/api/admin/daily-quotes/${id}`, payload);
  return data;
}

export async function deleteDailyQuote(id: string) {
  const { data } = await api.delete(`/api/admin/daily-quotes/${id}`);
  return data;
}

export async function getDailyQuoteStats() {
  const { data } = await api.get('/api/admin/daily-quotes/stats');
  return data;
}

// ============================================
// DAILY CONTENT (Admin)
// ============================================

export async function getAdminDailyContent(params?: {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  isPublished?: boolean;
}) {
  const { data } = await api.get('/api/admin/daily-content', { params });
  return data;
}

export async function getAdminDailyContentByDate(date: string) {
  const { data } = await api.get(`/api/admin/daily-content/${date}`);
  return data;
}

export async function createDailyContent(payload: {
  date: string;
  quoteId?: string;
  meditationId?: string;
  breathworkId?: string;
  tip?: string;
  tipEn?: string;
  challenge?: string;
  challengeEn?: string;
  isPublished?: boolean;
}) {
  const { data } = await api.post('/api/admin/daily-content', payload);
  return data;
}

export async function updateDailyContent(id: string, payload: Partial<{
  date: string;
  quoteId: string;
  meditationId: string;
  breathworkId: string;
  tip: string;
  tipEn: string;
  challenge: string;
  challengeEn: string;
  isPublished: boolean;
}>) {
  const { data } = await api.put(`/api/admin/daily-content/${id}`, payload);
  return data;
}

export async function deleteDailyContent(id: string) {
  const { data } = await api.delete(`/api/admin/daily-content/${id}`);
  return data;
}

export async function autoGenerateDailyContent(params: {
  startDate: string;
  endDate: string;
}) {
  const { data } = await api.post('/api/admin/daily-content/auto-generate', params);
  return data;
}

export async function copyDailyContent(fromDate: string, toDate: string) {
  const { data } = await api.post('/api/admin/daily-content/copy', { fromDate, toDate });
  return data;
}

export async function getDailyContentStats() {
  const { data } = await api.get('/api/admin/daily-content/stats');
  return data;
}

// ============================================
// PLAYLISTS (Admin)
// ============================================

export async function getAdminPlaylists(params?: {
  page?: number;
  limit?: number;
  type?: string;
  contentType?: string;
  isSystem?: boolean;
  isPublic?: boolean;
  isFeatured?: boolean;
}) {
  const { data } = await api.get('/api/admin/playlists', { params });
  return data;
}

export async function getAdminPlaylistById(id: string) {
  const { data } = await api.get(`/api/admin/playlists/${id}`);
  return data;
}

export async function createPlaylist(payload: {
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  coverImage?: string;
  color?: string;
  type: string;
  contentType: string;
  isSystem?: boolean;
  isPublic?: boolean;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
}) {
  const { data } = await api.post('/api/admin/playlists', payload);
  return data;
}

export async function updatePlaylist(id: string, payload: Partial<{
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  coverImage: string;
  color: string;
  type: string;
  contentType: string;
  isSystem: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
}>) {
  const { data } = await api.put(`/api/admin/playlists/${id}`, payload);
  return data;
}

export async function deletePlaylist(id: string) {
  const { data } = await api.delete(`/api/admin/playlists/${id}`);
  return data;
}

export async function getPlaylistStats() {
  const { data } = await api.get('/api/admin/playlists/stats');
  return data;
}

// Playlist Items
export async function addPlaylistItem(playlistId: string, payload: {
  contentType: string;
  contentId: string;
  note?: string;
}) {
  const { data } = await api.post(`/api/admin/playlists/${playlistId}/items`, payload);
  return data;
}

export async function updatePlaylistItem(playlistId: string, itemId: string, payload: {
  note?: string;
}) {
  const { data } = await api.put(`/api/admin/playlists/${playlistId}/items/${itemId}`, payload);
  return data;
}

export async function removePlaylistItem(playlistId: string, itemId: string) {
  const { data } = await api.delete(`/api/admin/playlists/${playlistId}/items/${itemId}`);
  return data;
}

export async function reorderPlaylistItems(playlistId: string, itemIds: string[]) {
  const { data } = await api.put(`/api/admin/playlists/${playlistId}/items/reorder`, { itemIds });
  return data;
}

// ============================================
// MOOD ENTRIES (Admin - Read Only)
// ============================================

export async function getAdminMoodEntries(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  mood?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await api.get('/api/admin/mood-entries', { params });
  return data;
}

export async function getMoodEntryStats() {
  const { data } = await api.get('/api/admin/mood-entries/stats');
  return data;
}

// ============================================
// USER GOALS (Admin - Read Only)
// ============================================

export async function getAdminUserGoals(params?: {
  page?: number;
  limit?: number;
  userId?: string;
  type?: string;
  isActive?: boolean;
  isCompleted?: boolean;
}) {
  const { data } = await api.get('/api/admin/user-goals', { params });
  return data;
}

export async function getUserGoalStats() {
  const { data } = await api.get('/api/admin/user-goals/stats');
  return data;
}

// ============================================
// ONBOARDING CONFIG
// ============================================

export async function getOnboardingConfig() {
  const { data } = await api.get('/api/admin/onboarding/config');
  return data;
}

export async function updateOnboardingConfig(payload: any) {
  const { data } = await api.put('/api/admin/onboarding/config', payload);
  return data;
}

export async function getOnboardingStats(params?: { period?: string }) {
  const { data } = await api.get('/api/admin/onboarding/stats', { params });
  return data;
}

// ============================================
// GOAL TEMPLATES
// ============================================

export async function getAdminGoalTemplates(params?: {
  page?: number;
  limit?: number;
  type?: string;
  period?: string;
  isActive?: boolean;
}) {
  const { data } = await api.get('/api/admin/goal-templates', { params });
  return data;
}

export async function getAdminGoalTemplateById(id: string) {
  const { data } = await api.get(`/api/admin/goal-templates/${id}`);
  return data;
}

export async function createGoalTemplate(payload: any) {
  const { data } = await api.post('/api/admin/goal-templates', payload);
  return data;
}

export async function updateGoalTemplate(id: string, payload: any) {
  const { data } = await api.put(`/api/admin/goal-templates/${id}`, payload);
  return data;
}

export async function deleteGoalTemplate(id: string) {
  const { data } = await api.delete(`/api/admin/goal-templates/${id}`);
  return data;
}

// ============================================
// REMINDER TEMPLATES
// ============================================

export async function getAdminReminderTemplates(params?: {
  page?: number;
  limit?: number;
  type?: string;
  isActive?: boolean;
}) {
  const { data } = await api.get('/api/admin/reminder-templates', { params });
  return data;
}

export async function getAdminReminderTemplateById(id: string) {
  const { data } = await api.get(`/api/admin/reminder-templates/${id}`);
  return data;
}

export async function createReminderTemplate(payload: any) {
  const { data } = await api.post('/api/admin/reminder-templates', payload);
  return data;
}

export async function updateReminderTemplate(id: string, payload: any) {
  const { data } = await api.put(`/api/admin/reminder-templates/${id}`, payload);
  return data;
}

export async function deleteReminderTemplate(id: string) {
  const { data } = await api.delete(`/api/admin/reminder-templates/${id}`);
  return data;
}

export default api;
