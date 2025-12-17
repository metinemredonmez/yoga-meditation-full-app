'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

// Connection status types
export type SocketStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

// Status listeners
type StatusListener = (status: SocketStatus) => void;
const statusListeners: Set<StatusListener> = new Set();
let currentStatus: SocketStatus = 'disconnected';

function updateStatus(status: SocketStatus) {
  currentStatus = status;
  statusListeners.forEach(listener => listener(status));
}

export function getSocket(): Socket | null {
  return socket;
}

export function getSocketStatus(): SocketStatus {
  return currentStatus;
}

export function onSocketStatusChange(listener: StatusListener): () => void {
  statusListeners.add(listener);
  // Return unsubscribe function
  return () => statusListeners.delete(listener);
}

export function connectSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

  updateStatus('connecting');

  // Socket.io will use HttpOnly cookies for authentication
  // withCredentials: true ensures cookies are sent with the connection
  socket = io(baseUrl, {
    withCredentials: true, // Essential for HttpOnly cookie auth
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity, // Keep trying to reconnect
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    updateStatus('connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    updateStatus('disconnected');

    // Auto-reconnect on certain disconnect reasons
    if (reason === 'io server disconnect') {
      // Server initiated disconnect, try to reconnect
      socket?.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
    updateStatus('error');
  });

  socket.io.on('reconnect_attempt', (attemptNumber) => {
    console.log('[Socket] Reconnection attempt:', attemptNumber);
    updateStatus('connecting');
  });

  socket.io.on('reconnect', (attemptNumber) => {
    console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    updateStatus('connected');
  });

  socket.io.on('reconnect_error', (error) => {
    console.error('[Socket] Reconnection error:', error.message);
    updateStatus('error');
  });

  socket.io.on('reconnect_failed', () => {
    console.error('[Socket] Reconnection failed');
    updateStatus('error');
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    updateStatus('disconnected');
  }
}

export function updateSocketAuth(): void {
  // With HttpOnly cookies, we just need to reconnect
  // The browser will automatically include the new cookies
  if (socket) {
    updateStatus('connecting');
    socket.disconnect().connect();
  }
}

export function forceReconnect(): void {
  if (socket) {
    updateStatus('connecting');
    socket.disconnect();
    socket.connect();
  }
}

// Event types
export interface NotificationEvent {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface DashboardStatsEvent {
  totalUsers: number;
  activeUsers: number;
  newSignups: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

export interface UserPresenceEvent {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
}

export interface LiveStreamEvent {
  streamId: string;
  viewerCount: number;
  status: 'live' | 'ended' | 'scheduled';
  chatMessage?: {
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
  };
}

export interface ActivityEvent {
  id: string;
  type: string;
  userId: string;
  userName: string;
  action: string;
  target?: string;
  timestamp: string;
}

// Socket event names
export const SOCKET_EVENTS = {
  // Notifications
  NOTIFICATION: 'notification',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_READ_ALL: 'notification:read-all',

  // Dashboard
  DASHBOARD_STATS: 'dashboard:stats',
  DASHBOARD_ACTIVITY: 'dashboard:activity',

  // User Presence
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_PRESENCE: 'user:presence',

  // Live Streams
  STREAM_STARTED: 'stream:started',
  STREAM_ENDED: 'stream:ended',
  STREAM_VIEWER_COUNT: 'stream:viewer-count',
  STREAM_CHAT: 'stream:chat',

  // Admin Events
  NEW_USER: 'admin:new-user',
  NEW_PAYMENT: 'admin:new-payment',
  NEW_SUBSCRIPTION: 'admin:new-subscription',
  NEW_REPORT: 'admin:new-report',
} as const;
