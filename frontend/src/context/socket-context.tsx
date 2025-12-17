'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  SOCKET_EVENTS,
  NotificationEvent,
  DashboardStatsEvent,
  UserPresenceEvent,
  LiveStreamEvent,
  ActivityEvent,
} from '@/lib/socket';
import { getAccessToken } from '@/lib/auth';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: NotificationEvent[];
  unreadCount: number;
  dashboardStats: DashboardStatsEvent | null;
  recentActivities: ActivityEvent[];
  onlineUsers: Map<string, UserPresenceEvent>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsEvent | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityEvent[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserPresenceEvent>>(new Map());

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Initialize socket connection
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    const socketInstance = connectSocket();
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Notification events
    socketInstance.on(SOCKET_EVENTS.NOTIFICATION, (notification: NotificationEvent) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50
    });

    // Dashboard stats
    socketInstance.on(SOCKET_EVENTS.DASHBOARD_STATS, (stats: DashboardStatsEvent) => {
      setDashboardStats(stats);
    });

    // Activity events
    socketInstance.on(SOCKET_EVENTS.DASHBOARD_ACTIVITY, (activity: ActivityEvent) => {
      setRecentActivities((prev) => [activity, ...prev].slice(0, 20)); // Keep last 20
    });

    // User presence events
    socketInstance.on(SOCKET_EVENTS.USER_ONLINE, (presence: UserPresenceEvent) => {
      setOnlineUsers((prev) => new Map(prev).set(presence.userId, presence));
    });

    socketInstance.on(SOCKET_EVENTS.USER_OFFLINE, (presence: UserPresenceEvent) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.set(presence.userId, { ...presence, status: 'offline' });
        return next;
      });
    });

    // Admin notification events
    socketInstance.on(SOCKET_EVENTS.NEW_USER, (data: { userId: string; email: string }) => {
      const notification: NotificationEvent = {
        id: `user-${data.userId}-${Date.now()}`,
        type: 'info',
        title: 'New User',
        message: `${data.email} joined the platform`,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: `/dashboard/users/${data.userId}`,
      };
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
    });

    socketInstance.on(SOCKET_EVENTS.NEW_PAYMENT, (data: { amount: number; currency: string; userId: string }) => {
      const notification: NotificationEvent = {
        id: `payment-${Date.now()}`,
        type: 'success',
        title: 'New Payment',
        message: `Payment of ${data.amount} ${data.currency} received`,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: '/dashboard/payments',
      };
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
    });

    socketInstance.on(SOCKET_EVENTS.NEW_REPORT, (data: { reportId: string; type: string }) => {
      const notification: NotificationEvent = {
        id: `report-${data.reportId}`,
        type: 'warning',
        title: 'New Report',
        message: `New ${data.type} report submitted`,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: '/dashboard/moderation',
      };
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    socket?.emit(SOCKET_EVENTS.NOTIFICATION_READ, { id });
  }, [socket]);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    socket?.emit(SOCKET_EVENTS.NOTIFICATION_READ_ALL);
  }, [socket]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: SocketContextType = {
    socket,
    isConnected,
    notifications,
    unreadCount,
    dashboardStats,
    recentActivities,
    onlineUsers,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
