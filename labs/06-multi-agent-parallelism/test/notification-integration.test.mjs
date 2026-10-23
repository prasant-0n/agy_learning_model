import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NotificationService } from '../backend/notification.service.js';
import { NotificationUIClient } from '../frontend/notification-client.js';

describe('Cross-Layer Multi-Agent Contract Integration Suite', () => {
  it('1. Backend emits data that strictly satisfies frontend UI contract expectations', async () => {
    const backendService = new NotificationService();

    // Create 2 test notifications
    await backendService.createNotification({
      userId: 'usr_dev_1',
      title: 'Deploy Successful',
      message: 'Version 2.4.0 deployed to production cluster.'
    });

    await backendService.createNotification({
      userId: 'usr_dev_1',
      title: 'Database Alert',
      message: 'Replica set lag resolved automatically.'
    });

    // Mock API fetcher bridging the frontend client to backend service
    const mockApiFetcher = {
      getNotifications: async (userId) => {
        return await backendService.listUserNotifications(userId);
      }
    };

    const frontendClient = new NotificationUIClient(mockApiFetcher);
    const uiState = await frontendClient.loadNotifications('usr_dev_1');

    assert.strictEqual(uiState.hasUnread, true);
    assert.strictEqual(uiState.badgeText, '2');
    assert.strictEqual(uiState.items.length, 2);
    assert.strictEqual(uiState.items[0].displayTitle, 'DATABASE ALERT'); // most recent first
    assert.strictEqual(uiState.items[0].isNew, true);
  });

  it('2. Marking item read synchronously updates UI badge count', async () => {
    const backendService = new NotificationService();

    const notif = await backendService.createNotification({
      userId: 'usr_dev_2',
      title: 'Security Notice',
      message: 'New login detected from trusted IP.'
    });

    const mockApiFetcher = {
      getNotifications: async (userId) => {
        return await backendService.listUserNotifications(userId);
      }
    };

    const frontendClient = new NotificationUIClient(mockApiFetcher);

    // Initial state: 1 unread
    let state = await frontendClient.loadNotifications('usr_dev_2');
    assert.strictEqual(state.badgeText, '1');

    // Mark as read in backend
    const marked = await backendService.markAsRead(notif.id, 'usr_dev_2');
    assert.strictEqual(marked, true);

    // Reload in UI: 0 unread
    state = await frontendClient.loadNotifications('usr_dev_2');
    assert.strictEqual(state.hasUnread, false);
    assert.strictEqual(state.badgeText, '0');
    assert.strictEqual(state.items[0].isNew, false);
  });
});
