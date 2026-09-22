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
        borderRadius: '14px',
        background: '#ffffff',
        border: '1px solid #e2e8f0'
      }}
    >
      {/* ======================================================== */}
      {/* INSTALACIÓN DE MESA DE SUFRAGIO PARA PERSONEROS          */}
      {/* ======================================================== */}
      <div
        style={{
          background: isAttendanceConfirmed
            ? 'linear-gradient(145deg, #f0fdf4 0%, #dcfce7 100%)'
            : 'linear-gradient(145deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: isAttendanceConfirmed
            ? '1px solid #86efac'
            : '1px solid #bae6fd',
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
                background: isAttendanceConfirmed ? '#dcfce7' : '#e0f2fe',
                border: isAttendanceConfirmed ? '1px solid #16a34a' : '1px solid #0284c7',
                color: isAttendanceConfirmed ? '#15803d' : '#0284c7',
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
                color: isAttendanceConfirmed ? '#15803d' : '#0369a1',
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
                color: '#15803d',
                fontWeight: 800,
                background: '#dcfce7',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid #86efac',
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
            <label htmlFor="input-mesa" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
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
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                color: '#0f172a',
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Campo Centro de Votacion */}
          <div style={{ flex: '2 1 180px', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <label htmlFor="input-colegio" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>
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
                background: isColegioDetected ? '#f0fdf4' : '#f8fafc',
                border: isColegioDetected ? '1px solid #86efac' : '1px solid #cbd5e1',
                color: isColegioDetected ? '#15803d' : '#64748b',
                fontWeight: 700,
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
                ? '1px solid #86efac'
                : '1px solid #0284c7',
              background: isAttendanceConfirmed
                ? '#dcfce7'
                : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: isAttendanceConfirmed ? '#15803d' : '#ffffff',
              fontWeight: 800,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: isAttendanceConfirmed ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: isAttendanceConfirmed ? 'none' : '0 2px 10px rgba(2, 132, 199, 0.25)',
              flex: '0 0 auto'
            }}
          >
            {isAttendanceConfirmed ? <CheckCircle2 size={16} color="#16a34a" /> : <Camera size={16} />}
            <span>{isAttendanceConfirmed ? 'Foto OK ✓' : 'Tomar Foto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
