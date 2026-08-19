import React from 'react';
import { Camera, Shield, Send } from 'lucide-react';
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
  isTransmitting
}) => {
  return (
    <div id="ocr-table-group" style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
      {/* Scan Button at top of OCR Table Group */}
      <button
        type="button"
        id="btn-scan-acta"
        className="btn btn-secondary btn-block"
        onClick={onOpenScanner}
        style={{
          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: 600,
          border: 'none',
          borderRadius: '8px',
          padding: '10px',
          cursor: 'pointer',
          marginBottom: '16px'
        }}
      >
        <Camera size={18} />
        <span>Escanear Acta (Tomar Foto)</span>
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
        disabled={isTransmitting}
        style={{
          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
          borderColor: '#9333ea'
        }}
      >
        <span>Transmitir Votos de Imagen</span>
        <Send size={18} />
      </button>
    </div>
  );
};
