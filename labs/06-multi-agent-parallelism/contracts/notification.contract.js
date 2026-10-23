import { z } from 'zod';

export const NotificationItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  read: z.boolean(),
  createdAt: z.string()
}).strict();

export const NotificationListResponseSchema = z.object({
  notifications: z.array(NotificationItemSchema),
  unreadCount: z.number().int().nonnegative()
}).strict();

export const CreateNotificationInputSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500)
}).strict();
