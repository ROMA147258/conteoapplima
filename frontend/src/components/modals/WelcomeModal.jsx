import React from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { Info, Edit3, Camera } from 'lucide-react';

export const WelcomeModal = () => {
  const { welcomePopup, setWelcomePopup } = useApp();

  if (!welcomePopup) return null;

  const handleClose = () => {
    setWelcomePopup(false);
  };

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
        overflowY: 'auto',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          background: 'linear-gradient(135deg, #1e1b2e, #0f172a)',
          border: '2px solid rgba(56, 189, 248, 0.4)',
          borderRadius: '24px',
          padding: '28px 22px',
          boxShadow: '0 20px 50px rgba(56, 189, 248, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          maxWidth: 'min(94vw, 440px)',
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
            background: 'rgba(56, 189, 248, 0.15)',
            border: '2px solid #38bdf8',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Info size={32} color="#38bdf8" />
        </div>

        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px' }}>
            Control de <span style={{ color: '#38bdf8' }}>Votación</span>
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.4' }}>
            Bienvenido al sistema. Tienes <strong style={{ color: '#fff' }}>2 opciones</strong> independientes para registrar tus actas de mesa:
          </p>
        </div>

        <div
          style={{
            width: '100%',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Edit3 size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.86rem', color: '#cbd5e1' }}>
              <strong style={{ color: '#fff' }}>Formulario Manual:</strong> Conteo digitado.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Camera size={18} color="#a855f7" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.86rem', color: '#cbd5e1' }}>
              <strong style={{ color: '#fff' }}>Formulario Imagen:</strong> Foto y OCR.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          style={{
            width: '100%',
            padding: '13px',
            background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(56, 189, 248, 0.35)',
            marginTop: '4px'
          }}
        >
          Entendido, comenzar
        </button>
      </div>
    </div>,
    document.body
  );
};

