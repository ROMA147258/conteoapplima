import React from 'react';
import { PartyLogo } from '../../../components/common/PartyLogo';

export const CandidateRow = ({
  partyKey,
  shortName,
  partyId,
  candName,
  partyLong,
  voteValue,
  onChange,
  isReadOnly = false
}) => {
  const safePartyId = (partyId || partyKey || 'generico').toLowerCase().replace(/[^a-z0-9]/g, '-');

  return (
    <div className={`table-row-grid candidate-row candidate-${safePartyId}`}>
      {/* Columna 1: Logo del Partido (Centrado Perfecto) */}
      <div className="candidate-logo-cell">
        <PartyLogo partyKey={partyKey} partyId={safePartyId} size={42} />
      </div>

      {/* Columna 2: Nombre de Candidato y Organización */}
      <div className="candidate-info-cell">
        <div className="candidate-name-text">{candName}</div>
        <div className="candidate-party-name">{partyLong || partyKey}</div>
      </div>

      {/* Columna 3: Contador de Votos / Cero (Centrado y Simétrico) */}
      <div className="vote-count-container">
        {isReadOnly ? (
          <div className="vote-badge-readonly">
            {voteValue ?? 0}
          </div>
        ) : (
          <input
            type="number"
            id={`votos-input-${safePartyId}`}
            className="vote-input-symmetric"
            value={voteValue ?? 0}
            min="0"
            max="999"
            onChange={(e) => onChange && onChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="0"
          />
        )}
      </div>
    </div>
  );
};
