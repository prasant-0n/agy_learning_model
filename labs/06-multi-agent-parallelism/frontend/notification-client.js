import { NotificationListResponseSchema } from '../contracts/notification.contract.js';

export class NotificationUIClient {
  constructor(apiFetcher) {
    this.apiFetcher = apiFetcher;
  }

  async loadNotifications(userId) {
    const rawData = await this.apiFetcher.getNotifications(userId);
    // Contract verification at the client boundary
    const validated = NotificationListResponseSchema.parse(rawData);

    return {
      hasUnread: validated.unreadCount > 0,
      badgeText: validated.unreadCount > 99 ? '99+' : String(validated.unreadCount),
      items: validated.notifications.map(n => ({
        id: n.id,
        displayTitle: n.title.toUpperCase(),
        body: n.message,
        isNew: !n.read,
        formattedTime: new Date(n.createdAt).toLocaleDateString()
      }))
    };
  }
}
