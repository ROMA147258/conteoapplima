import React from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';

export const LoadingOverlay = () => {
  const { globalLoading } = useApp();

  if (!globalLoading.show) return null;

  return createPortal(
    <div id="loading-overlay" className="loading-overlay" style={{ display: 'flex' }}>
      <div className="loader-content">
        <div className="spinner"></div>
        <p id="loading-text">{globalLoading.text || 'Cargando...'}</p>
      </div>
    </div>,
    document.body
  );
};

