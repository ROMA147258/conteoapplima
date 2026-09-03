import React from 'react';
import { User, Send, Lock, CheckCircle } from 'lucide-react';
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
  isManualLocked = false
}) => {
  return (
    <div id="manual-table-group" style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        className="table-section-header"
        style={{
          background: isManualLocked ? 'rgba(34, 197, 94, 0.12)' : 'rgba(56, 189, 248, 0.12)',
          borderLeft: isManualLocked ? '3px solid #22c55e' : '3px solid var(--secondary)',
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
        )}
      </div>

      {isManualLocked && (
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
            isReadOnly={isManualLocked}
          />
          <DistrictTable
            ubicacion={ubicacion}
            candidatos={candidatosDistrital}
            alcaldeActual={alcaldeDistrital}
            votes={currentVotes.distrital}
            onVoteChange={onVoteChange}
            isReadOnly={isManualLocked}
          />
        </div>
      </div>

      <button
        type="button"
        id="btn-submit-manual-votes"
        className={`btn btn-block btn-large-submit mt-4 ${isManualLocked ? 'btn-secondary' : 'btn-success'}`}
        onClick={onTransmit}
        disabled={isTransmitting || isManualLocked}
        style={
          isManualLocked
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
        <span>{isManualLocked ? 'Conteo Manual Transmitido (Bloqueado)' : 'Transmitir Resultados Manuales'}</span>
        {isManualLocked ? <Lock size={18} /> : <Send size={18} />}
      </button>
    </div>
  );
};
