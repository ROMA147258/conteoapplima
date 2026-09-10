import React from 'react';
import { Camera, CheckCircle2 } from 'lucide-react';

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
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '14px'
      }}
    >
      {/* ======================================================== */}
      {/* INSTALACIÓN DE MESA DE SUFRAGIO                          */}
      {/* ======================================================== */}
      <div
        style={{
          background: isAttendanceConfirmed
            ? 'linear-gradient(145deg, rgba(34, 197, 94, 0.09) 0%, rgba(15, 23, 42, 0.5) 100%)'
            : 'linear-gradient(145deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.5) 100%)',
          border: isAttendanceConfirmed
            ? '1px solid rgba(34, 197, 94, 0.35)'
            : '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                background: isAttendanceConfirmed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(2, 132, 199, 0.2)',
                border: isAttendanceConfirmed ? '1px solid #22c55e' : '1px solid #0284c7',
                color: isAttendanceConfirmed ? '#86efac' : '#38bdf8',
                borderRadius: '8px',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Camera size={15} />
            </div>
            <span
              style={{
                fontSize: '0.84rem',
                fontWeight: 800,
                color: isAttendanceConfirmed ? '#86efac' : '#38bdf8',
                letterSpacing: '0.3px'
              }}
            >
              Instalación de Mesa de Sufragio
            </span>
          </div>

          {isAttendanceConfirmed && (
            <span
              style={{
                fontSize: '0.7rem',
                color: '#86efac',
                fontWeight: 700,
                background: 'rgba(34, 197, 94, 0.2)',
                padding: '2px 8px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CheckCircle2 size={12} /> Confirmado
            </span>
          )}
        </div>

        {/* Fila compacta con Mesa, Centro de Votación y el Botón de Foto al costado */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'flex-end'
          }}
        >
          {/* Campo Mesa */}
          <div style={{ flex: '1 1 110px', minWidth: '90px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label htmlFor="input-mesa" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
              Mesa de sufragio:
            </label>
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
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '0.88rem',
                borderRadius: '6px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Campo Centro de Votacion */}
          <div style={{ flex: '2 1 180px', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label htmlFor="input-colegio" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
              Centro de votación:
            </label>
            <input
              type="text"
              id="input-colegio"
              value={colegioInput}
              readOnly
              placeholder={mesaInput ? 'Centro de votación no identificado...' : 'Ingresa tu mesa de sufragio...'}
              style={{
                width: '100%',
                padding: '7px 10px',
                fontSize: '0.82rem',
                borderRadius: '6px',
                background: isColegioDetected ? 'rgba(34, 197, 94, 0.08)' : 'rgba(0,0,0,0.25)',
                border: isColegioDetected ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                color: isColegioDetected ? '#4ade80' : '#94a3b8',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Botón Foto al Costado */}
          <button
            type="button"
            id="btn-confirm-asistencia-paso1"
            onClick={onAttendanceCheck}
            disabled={isAttendanceConfirmed}
            style={{
              height: '36px',
              padding: '0 14px',
              borderRadius: '8px',
              border: isAttendanceConfirmed
                ? '1px solid rgba(34, 197, 94, 0.45)'
                : '1px solid rgba(56, 189, 248, 0.45)',
              background: isAttendanceConfirmed
                ? 'rgba(34, 197, 94, 0.2)'
                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: isAttendanceConfirmed ? '#86efac' : '#ffffff',
              fontWeight: 700,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: isAttendanceConfirmed ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: isAttendanceConfirmed ? 'none' : '0 2px 10px rgba(2, 132, 199, 0.3)',
              flex: '0 0 auto'
            }}
          >
            {isAttendanceConfirmed ? <CheckCircle2 size={16} color="#22c55e" /> : <Camera size={16} />}
            <span>{isAttendanceConfirmed ? 'Foto OK ✓' : 'Tomar Foto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
