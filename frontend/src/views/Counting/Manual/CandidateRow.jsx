import React from 'react';

export const CandidateRow = ({
  partyKey,
  partyId,
  candName,
  partyLong,
  voteValue,
  onChange,
  isReadOnly = false
}) => {
  return (
    <div className={`table-row-grid candidate-row candidate-${partyId}`}>
      <div>
        <span className={`candidate-party-badge color-badge-${partyId}`}>{partyKey}</span>
      </div>
      <div>
        <div className="candidate-name-text">{candName}</div>
        <div className="candidate-party-name">{partyLong}</div>
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
