import React from 'react';
import { createPortal } from 'react-dom';
import { X, UserCheck, MapPin } from 'lucide-react';
import { ManualCounting } from '../../views/Counting/Manual/ManualCounting';

export const ManualCountingModal = ({
  isOpen,
  onClose,
  mesaInput,
  ubicacion,
  candidatosProvincial,
  candidatosDistrital,
  alcaldeProvincial,
  alcaldeDistrital,
  currentVotes,
  onVoteChange,
  onTransmit,
  isTransmitting,
  isManualLocked,
  isSuperAdmin
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-portal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
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
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header del Modal */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(2, 132, 199, 0.1)',
                border: '1px solid rgba(2, 132, 199, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7'
              }}
            >
              <UserCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                Registro Manual de Votos
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>Mesa de sufragio: {mesaInput || '---'}</span>
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
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fee2e2';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#475569';
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
          <ManualCounting
            ubicacion={ubicacion}
            candidatosProvincial={candidatosProvincial}
            candidatosDistrital={candidatosDistrital}
            alcaldeProvincial={alcaldeProvincial}
            alcaldeDistrital={alcaldeDistrital}
            currentVotes={currentVotes}
            onVoteChange={onVoteChange}
            onTransmit={onTransmit}
            isTransmitting={isTransmitting}
            isManualLocked={isManualLocked}
            isSuperAdmin={isSuperAdmin}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
