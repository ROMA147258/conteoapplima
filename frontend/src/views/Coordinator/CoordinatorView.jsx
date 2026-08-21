import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useCoordinator } from '../../hooks/useCoordinator';
import { ShieldCheck, RefreshCw, LogOut, Search, School, UserCheck, CheckCircle2, Circle } from 'lucide-react';

export const CoordinatorView = () => {
  const { currentUser, logout } = useApp();
  const {
    personeros,
    asistencias,
    confirmacionesCoord,
    isLoading,
    fetchCoordinatorData,
    confirmPersoneroDirect
  } = useCoordinator();
  
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPersoneros = personeros.filter(p => {
    const q = searchTerm.toLowerCase();
    const name = (p.nombre || '').toLowerCase();
    const dni = (p.dni || p.DNI || '').toString();
    const mesa = (p.mesa || '').toString();
    return name.includes(q) || dni.includes(q) || mesa.includes(q);
  });

  const total = personeros.length;
  const verifiedCount = personeros.filter(p => {
    const pDni = (p.dni || p.DNI || '').toString();
    return confirmacionesCoord.some(c => (c.personero_dni || '').toString() === pDni);
  }).length;

  return (
    <section id="view-coordinator" className="view active" style={{ display: 'block' }}>
      {/* Header Coordinador */}
      <div className="user-info-bar glass">
        <div className="user-details">
          <ShieldCheck className="text-secondary user-avatar-icon" size={26} />
          <div>
            <span className="user-label" style={{ color: '#38bdf8', fontWeight: 800 }}>Coordinador de Local</span>
            <span className="user-name">{currentUser?.nombre || 'Coordinador Oficial'}</span>
            <span className="user-info-text">
              DNI: {currentUser?.dni || ''} | Distrito: {currentUser?.ubicacion || 'Lima'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-icon-header"
            onClick={fetchCoordinatorData}
            title="Refrescar lista"
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'spin-icon' : ''} />
          </button>
          <button
            type="button"
            className="btn-logout-small"
            onClick={logout}
            title="Cerrar Sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Tarjeta de Local Asignado */}
      <div className="card glass" style={{ marginTop: '12px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <School size={24} color="#38bdf8" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Colegio Asignado:</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
              {currentUser?.colegio || 'Todos los locales del distrito'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Confirmados</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4ade80' }}>
              {verifiedCount} / {total}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="input-group" style={{ marginTop: '12px', marginBottom: '12px' }}>
        <div className="input-wrapper">
          <Search className="input-icon" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar personero por nombre, DNI o mesa..."
          />
        </div>
      </div>

      {/* Lista de Personeros del Colegio (Sin foto, solo para confirmar) */}
      <div className="table-container glass" style={{ overflow: 'hidden' }}>
        <div
          className="table-section-header"
          style={{
            background: 'rgba(56, 189, 248, 0.12)',
            borderLeft: '3px solid #38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={18} color="#38bdf8" />
            <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
              Padrón de Personeros ({filteredPersoneros.length})
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Toca el check para confirmar
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px' }}>
          {filteredPersoneros.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 16px', color: '#94a3b8', fontSize: '0.9rem' }}>
              {isLoading ? 'Cargando personeros del colegio...' : 'No hay personeros registrados para este local.'}
            </div>
          ) : (
            filteredPersoneros.map((p, idx) => {
              const pDni = (p.dni || p.DNI || '').toString();
              const isCoordConfirmed = confirmacionesCoord.some(c => (c.personero_dni || '').toString() === pDni);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (!isCoordConfirmed) confirmPersoneroDirect(p);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: isCoordConfirmed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${isCoordConfirmed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '12px',
                    padding: '12px 14px',
                    cursor: isCoordConfirmed ? 'default' : 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Datos del Personero */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.94rem', color: isCoordConfirmed ? '#f8fafc' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.nombre}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                      <span>DNI: <strong style={{ color: '#cbd5e1' }}>{pDni}</strong></span>
                      <span>Mesa: <strong style={{ color: '#38bdf8' }}>{p.mesa || 'S/M'}</strong></span>
                    </div>
                  </div>

                  {/* Checkbox de Confirmación Directa */}
                  <button
                    type="button"
                    disabled={isCoordConfirmed}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCoordConfirmed) confirmPersoneroDirect(p);
                    }}
                    style={{
                      background: isCoordConfirmed
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isCoordConfirmed ? '#10b981' : 'rgba(255, 255, 255, 0.2)'}`,
                      color: isCoordConfirmed ? '#ffffff' : '#94a3b8',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      cursor: isCoordConfirmed ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      boxShadow: isCoordConfirmed ? '0 0 14px rgba(16, 185, 129, 0.45)' : 'none',
                      transition: 'all 0.2s ease',
                      opacity: isCoordConfirmed ? 0.95 : 1,
                      flexShrink: 0
                    }}
                  >
                    {isCoordConfirmed ? (
                      <>
                        <CheckCircle2 size={18} color="#ffffff" />
                        <span>Confirmado</span>
                      </>
                    ) : (
                      <>
                        <Circle size={18} />
                        <span>Confirmar</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
