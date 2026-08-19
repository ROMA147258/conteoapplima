import { apiPost } from '../api/apiClient';
import { offlineQueue } from './offlineQueue';

export const syncService = {
  async syncPendingVotes(apiUrl) {
    if (!navigator.onLine) {
      return { success: false, remaining: offlineQueue.count(), message: 'Sin conexión a internet' };
    }

    const queue = offlineQueue.getQueue();
    if (queue.length === 0) {
      return { success: true, remaining: 0, synced: 0 };
    }

    const remaining = [];
    let syncedCount = 0;

    for (const item of queue) {
      try {
        const res = await apiPost(item, apiUrl);
        if (res && res.success) {
          syncedCount++;
        } else {
          remaining.push(item);
        }
      } catch (err) {
        remaining.push(item);
      }
    }

    offlineQueue.setQueue(remaining);
    return {
      success: remaining.length === 0,
      synced: syncedCount,
      remaining: remaining.length
    };
  }
};
