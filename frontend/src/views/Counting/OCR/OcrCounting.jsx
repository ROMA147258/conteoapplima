import React from 'react';
import { Camera, Shield, Send, Lock, CheckCircle2 } from 'lucide-react';
import { OcrCandidatesTable } from './OcrCandidatesTable';

export const OcrCounting = ({
  ubicacion,
  candidatosProvincial,
  candidatosDistrital,
  alcaldeProvincial,
  alcaldeDistrital,
  ocrVotes,
  onOpenScanner,
  onTransmit,
  isTransmitting,
  isOcrLocked = false
}) => {
  return (
    <div id="ocr-table-group" style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
      
      {/* Banner Informativo si ya fue transmitido y bloqueado */}
      {isOcrLocked && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#4ade80',
            fontSize: '0.84rem',
            fontWeight: 700
          }}
        >
          <CheckCircle2 size={18} color="#4ade80" />
          <span>🔒 Conteo por Imagen Transmitido con Éxito (Bloqueado)</span>
        </div>
      )}

      {/* Botón de Escaneo */}
      <button
        type="button"
        id="btn-scan-acta"
        className="btn btn-secondary btn-block"
        onClick={onOpenScanner}
        disabled={isOcrLocked}
        style={{
          background: isOcrLocked 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
          color: isOcrLocked ? '#94a3b8' : 'white',
          border: isOcrLocked ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: 600,
          borderRadius: '8px',
          padding: '10px',
          cursor: isOcrLocked ? 'not-allowed' : 'pointer',
          marginBottom: '16px'
        }}
      >
        {isOcrLocked ? <Lock size={18} /> : <Camera size={18} />}
        <span>{isOcrLocked ? 'Acta de Imagen ya Transmitida' : 'Escanear Acta (Tomar Foto)'}</span>
      </button>

      <div
        className="table-section-header"
        style={{ background: 'rgba(168, 85, 247, 0.15)', borderLeft: '3px solid #a855f7' }}
      >
        <Shield size={16} />
        <span>Conteo por Imagen (Solo Lectura)</span>
      </div>

      <OcrCandidatesTable
        ubicacion={ubicacion}
        candidatosProvincial={candidatosProvincial}
        candidatosDistrital={candidatosDistrital}
        alcaldeProvincial={alcaldeProvincial}
        alcaldeDistrital={alcaldeDistrital}
        ocrVotes={ocrVotes}
      />

      {/* Submit Button for OCR */}
      <button
        type="button"
        id="btn-submit-ocr-votes"
        className="btn btn-primary btn-block btn-large-submit mt-4"
        onClick={onTransmit}
        disabled={isTransmitting || isOcrLocked}
        style={{
          background: isOcrLocked 
            ? 'rgba(16, 185, 129, 0.2)' 
            : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
          borderColor: isOcrLocked ? '#10b981' : '#9333ea',
          color: isOcrLocked ? '#86efac' : '#ffffff',
          cursor: isOcrLocked ? 'not-allowed' : 'pointer',
          opacity: isOcrLocked ? 0.9 : 1
        }}
      >
        <span>
          {isOcrLocked 
            ? 'Transmisión por Imagen Realizada ✓' 
            : isTransmitting 
            ? 'Transmitiendo Votos...' 
            : 'Transmitir Votos de Imagen'}
        </span>
        {isOcrLocked ? <CheckCircle2 size={18} /> : <Send size={18} />}
      </button>
    </div>
  );
};
