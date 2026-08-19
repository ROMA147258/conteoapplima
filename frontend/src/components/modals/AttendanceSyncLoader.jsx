import React from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';

export const AttendanceSyncLoader = () => {
  const { attendanceSyncLoader } = useApp();

  if (!attendanceSyncLoader.isOpen) return null;

  return createPortal(
    <div
      className="modal-portal-overlay"
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
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div
        className="modal-card"
        style={{
          background: 'linear-gradient(135deg, #1e1b2e, #0f172a)',
          border: '2px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '24px',
          padding: '30px 24px',
          boxShadow: '0 25px 60px rgba(56, 189, 248, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          maxWidth: 'min(94vw, 420px)',
          width: '100%',
          textAlign: 'center',
          margin: 'auto',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ position: 'relative', width: '50px', height: '50px' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              border: '3px solid rgba(56, 189, 248, 0.2)',
              borderTop: '3px solid #38bdf8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
        </div>

        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
            Registrando Asistencia
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {attendanceSyncLoader.text || 'Procesando confirmación...'}
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8' }}>
            <span>Progreso</span>
            <span>{attendanceSyncLoader.percentage}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${attendanceSyncLoader.percentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)',
                transition: 'width 0.2s linear'
              }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

