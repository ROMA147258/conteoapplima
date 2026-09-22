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
          padding: '20px',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
        }}
      >
        <div className="modal-header" style={{ flexShrink: 0, paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h3 id="ocr-modal-title" style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="#0284c7" /> Detalle del Escaneo
          </h3>
          <button
            type="button"
            id="btn-close-ocr-modal"
            className="btn-icon-close"
            onClick={() => setIsOcrDetailModalOpen(false)}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer' }}
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
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                fontSize: '0.85rem'
              }}
            >
              {parsedData ? (
                <div>
                  <div style={{ fontWeight: 700, color: '#7e22ce', marginBottom: '8px' }}>
                    Tipo detectado: {parsedData.tipoDocumento || 'Documento general'}
                  </div>
                  {parsedData.votos && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <strong style={{ color: '#0284c7' }}>Provincial:</strong>
                      <pre style={{ margin: 0, fontSize: '0.78rem', background: '#f1f5f9', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#0f172a' }}>{JSON.stringify(parsedData.votos.provincial, null, 2)}</pre>
                      <strong style={{ color: '#7e22ce', marginTop: '6px' }}>Distrital:</strong>
                      <pre style={{ margin: 0, fontSize: '0.78rem', background: '#f1f5f9', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#0f172a' }}>{JSON.stringify(parsedData.votos.distrital, null, 2)}</pre>
                    </div>
                  )}
                  {parsedData.filas && (
                    <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', marginTop: '8px' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                          {parsedData.columnas?.map((c, i) => <th key={i} style={{ borderBottom: '2px solid #cbd5e1', padding: '6px', color: '#0f172a' }}>{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.filas.map((f, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            {Object.values(f).map((val, j) => <td key={j} style={{ padding: '6px', textAlign: 'center', color: '#334155' }}>{String(val)}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {parsedData.textoExtraido && (
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', color: '#334155', background: '#f1f5f9', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '8px' }}>{parsedData.textoExtraido}</pre>
                  )}
                </div>
              ) : (
                <div style={{ color: '#64748b' }}>{ocrRawDetail || 'No hay detalle disponible.'}</div>
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
                color: '#0f172a',
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
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

