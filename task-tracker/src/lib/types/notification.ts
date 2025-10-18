// src/lib/types/notification.ts
export interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

export interface ScheduledNotification {
  id: string;
  todoId: string;
  scheduledTime: string;
  notification: NotificationOptions;
}
