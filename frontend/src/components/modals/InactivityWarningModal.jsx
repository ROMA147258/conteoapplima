import React from 'react';

export const InactivityWarningModal = ({
  isOpen,
  countdown,
  maxCountdown = 20,
  onStayLoggedIn,
  onLogout
}) => {
  if (!isOpen) return null;

  const progressPercent = Math.max(0, Math.min(100, (countdown / maxCountdown) * 100));

  return (
    <div
      className="modal-overlay active"
      style={{
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-modal-title"
    >
      <div
        className="modal-card"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          animation: 'fadeInModal 0.25s ease-out forwards'
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            padding: '20px 24px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}
          >
            ⏱️
          </div>
          <div>
            <h3
              id="inactivity-modal-title"
              style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}
            >
              Aviso de Inactividad de Sesión
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.95 }}>
              Protección de datos electorales
            </p>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <p
            style={{
              color: '#334155',
              fontSize: '14px',
              lineHeight: '1.6',
              margin: '0 0 18px 0'
            }}
          >
            Por seguridad, tu sesión se cerrará automáticamente debido a inactividad en:
          </p>

          <div
            style={{
              textAlign: 'center',
              margin: '16px 0',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}
          >
            <div
              style={{
                fontSize: '36px',
                fontWeight: 800,
                color: countdown <= 5 ? '#ef4444' : '#d97706',
                fontVariantNumeric: 'tabular-nums',
                transition: 'color 0.2s ease'
              }}
            >
              {countdown}s
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: '#e2e8f0',
                borderRadius: '4px',
                marginTop: '12px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: countdown <= 5 ? '#ef4444' : '#d97706',
                  transition: 'width 1s linear, background-color 0.3s ease'
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: '20px'
            }}
          >
            <button
              onClick={onLogout}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#64748b',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Cerrar Sesión
            </button>
            <button
              onClick={onStayLoggedIn}
              style={{
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              Mantener Activa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactivityWarningModal;
