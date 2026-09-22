import React from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

export const AlertDialog = () => {
  const { alertDialog, closeAlertDialog } = useApp();

  if (!alertDialog.isOpen) return null;

  const isError = alertDialog.type === 'error';
  const isWarning = alertDialog.type === 'warning';
  const isSuccess = alertDialog.type === 'success';

  const borderColor = isError ? '#ef4444' : isWarning ? '#f59e0b' : isSuccess ? '#16a34a' : '#0284c7';
  const glowColor = isError ? 'rgba(239, 68, 68, 0.15)' : isWarning ? 'rgba(245, 158, 11, 0.15)' : isSuccess ? 'rgba(22, 163, 74, 0.15)' : 'rgba(2, 132, 199, 0.15)';
  const titleColor = isError ? '#dc2626' : isWarning ? '#b45309' : isSuccess ? '#15803d' : '#0284c7';
  const badgeBg = isError ? '#fee2e2' : isWarning ? '#fef3c7' : isSuccess ? '#dcfce7' : '#e0f2fe';

  const renderIcon = () => {
    if (isError) return <AlertTriangle size={32} color="#dc2626" />;
    if (isWarning) return <AlertCircle size={32} color="#d97706" />;
    if (isSuccess) return <CheckCircle size={32} color="#16a34a" />;
    return <Info size={32} color="#0284c7" />;
  };

  return createPortal(
    <div
      className="modal-portal-overlay alert-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        minHeight: '100dvh',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAlertDialog();
      }}
    >
      <div
        className="modal-card alert-modal-card"
        style={{
          background: '#ffffff',
          border: `2px solid ${borderColor}`,
          borderRadius: '24px',
          padding: '28px 22px',
          boxShadow: `0 20px 50px ${glowColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          maxWidth: 'min(92vw, 440px)',
          width: '100%',
          textAlign: 'center',
          margin: 'auto',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            background: badgeBg,
            border: `2px solid ${borderColor}`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {renderIcon()}
        </div>

        <div style={{ width: '100%' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '1.25rem', fontWeight: 800, color: titleColor }}>
            {alertDialog.title}
          </h3>
          <div
            style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: '1.45', wordBreak: 'break-word', fontWeight: 500 }}
            dangerouslySetInnerHTML={{ __html: alertDialog.message }}
          />
        </div>

        {alertDialog.isConfirm ? (
          <div style={{ display: 'flex', width: '100%', gap: '12px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => {
                const cb = alertDialog.onClose;
                closeAlertDialog();
                if (cb && typeof cb === 'function') cb();
              }}
              style={{
                flex: 1,
                padding: '13px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {alertDialog.cancelText || 'Cancelar'}
            </button>
            <button
              type="button"
              onClick={() => {
                const cb = alertDialog.onConfirm;
                closeAlertDialog();
                if (cb && typeof cb === 'function') cb();
              }}
              style={{
                flex: 1.2,
                padding: '13px',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(14, 165, 233, 0.4)'
              }}
            >
              {alertDialog.confirmText || alertDialog.buttonText || 'Permitir Ubicación'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={closeAlertDialog}
            style={{
              width: '100%',
              padding: '13px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',
              marginTop: '6px'
            }}
          >
            {alertDialog.buttonText || 'Entendido'}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

