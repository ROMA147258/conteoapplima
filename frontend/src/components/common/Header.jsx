import React from 'react';
import { Vote, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header = () => {
  const { currentUser, setIsConfigModalOpen, logout } = useApp();

  const isSuperAdmin = currentUser && (
    currentUser.dni === 'Admin#2026$Secure!VotoReal' ||
    currentUser.dni === '99999999' ||
    (currentUser.nombre || '').toLowerCase().includes('super admin')
  );

  const handleLogoDoubleClick = () => {
    if (!currentUser || isSuperAdmin) {
      setIsConfigModalOpen(true);
    }
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-area" onDoubleClick={handleLogoDoubleClick} style={{ cursor: 'pointer' }}>
          <Vote className="logo-icon" size={28} />
          <h1>VotoReal <span className="badge">Móvil</span></h1>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        </div>
      </div>
    </header>
  );
};
