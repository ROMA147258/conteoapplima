import React from 'react';

export const MesaCard = ({
  mesaInput,
  onMesaChange,
  colegioInput,
  isAttendanceConfirmed,
  onAttendanceCheck
}) => {
  const isColegioDetected = Boolean(colegioInput && colegioInput.trim());

  return (
    <div
      className="mesa-compact-card glass"
      id="mesa-compact-card-container"
      style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}
    >
      <div className="input-group-horizontal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <label htmlFor="input-mesa">Número de Mesa / Acta:</label>
        <div className="input-wrapper input-mesa-wrapper">
          <input
            type="number"
            id="input-mesa"
            value={mesaInput}
            disabled={isAttendanceConfirmed}
            onChange={(e) => {
              let val = e.target.value;
              if (val.length > 6) val = val.slice(0, 6);
              onMesaChange(val);
            }}
            placeholder="000000"
            min="1"
            max="999999"
            required
          />
        </div>
      </div>
      <div className="input-group-horizontal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <label htmlFor="input-colegio">Colegio:</label>
        <div className="input-wrapper" style={{ flex: 1, marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              id="input-colegio"
              value={colegioInput}
              readOnly
              placeholder={mesaInput ? "Mesa no identificada..." : "Ingresa tu mesa..."}
              style={{
                padding: '8px 12px',
                background: isColegioDetected ? 'rgba(34, 197, 94, 0.08)' : 'rgba(0,0,0,0.2)',
                border: isColegioDetected ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: isColegioDetected ? '#4ade80' : '#94a3b8',
                fontWeight: 'bold',
                width: '100%',
                outline: 'none'
              }}
            />
          </div>
          <label
            className="confirm-attendance-container"
            title={
              isAttendanceConfirmed 
                ? "Asistencia confirmada" 
                : "Presiona para confirmar asistencia"
            }
            style={{
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              cursor: isAttendanceConfirmed ? 'default' : 'pointer',
              gap: '6px',
              userSelect: 'none',
              flexShrink: 0,
              position: 'relative',
              opacity: 1,
              transition: 'opacity 0.2s ease'
            }}
          >
            <input
              type="checkbox"
              className="confirm-attendance-checkbox"
              id="check-asistencia-brigadista"
              checked={isAttendanceConfirmed}
              disabled={isAttendanceConfirmed}
              onChange={onAttendanceCheck}
            />
            <span className="checkmark-custom"></span>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: isAttendanceConfirmed ? 'var(--success)' : '#38bdf8'
              }}
              id="check-label-brigadista"
            >
              {isAttendanceConfirmed ? 'Confirmado' : 'Confirmar'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};
