import React from 'react';
import { Map } from 'lucide-react';
import { PARTIDO_ID_MAP, PARTIDO_NOMBRES_LARGOS } from '../../../constants/distritos';
import { CandidateRow } from './CandidateRow';

export const ProvincialTable = ({
  candidatos,
  alcaldeActual,
  votes,
  onVoteChange,
  isReadOnly = false
}) => {
  const partiesList = Object.keys(PARTIDO_ID_MAP);

  return (
    <>
      <div className="table-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <Map size={16} />
          <span>Alcaldía Metropolitana (Lima)</span>
          <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 500, marginLeft: 'auto', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            Alcalde actual: {alcaldeActual}
          </span>
        </div>
      </div>

      {partiesList.map(partyKey => (
        <CandidateRow
          key={`prov-${partyKey}`}
          partyKey={partyKey}
          partyId={PARTIDO_ID_MAP[partyKey]}
          candName={candidatos[partyKey] || 'Sin Candidato'}
          partyLong={PARTIDO_NOMBRES_LARGOS[partyKey]}
          voteValue={votes[partyKey]}
          onChange={(val) => onVoteChange && onVoteChange('provincial', partyKey, val)}
          isReadOnly={isReadOnly}
        />
      ))}

      {/* Votos Nulos */}
      <div className="table-row-grid candidate-row metric-row-nulos">
        <div><span className="candidate-party-badge color-badge-metric-nulo">NULO</span></div>
        <div><div className="candidate-name-text">Votos Nulos</div><div className="candidate-party-name">Métrica de Acta</div></div>
        <div className="counter-controller-horizontal" style={{ display: 'flex', justifyContent: isReadOnly ? 'center' : 'flex-end', alignItems: 'center', width: '100%', fontSize: isReadOnly ? '1.1rem' : undefined, fontWeight: isReadOnly ? 700 : undefined, color: isReadOnly ? '#fff' : undefined, paddingRight: isReadOnly ? '20px' : undefined }}>
          {isReadOnly ? (
            votes.NULOS || 0
          ) : (
            <input
              type="number"
              id="votos-prov-nulos"
              className="counter-input-field"
              value={votes.NULOS || 0}
              min="0"
              max="999"
              onChange={(e) => onVoteChange('provincial', 'NULOS', e.target.value)}
              onFocus={(e) => e.target.select()}
              style={{ margin: 0, width: '80px', textAlign: 'center' }}
            />
          )}
        </div>
      </div>

      {/* Votos Vacíos */}
      <div className="table-row-grid candidate-row metric-row-vacios">
        <div><span className="candidate-party-badge color-badge-metric-vacio">VACÍO</span></div>
        <div><div className="candidate-name-text">Votos Vacíos</div><div className="candidate-party-name">Métrica de Acta</div></div>
        <div className="counter-controller-horizontal" style={{ display: 'flex', justifyContent: isReadOnly ? 'center' : 'flex-end', alignItems: 'center', width: '100%', fontSize: isReadOnly ? '1.1rem' : undefined, fontWeight: isReadOnly ? 700 : undefined, color: isReadOnly ? '#fff' : undefined, paddingRight: isReadOnly ? '20px' : undefined }}>
          {isReadOnly ? (
            votes.VACIOS || 0
          ) : (
            <input
              type="number"
              id="votos-prov-vacios"
              className="counter-input-field"
              value={votes.VACIOS || 0}
              min="0"
              max="999"
              onChange={(e) => onVoteChange('provincial', 'VACIOS', e.target.value)}
              onFocus={(e) => e.target.select()}
              style={{ margin: 0, width: '80px', textAlign: 'center' }}
            />
          )}
        </div>
      </div>
    </>
  );
};
