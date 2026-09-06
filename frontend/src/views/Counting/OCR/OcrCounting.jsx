import React from 'react';
import { Camera, Shield, Send, Lock, CheckCircle2, ShieldAlert, Save } from 'lucide-react';
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
  isOcrLocked = false,
  isSuperAdmin = false
}) => {
  return (
    <div id="ocr-table-group" style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
      
      {/* Banner Informativo si ya fue transmitido */}
      {isOcrLocked && (
        isSuperAdmin ? (
          <div
            id="banner-ocr-superadmin"
            style={{
              background: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#fef08a',
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            <ShieldAlert size={20} color="#eab308" style={{ flexShrink: 0 }} />
            <span>
              <strong>👑 Modo Superadministrador Activo:</strong> Los votos por imagen ya fueron transmitidos por la mesa, pero tienes permisos exclusivos para reescanear y actualizar la base de datos.
            </span>
          </div>
        ) : (
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
        )
      )}

      <div
        className="table-section-header"
        style={{ background: 'rgba(168, 85, 247, 0.15)', borderLeft: '3px solid #a855f7' }}
      >
        <Shield size={16} />
        <span>Votos Extraídos por Imagen (Solo Lectura)</span>
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
        disabled={isTransmitting || (isOcrLocked && !isSuperAdmin)}
        style={{
          background: isSuperAdmin && isOcrLocked
            ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
            : isOcrLocked
            ? 'rgba(16, 185, 129, 0.2)' 
            : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
          borderColor: isSuperAdmin && isOcrLocked ? '#f59e0b' : isOcrLocked ? '#10b981' : '#9333ea',
          color: isSuperAdmin && isOcrLocked ? '#ffffff' : isOcrLocked ? '#86efac' : '#ffffff',
          cursor: isOcrLocked && !isSuperAdmin ? 'not-allowed' : 'pointer',
          opacity: isOcrLocked && !isSuperAdmin ? 0.9 : 1,
          fontWeight: isSuperAdmin && isOcrLocked ? 700 : undefined
        }}
      >
        <span>
          {isTransmitting
            ? 'Guardando en Base de Datos...'
            : isSuperAdmin && isOcrLocked
            ? 'Guardar Modificación de Votos de Imagen en BD'
            : isOcrLocked 
            ? 'Transmisión por Imagen Realizada ✓' 
            : 'Transmitir Votos de Imagen'}
        </span>
        {isSuperAdmin && isOcrLocked ? (
          <Save size={18} />
        ) : isOcrLocked ? (
          <CheckCircle2 size={18} />
        ) : (
          <Send size={18} />
        )}
      </button>
    </div>
  );
};
