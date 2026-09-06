import React from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, MapPin, Sparkles } from 'lucide-react';
import { OcrCounting } from '../../views/Counting/OCR/OcrCounting';

export const OcrReviewModal = ({
  isOpen,
  onClose,
  mesaInput,
  ubicacion,
  candidatosProvincial,
  candidatosDistrital,
  alcaldeProvincial,
  alcaldeDistrital,
  ocrVotes,
  onOpenScanner,
  onTransmit,
  isTransmitting,
  isOcrLocked,
  isSuperAdmin
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-portal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '12px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '94vh',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(160deg, rgba(30, 27, 46, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          borderRadius: '18px',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(168, 85, 247, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header del Modal */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.8)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(124, 58, 237, 0.35))',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc'
              }}
            >
              <Eye size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Visualización de Votos de Imagen (IA) <Sparkles size={14} color="#c084fc" />
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontWeight: 600, color: '#c084fc' }}>Mesa: {mesaInput || '---'}</span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin size={12} /> {ubicacion || 'Lima'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            maxHeight: 'calc(94vh - 75px)',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <OcrCounting
            ubicacion={ubicacion}
            candidatosProvincial={candidatosProvincial}
            candidatosDistrital={candidatosDistrital}
            alcaldeProvincial={alcaldeProvincial}
            alcaldeDistrital={alcaldeDistrital}
            ocrVotes={ocrVotes}
            onOpenScanner={() => {
              onClose();
              onOpenScanner();
            }}
            onTransmit={onTransmit}
            isTransmitting={isTransmitting}
            isOcrLocked={isOcrLocked}
            isSuperAdmin={isSuperAdmin}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
