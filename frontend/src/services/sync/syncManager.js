import { syncService } from './syncService';

let syncInterval = null;

export const syncManager = {
  startAutoSync(apiUrl, onSyncComplete) {
    if (syncInterval) clearInterval(syncInterval);

    syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        const res = await syncService.syncPendingVotes(apiUrl);
        if (onSyncComplete && typeof onSyncComplete === 'function') {
          onSyncComplete(res);
        }
      }
    }, 15000);
  },

  stopAutoSync() {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  },

  async triggerManualSync(apiUrl) {
    return await syncService.syncPendingVotes(apiUrl);
  }
};
