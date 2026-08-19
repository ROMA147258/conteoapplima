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

  const borderColor = isError ? '#ef4444' : isWarning ? '#eab308' : isSuccess ? '#10b981' : '#38bdf8';
  const glowColor = isError ? 'rgba(239, 68, 68, 0.35)' : isWarning ? 'rgba(234, 179, 8, 0.35)' : isSuccess ? 'rgba(16, 185, 129, 0.35)' : 'rgba(56, 189, 248, 0.35)';
  const titleColor = isError ? '#f87171' : isWarning ? '#fde047' : isSuccess ? '#4ade80' : '#38bdf8';
  const badgeBg = isError ? 'rgba(239, 68, 68, 0.15)' : isWarning ? 'rgba(234, 179, 8, 0.15)' : isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)';

  const renderIcon = () => {
    if (isError) return <AlertTriangle size={32} color="#ef4444" />;
    if (isWarning) return <AlertCircle size={32} color="#eab308" />;
    if (isSuccess) return <CheckCircle size={32} color="#10b981" />;
    return <Info size={32} color="#38bdf8" />;
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
        background: 'rgba(5, 10, 20, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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
          background: 'linear-gradient(135deg, #1e1b2e, #0f172a)',
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
            style={{ margin: 0, fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.45', wordBreak: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: alertDialog.message }}
          />
        </div>

        <button
          type="button"
          onClick={closeAlertDialog}
          style={{
            width: '100%',
            padding: '13px',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
            marginTop: '6px'
          }}
        >
          {alertDialog.buttonText || 'Entendido'}
        </button>
      </div>
    </div>,
    document.body
  );
};

