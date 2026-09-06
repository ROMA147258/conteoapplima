import React from 'react';
import { User, Send, Lock, CheckCircle, ShieldAlert, Save } from 'lucide-react';
import { ProvincialTable } from './ProvincialTable';
import { DistrictTable } from './DistrictTable';

export const ManualCounting = ({
  ubicacion,
  candidatosProvincial,
  candidatosDistrital,
  alcaldeProvincial,
  alcaldeDistrital,
  currentVotes,
  onVoteChange,
  onTransmit,
  isTransmitting,
  isManualLocked = false,
  isSuperAdmin = false
}) => {
  const isReadOnly = isManualLocked && !isSuperAdmin;

  return (
    <div id="manual-table-group" style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        className="table-section-header"
        style={{
          background: isSuperAdmin && isManualLocked
            ? 'rgba(234, 179, 8, 0.15)'
            : isManualLocked
            ? 'rgba(34, 197, 94, 0.12)'
            : 'rgba(56, 189, 248, 0.12)',
          borderLeft: isSuperAdmin && isManualLocked
            ? '3px solid #eab308'
            : isManualLocked
            ? '3px solid #22c55e'
            : '3px solid var(--secondary)',
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} />
          <span>Conteo Manual Oficial</span>
        </div>
        
        {isManualLocked && (
          isSuperAdmin ? (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#fef08a',
                background: 'rgba(234, 179, 8, 0.25)',
                padding: '3px 10px',
                borderRadius: '12px',
                border: '1px solid rgba(234, 179, 8, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <ShieldAlert size={13} /> Superadmin (Edición Habilitada)
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#86efac',
                background: 'rgba(34, 197, 94, 0.2)',
                padding: '2px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Lock size={12} /> Bloqueado / Enviado
            </span>
          )
        )}
      </div>

      {isManualLocked && (
        isSuperAdmin ? (
          <div
            id="banner-manual-superadmin"
            style={{
              marginTop: '10px',
              marginBottom: '4px',
              padding: '12px 16px',
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#fef08a',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            <ShieldAlert size={20} color="#eab308" style={{ flexShrink: 0 }} />
            <span>
              <strong>👑 Modo Superadministrador Activo:</strong> Los votos ya fueron transmitidos por la mesa, pero tienes permisos exclusivos para editar y guardar modificaciones en la base de datos.
            </span>
          </div>
        ) : (
          <div
            id="banner-manual-locked"
            style={{
              marginTop: '10px',
              marginBottom: '4px',
              padding: '12px 16px',
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#86efac',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            <CheckCircle size={18} color="#22c55e" style={{ flexShrink: 0 }} />
            <span>Tus votos de conteo manual ya fueron transmitidos exitosamente. El formulario ha sido bloqueado para evitar reenvíos.</span>
          </div>
        )
      )}

      <div className="table-container glass" id="manual-table-container">
        <div className="table-header-grid">
          <div className="table-header-cell text-center">PARTIDO</div>
          <div className="table-header-cell">CANDIDATO / ORGANIZACIÓN</div>
          <div className="table-header-cell text-center">VOTOS</div>
        </div>

        <div className="table-body-grid" id="candidates-table-body">
          <ProvincialTable
            candidatos={candidatosProvincial}
            alcaldeActual={alcaldeProvincial}
            votes={currentVotes.provincial}
            onVoteChange={onVoteChange}
            isReadOnly={isReadOnly}
          />
          <DistrictTable
            ubicacion={ubicacion}
            candidatos={candidatosDistrital}
            alcaldeActual={alcaldeDistrital}
            votes={currentVotes.distrital}
            onVoteChange={onVoteChange}
            isReadOnly={isReadOnly}
          />
        </div>
      </div>

      <button
        type="button"
        id="btn-submit-manual-votes"
        className={`btn btn-block btn-large-submit mt-4 ${
          isSuperAdmin && isManualLocked
            ? 'btn-warning'
            : isManualLocked
            ? 'btn-secondary'
            : 'btn-success'
        }`}
        onClick={onTransmit}
        disabled={isTransmitting || (isManualLocked && !isSuperAdmin)}
        style={
          isSuperAdmin && isManualLocked
            ? {
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                borderColor: '#f59e0b',
                color: '#ffffff',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(217, 119, 6, 0.4)'
              }
            : isManualLocked
            ? {
                background: 'rgba(51, 65, 85, 0.8)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                cursor: 'not-allowed',
                color: '#94a3b8',
                opacity: 0.8
              }
            : undefined
        }
      >
        <span>
          {isTransmitting
            ? 'Guardando en Base de Datos...'
            : isSuperAdmin && isManualLocked
            ? 'Guardar Modificación de Votos en BD'
            : isManualLocked
            ? 'Conteo Manual Transmitido (Bloqueado)'
            : 'Transmitir Resultados Manuales'}
        </span>
        {isSuperAdmin && isManualLocked ? (
          <Save size={18} />
        ) : isManualLocked ? (
          <Lock size={18} />
        ) : (
          <Send size={18} />
        )}
      </button>
    </div>
  );
};
