import React from 'react';
import { User, Send } from 'lucide-react';
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
  isTransmitting
}) => {
  return (
    <div id="manual-table-group" style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        className="table-section-header"
        style={{ background: 'rgba(56, 189, 248, 0.12)', borderLeft: '3px solid var(--secondary)', marginTop: '16px' }}
      >
        <User size={16} />
        <span>Conteo Manual Oficial</span>
      </div>

      <div className="table-container glass" id="manual-table-container">
        <div className="table-header-grid">
          <div>Partido</div>
          <div>Alcalde</div>
          <div className="text-center">Conteo Votos</div>
        </div>

        <div className="table-body-grid" id="candidates-table-body">
          <ProvincialTable
            candidatos={candidatosProvincial}
            alcaldeActual={alcaldeProvincial}
            votes={currentVotes.provincial}
            onVoteChange={onVoteChange}
          />
          <DistrictTable
            ubicacion={ubicacion}
            candidatos={candidatosDistrital}
            alcaldeActual={alcaldeDistrital}
            votes={currentVotes.distrital}
            onVoteChange={onVoteChange}
          />
        </div>
      </div>

      <button
        type="button"
        id="btn-submit-manual-votes"
        className="btn btn-success btn-block btn-large-submit mt-4"
        onClick={onTransmit}
        disabled={isTransmitting}
      >
        <span>Transmitir Resultados Manuales</span>
        <Send size={18} />
      </button>
    </div>
  );
};
