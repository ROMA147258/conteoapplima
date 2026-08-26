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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '4px' }}>
        <PartyLogo partyKey={partyKey} partyId={safePartyId} size={42} />
      </div>
      <div>
        <div className="candidate-name-text">{candName}</div>
        <div className="candidate-party-name">{partyLong || partyKey}</div>
      </div>
      <div
        className="counter-controller-horizontal"
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: isReadOnly ? 'center' : 'flex-end',
          alignItems: 'center',
          width: '100%',
          fontSize: isReadOnly ? '1.1rem' : undefined,
          fontWeight: isReadOnly ? 700 : undefined,
          color: isReadOnly ? '#fff' : undefined,
          paddingRight: isReadOnly ? '20px' : undefined
        }}
      >
        {isReadOnly ? (
          voteValue || 0
        ) : (
          <input
            type="number"
            id={`votos-input-${partyId}`}
            className="counter-input-field"
            value={voteValue || 0}
            min="0"
            max="999"
            onChange={(e) => onChange && onChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            style={{ margin: 0, width: '80px', textAlign: 'center' }}
          />
        )}
      </div>
    </div>
  );
};
