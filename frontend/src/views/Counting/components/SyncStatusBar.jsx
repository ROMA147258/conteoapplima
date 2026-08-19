import React from 'react';
import { WifiOff } from 'lucide-react';

export const SyncStatusBar = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div id="sync-status-bar" className="sync-status-bar glass" style={{ display: 'flex' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <WifiOff size={16} className="sync-icon" />
        <span id="sync-status-text">Sin conexión - Guardando localmente</span>
      </div>
    </div>
  );
};
