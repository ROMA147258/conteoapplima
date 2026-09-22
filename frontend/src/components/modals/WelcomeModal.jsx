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
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          background: '#ffffff',
          border: '2px solid #bae6fd',
          borderRadius: '24px',
          padding: '28px 22px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
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
            background: '#e0f2fe',
            border: '2px solid #0284c7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Info size={32} color="#0284c7" />
        </div>

        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Control de <span style={{ color: '#0284c7' }}>Votación</span>
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: '1.4' }}>
            Bienvenido al sistema. Tienes <strong style={{ color: '#0f172a' }}>2 opciones</strong> independientes para registrar tus actas de mesa:
          </p>
        </div>

        <div
          style={{
            width: '100%',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
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
            <Edit3 size={18} color="#0284c7" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.86rem', color: '#334155' }}>
              <strong style={{ color: '#0f172a' }}>Formulario Manual:</strong> Conteo digitado.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Camera size={18} color="#7e22ce" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.86rem', color: '#334155' }}>
              <strong style={{ color: '#0f172a' }}>Formulario Imagen:</strong> Foto y OCR.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          style={{
            width: '100%',
            padding: '13px',
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',
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

