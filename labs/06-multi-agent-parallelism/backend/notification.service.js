import {
  NotificationItemSchema,
  NotificationListResponseSchema,
  CreateNotificationInputSchema
} from '../contracts/notification.contract.js';

export class NotificationService {
  constructor() {
    this.notifications = new Map();
  }

  async createNotification(input) {
    const validated = CreateNotificationInputSchema.parse(input);
    const item = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: validated.userId,
      title: validated.title,
      message: validated.message,
      read: false,
      createdAt: new Date().toISOString()
    };

    NotificationItemSchema.parse(item);
    this.notifications.set(item.id, item);
    return item;
  }

  async listUserNotifications(userId) {
    const userItems = Array.from(this.notifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const unreadCount = userItems.filter(n => !n.read).length;

    const response = {
      notifications: userItems,
      unreadCount
    };

    return NotificationListResponseSchema.parse(response);
  }

  async markAsRead(notificationId, userId) {
    const item = this.notifications.get(notificationId);
    if (!item || item.userId !== userId) {
      return false;
    }
    item.read = true;
    return true;
  }
}

export const notificationService = new NotificationService();
