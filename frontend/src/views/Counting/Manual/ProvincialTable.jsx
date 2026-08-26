import React from 'react';
import { Map } from 'lucide-react';
import { obtenerListaCandidatosProvincial } from '../../../constants/distritos';
import { CandidateRow } from './CandidateRow';

export const ProvincialTable = ({
  alcaldeActual,
  votes = {},
  onVoteChange,
  isReadOnly = false
}) => {
  const candidatesList = obtenerListaCandidatosProvincial();

  return (
    <>
      <div className="table-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <Map size={16} />
          <span>Alcaldía Metropolitana (Lima - 26 Candidatos)</span>
          <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 500, marginLeft: 'auto', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            Alcalde actual: {alcaldeActual}
          </span>
        </div>
      </div>

      {candidatesList.map(cand => {
        const rawVal = votes[cand.key];
        const val = typeof rawVal === 'object' ? rawVal?.votos : rawVal;
        return (
          <CandidateRow
            key={`prov-${cand.key || cand.candidato}`}
            partyKey={cand.key}
            shortName={cand.shortName}
            partyId={cand.partyId}
            candName={cand.candidato}
            partyLong={cand.partyLong || cand.organizacion}
            voteValue={val}
            onChange={(newVal) => onVoteChange && onVoteChange('provincial', cand.key, newVal)}
            isReadOnly={isReadOnly}
          />
        );
      })}

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

      {/* Votos en Blanco */}
      <div className="table-row-grid candidate-row metric-row-blanco">
        <div><span className="candidate-party-badge color-badge-metric-blanco">BLANCO</span></div>
        <div><div className="candidate-name-text">Votos en Blanco</div><div className="candidate-party-name">Métrica de Acta</div></div>
        <div className="counter-controller-horizontal" style={{ display: 'flex', justifyContent: isReadOnly ? 'center' : 'flex-end', alignItems: 'center', width: '100%', fontSize: isReadOnly ? '1.1rem' : undefined, fontWeight: isReadOnly ? 700 : undefined, color: isReadOnly ? '#fff' : undefined, paddingRight: isReadOnly ? '20px' : undefined }}>
          {isReadOnly ? (
            votes.BLANCO ?? votes.VACIOS ?? 0
          ) : (
            <input
              type="number"
              id="votos-prov-blanco"
              className="counter-input-field"
              value={votes.BLANCO ?? votes.VACIOS ?? 0}
              min="0"
              max="999"
              onChange={(e) => {
                onVoteChange('provincial', 'BLANCO', e.target.value);
                onVoteChange('provincial', 'VACIOS', e.target.value);
              }}
              onFocus={(e) => e.target.select()}
              style={{ margin: 0, width: '80px', textAlign: 'center' }}
            />
          )}
        </div>
      </div>

      {/* Votos Impugnados */}
      <div className="table-row-grid candidate-row metric-row-impugnados">
        <div><span className="candidate-party-badge color-badge-metric-impugnado">IMPUGNADO</span></div>
        <div><div className="candidate-name-text">Votos Impugnados</div><div className="candidate-party-name">Métrica de Acta</div></div>
        <div className="counter-controller-horizontal" style={{ display: 'flex', justifyContent: isReadOnly ? 'center' : 'flex-end', alignItems: 'center', width: '100%', fontSize: isReadOnly ? '1.1rem' : undefined, fontWeight: isReadOnly ? 700 : undefined, color: isReadOnly ? '#fff' : undefined, paddingRight: isReadOnly ? '20px' : undefined }}>
          {isReadOnly ? (
            votes.IMPUGNADOS || 0
          ) : (
            <input
              type="number"
              id="votos-prov-impugnados"
              className="counter-input-field"
              value={votes.IMPUGNADOS || 0}
              min="0"
              max="999"
              onChange={(e) => onVoteChange('provincial', 'IMPUGNADOS', e.target.value)}
              onFocus={(e) => e.target.select()}
              style={{ margin: 0, width: '80px', textAlign: 'center' }}
            />
          )}
        </div>
      </div>
    </>
  );
};
