import React from 'react';
import { MapPin } from 'lucide-react';
import { obtenerListaCandidatosDistrital } from '../../../constants/distritos';
import { CandidateRow } from './CandidateRow';

export const DistrictTable = ({
  ubicacion,
  alcaldeActual,
  votes = {},
  onVoteChange,
  isReadOnly = false
}) => {
  const candidatesList = obtenerListaCandidatosDistrital(ubicacion);

  return (
    <>
      <div className="table-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <MapPin size={16} />
          <span>Alcaldía Distrital ({ubicacion} - {candidatesList.length} Candidatos)</span>
        </div>
      </div>

      {candidatesList.map(cand => {
        const rawVal = votes[cand.key];
        const val = typeof rawVal === 'object' ? rawVal?.votos : rawVal;
        return (
          <CandidateRow
            key={`dist-${cand.key || cand.candidato}`}
            partyKey={cand.key}
            shortName={cand.shortName}
            partyId={cand.partyId}
            candName={cand.candidato}
            partyLong={cand.partyLong || cand.organizacion}
            voteValue={val}
            onChange={(newVal) => onVoteChange && onVoteChange('distrital', cand.key, newVal)}
            isReadOnly={isReadOnly}
          />
        );
      })}

      {/* Votos Nulos */}
      <div className="table-row-grid candidate-row metric-row-nulos">
        <div className="candidate-logo-cell">
          <span className="candidate-party-badge color-badge-metric-nulo">NULO</span>
        </div>
        <div className="candidate-info-cell">
          <div className="candidate-name-text">Votos Nulos</div>
          <div className="candidate-party-name">Métrica Oficial de Acta</div>
        </div>
        <div className="vote-count-container">
          {isReadOnly ? (
            <div className="vote-badge-readonly">
              {votes.NULOS ?? 0}
            </div>
          ) : (
            <input
              type="number"
              id="votos-dist-nulos"
              className="vote-input-symmetric"
              value={votes.NULOS ?? 0}
              min="0"
              max="999"
              onChange={(e) => onVoteChange && onVoteChange('distrital', 'NULOS', e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="0"
            />
          )}
        </div>
      </div>

      {/* Votos en Blanco */}
      <div className="table-row-grid candidate-row metric-row-blanco">
        <div className="candidate-logo-cell">
          <span className="candidate-party-badge color-badge-metric-blanco">BLANCO</span>
        </div>
        <div className="candidate-info-cell">
          <div className="candidate-name-text">Votos en Blanco</div>
          <div className="candidate-party-name">Métrica Oficial de Acta</div>
        </div>
        <div className="vote-count-container">
          {isReadOnly ? (
            <div className="vote-badge-readonly">
              {votes.BLANCO ?? 0}
            </div>
          ) : (
            <input
              type="number"
              id="votos-dist-blanco"
              className="vote-input-symmetric"
              value={votes.BLANCO ?? 0}
              min="0"
              max="999"
              onChange={(e) => onVoteChange && onVoteChange('distrital', 'BLANCO', e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="0"
            />
          )}
        </div>
      </div>

      {/* Votos Impugnados */}
      <div className="table-row-grid candidate-row metric-row-impugnados">
        <div className="candidate-logo-cell">
          <span className="candidate-party-badge color-badge-metric-impugnado">IMPUGN.</span>
        </div>
        <div className="candidate-info-cell">
          <div className="candidate-name-text">Votos Impugnados</div>
          <div className="candidate-party-name">Métrica Oficial de Acta</div>
        </div>
        <div className="vote-count-container">
          {isReadOnly ? (
            <div className="vote-badge-readonly">
              {votes.IMPUGNADOS ?? 0}
            </div>
          ) : (
            <input
              type="number"
              id="votos-dist-impugnados"
              className="vote-input-symmetric"
              value={votes.IMPUGNADOS ?? 0}
              min="0"
              max="999"
              onChange={(e) => onVoteChange && onVoteChange('distrital', 'IMPUGNADOS', e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="0"
            />
          )}
        </div>
      </div>
    </>
  );
};
