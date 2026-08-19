import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { FileText, Eye, Code } from 'lucide-react';

export const OcrDetailModal = () => {
  const { isOcrDetailModalOpen, setIsOcrDetailModalOpen, ocrRawDetail } = useApp();
  const [viewMode, setViewMode] = useState('visual'); // 'visual' or 'json'

  if (!isOcrDetailModalOpen) return null;

  let parsedData = null;
  try {
    parsedData = JSON.parse(ocrRawDetail);
  } catch (e) {
    parsedData = null;
  }

  return createPortal(
    <div id="modal-ocr-detail" className="modal active">
      <div
        className="modal-content glass"
        style={{
          maxWidth: 'min(94vw, 700px)',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '20px'
        }}
      >
        <div className="modal-header" style={{ flexShrink: 0, paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 id="ocr-modal-title" style={{ margin: 0, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} /> Detalle del Escaneo
          </h3>
          <button
            type="button"
            id="btn-close-ocr-modal"
            className="btn-icon-close"
            onClick={() => setIsOcrDetailModalOpen(false)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 0' }}>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button
              type="button"
              id="ocr-modal-view-btn-visual"
              className={`ocr-column-tab ${viewMode === 'visual' ? 'active' : ''}`}
              onClick={() => setViewMode('visual')}
              style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Eye size={12} /> Vista Visual
            </button>
            <button
              type="button"
              id="ocr-modal-view-btn-json"
              className={`ocr-column-tab ${viewMode === 'json' ? 'active' : ''}`}
              onClick={() => setViewMode('json')}
              style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Code size={12} /> Código JSON
            </button>
          </div>

          {viewMode === 'visual' ? (
            <div
              id="ocr-modal-visual-preview"
              style={{
                maxHeight: '350px',
                overflow: 'auto',
                background: 'rgba(0,0,0,0.25)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#f1f5f9',
                fontSize: '0.85rem'
              }}
            >
              {parsedData ? (
                <div>
                  <div style={{ fontWeight: 700, color: '#a855f7', marginBottom: '8px' }}>
                    Tipo detectado: {parsedData.tipoDocumento || 'Documento general'}
                  </div>
                  {parsedData.votos && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <strong style={{ color: '#38bdf8' }}>Provincial:</strong>
                      <pre style={{ margin: 0, fontSize: '0.78rem' }}>{JSON.stringify(parsedData.votos.provincial, null, 2)}</pre>
                      <strong style={{ color: '#a855f7', marginTop: '6px' }}>Distrital:</strong>
                      <pre style={{ margin: 0, fontSize: '0.78rem' }}>{JSON.stringify(parsedData.votos.distrital, null, 2)}</pre>
                    </div>
                  )}
                  {parsedData.filas && (
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {parsedData.columnas?.map((c, i) => <th key={i} style={{ borderBottom: '1px solid #a855f7', padding: '4px' }}>{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.filas.map((f, i) => (
                          <tr key={i}>
                            {Object.values(f).map((val, j) => <td key={j} style={{ padding: '4px', textAlign: 'center' }}>{String(val)}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {parsedData.textoExtraido && (
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: '#cbd5e1' }}>{parsedData.textoExtraido}</pre>
                  )}
                </div>
              ) : (
                <div style={{ color: '#94a3b8' }}>{ocrRawDetail || 'No hay detalle disponible.'}</div>
              )}
            </div>
          ) : (
            <pre
              id="ocr-modal-json-output"
              style={{
                maxHeight: '350px',
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: '#f1f5f9',
                background: 'rgba(0,0,0,0.35)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.08)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}
            >
              {ocrRawDetail || '{}'}
            </pre>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

