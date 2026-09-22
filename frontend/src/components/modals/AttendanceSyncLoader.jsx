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
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
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
          background: '#ffffff',
          border: '2px solid #bae6fd',
          borderRadius: '24px',
          padding: '30px 24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
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
              border: '3px solid #e0f2fe',
              borderTop: '3px solid #0284c7',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
        </div>

        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
            Registrando Asistencia
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', minHeight: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500 }}>
            {attendanceSyncLoader.text || 'Procesando confirmación...'}
          </p>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
            <span>Progreso</span>
            <span>{attendanceSyncLoader.percentage}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
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

