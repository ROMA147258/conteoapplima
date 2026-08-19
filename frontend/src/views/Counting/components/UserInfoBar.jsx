import React from 'react';
import { UserCheck, MapPin, Settings, LogOut } from 'lucide-react';

export const UserInfoBar = ({
  currentUser,
  ubicacion,
  isLlegadaConfirmed,
  onConfirmarLlegada,
  isSuperAdmin,
  onOpenConfig,
  onLogout
}) => {
  return (
    <div className="user-info-bar glass">
      <div className="user-details">
        <UserCheck className="text-secondary user-avatar-icon" size={24} />
        <div>
          <span className="user-label">Personero</span>
          <span id="user-display-name" className="user-name">{currentUser?.nombre || 'Personero'}</span>
          <span id="user-display-info" className="user-info-text">
            {currentUser?.dni ? `DNI: ${currentUser.dni} | Distrito: ${ubicacion}` : `Ubicación: ${ubicacion}`}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          id="btn-confirm-llegada"
          className={`btn-llegada-header ${isLlegadaConfirmed ? 'confirmed-btn-llegada' : ''}`}
          type="button"
          onClick={onConfirmarLlegada}
          title={isLlegadaConfirmed ? 'Llegada confirmada por GPS' : 'Confirmar Llegada por GPS'}
        >
          <MapPin size={16} />
          <span>{isLlegadaConfirmed ? 'Llegada OK' : 'Confirmar Llegada'}</span>
        </button>

        {isSuperAdmin && (
          <button
            id="btn-open-config"
            className="btn-icon-header"
            type="button"
            onClick={onOpenConfig}
            title="Configurar API"
          >
            <Settings size={18} />
          </button>
        )}

        <button
          id="btn-logout"
          className="btn-logout-small"
          type="button"
          onClick={onLogout}
          title="Cerrar Sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
};
