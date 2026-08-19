import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { syncManager } from '../services/sync/syncManager';
import { offlineQueue } from '../services/sync/offlineQueue';

export const useOfflineSync = () => {
  const { apiUrl, isOnline, showToast } = useApp();
  const [pendingCount, setPendingCount] = useState(() => offlineQueue.count());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    syncManager.startAutoSync(apiUrl, (res) => {
      setPendingCount(offlineQueue.count());
      if (res.synced > 0) {
        showToast(`Se sincronizaron automáticamente ${res.synced} registros con el servidor.`, 'success');
      }
    });

    return () => syncManager.stopAutoSync();
  }, [apiUrl, showToast]);

  const triggerManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await syncManager.triggerManualSync(apiUrl);
      setPendingCount(offlineQueue.count());
      if (res.synced > 0) {
        showToast(`Sincronización manual exitosa: ${res.synced} registros enviados.`, 'success');
      } else if (res.remaining === 0) {
        showToast('Todos los datos ya están al día.', 'info');
      }
    } catch (e) {
      showToast('Error durante la sincronización.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    triggerManualSync
  };
};
