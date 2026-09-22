import React from 'react';
import { Vote, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Header = () => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-area">
          <Vote className="logo-icon" size={28} />
          <h1>VotoReal <span className="badge">Móvil</span></h1>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        </div>
      </div>
    </header>
  );
};
