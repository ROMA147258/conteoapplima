import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { 
  ScanLine, 
  ImagePlus, 
  CheckCircle2, 
  FileText, 
  RefreshCw, 
  Send, 
  Building, 
  MapPin, 
  ChevronRight,
  Layers,
  Sparkles,
  Table
} from 'lucide-react';
import { analizarImagenActa, procesarTextoOCR } from '../../services/ocrPipeline';
import { extractJsonFromString } from '../../utils/helpers';

export const ScannerModal = () => {
  const { 
    isScannerModalOpen, 
    setIsScannerModalOpen, 
    currentUser, 
    setCurrentVotes, 
    setOcrVotes, 
    setOcrRawDetail, 
    showToast 
  } = useApp();

  const [images, setImages] = useState([]);
  const [progress, setProgress] = useState({ show: false, percentage: 0, status: '' });
  const [digitalizedVotes, setDigitalizedVotes] = useState(null);
  const [rawExtractedText, setRawExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('PROVINCIAL'); // 'PROVINCIAL' | 'DISTRITAL' | 'TABLE'
  const [selectedDistrictCol, setSelectedDistrictCol] = useState(() => currentUser?.ubicacion || 'BREÑA');

  const fileInputRef = useRef(null);

  // Extraer datos de la tabla si existen en el JSON
  const detectedTable = useMemo(() => {
    if (!rawExtractedText) return null;
    const json = extractJsonFromString(rawExtractedText);
    if (json && (json.tabla_completa || json.table || json.tabla)) {
      const t = json.tabla_completa || json.table || json.tabla;
      const headers = t.columnas || t.headers || [];
      const rows = t.filas || t.rows || [];
      return { headers, rows };
    }
    return null;
  }, [rawExtractedText]);

  // Distritos detectados en la tabla para el selector
  const availableDistricts = useMemo(() => {
    if (detectedTable && detectedTable.headers) {
      return detectedTable.headers.filter(h => {
        const normH = h.toUpperCase().trim();
        return normH !== 'PARTIDO' && normH !== 'LIMA' && normH !== 'PROVINCIAL' && normH !== 'METROPOLITANA';
      });
    }
    return [currentUser?.ubicacion || 'BREÑA'];
  }, [detectedTable, currentUser]);

  // Si cambia el distrito seleccionado en la matriz, recalcular votos distritales
  useEffect(() => {
    if (detectedTable && detectedTable.rows && selectedDistrictCol) {
      const userDist = selectedDistrictCol;
      const recalculated = procesarTextoOCR(rawExtractedText, userDist);
      setDigitalizedVotes(recalculated);
    }
  }, [selectedDistrictCol, detectedTable]);

  if (!isScannerModalOpen) return null;

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages = [];
    for (const file of files) {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
      newImages.push(base64);
    }

    setImages(newImages);
    processImages(newImages);
  };

  const processImages = async (imgList) => {
    if (imgList.length === 0) return;
    setIsProcessing(true);
    setProgress({ show: true, percentage: 10, status: 'Iniciando escáner de acta...' });

    try {
      const userDist = currentUser ? currentUser.ubicacion : 'BREÑA';
      let combinedRawText = '';

      for (let i = 0; i < imgList.length; i++) {
        const step = Math.round(((i + 1) / imgList.length) * 75);
        setProgress({ show: true, percentage: 15 + step, status: `Analizando con Google Gemini Vision imagen ${i + 1}/${imgList.length}...` });
        
        const result = await analizarImagenActa(imgList[i], {
          currentDistrict: userDist
        });
        combinedRawText += (combinedRawText ? '\n\n' : '') + result.rawText;
      }

      setProgress({ show: true, percentage: 95, status: 'Calculando votos por jurisdicción...' });
      const parsedVotes = procesarTextoOCR(combinedRawText, userDist);

      setRawExtractedText(combinedRawText);
      setDigitalizedVotes(parsedVotes);
      setOcrRawDetail(combinedRawText);
      setOcrVotes(parsedVotes);

      setProgress({ show: true, percentage: 100, status: '¡Votos detectados con éxito!' });
      showToast('Acta procesada: Votos reconocidos listos para revisar y aplicar.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error durante el procesamiento del acta.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReparse = () => {
    if (!rawExtractedText.trim()) return;
    const userDist = selectedDistrictCol || currentUser?.ubicacion || 'BREÑA';
    const recalculated = procesarTextoOCR(rawExtractedText, userDist);
    setDigitalizedVotes(recalculated);
    setOcrRawDetail(rawExtractedText);
    setOcrVotes(recalculated);
    showToast('Votos re-calculados a partir del texto actual.', 'success');
  };

  const handleApplyVotes = () => {
    if (!digitalizedVotes) return;

    setCurrentVotes(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      Object.keys(digitalizedVotes.provincial || {}).forEach(k => {
        if (digitalizedVotes.provincial[k] !== undefined) {
          updated.provincial[k] = digitalizedVotes.provincial[k];
        }
      });
      Object.keys(digitalizedVotes.distrital || {}).forEach(k => {
        if (digitalizedVotes.distrital[k] !== undefined) {
          updated.distrital[k] = digitalizedVotes.distrital[k];
        }
      });
      return updated;
    });

    setOcrVotes(digitalizedVotes);

    showToast('¡Votos Provinciales y Distritales aplicados exitosamente a la mesa!', 'success');
    setIsScannerModalOpen(false);
  };

  const clearAll = () => {
    setImages([]);
    setProgress({ show: false, percentage: 0, status: '' });
    setDigitalizedVotes(null);
    setRawExtractedText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Calcular totales por sección
  const totalProv = digitalizedVotes ? Object.values(digitalizedVotes.provincial || {}).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
  const totalDist = digitalizedVotes ? Object.values(digitalizedVotes.distrital || {}).reduce((a, b) => a + (Number(b) || 0), 0) : 0;

  return createPortal(
    <div id="modal-scanner" className="modal active">
      <div className="modal-content glass" style={{ maxWidth: 'min(94vw, 560px)', width: '100%', borderRadius: '18px', padding: '20px' }}>
        
        {/* Cabecera del Modal */}
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <ScanLine size={22} color="#c084fc" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                Escáner y Reconocimiento de Acta (IA)
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Detecta y separa votos de Lima Metropolitana y Distrital
              </span>
            </div>
          </div>
          <button id="btn-close-scanner" className="btn-icon-close" onClick={() => setIsScannerModalOpen(false)}>
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
          
          {/* Zona de Subida / Captura */}
          <div style={{ width: '100%' }}>
            <label
              htmlFor="image-upload"
              id="upload-dropzone"
              style={{
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed rgba(168, 85, 247, 0.45)',
                borderRadius: '14px',
                padding: images.length > 0 ? '14px 10px' : '22px 10px',
                background: 'rgba(168, 85, 247, 0.04)',
                transition: 'all 0.2s ease'
              }}
            >
              <ImagePlus size={32} color="#c084fc" style={{ marginBottom: '6px' }} />
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f1f5f9' }}>
                {images.length > 0 ? 'Cambiar Foto / Subir Otra Imagen' : 'Tomar Foto del Acta / Subir Imagen'}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                Formatos compatibles: JPG, PNG, WEBP
              </span>
              <input
                type="file"
                id="image-upload"
                ref={fileInputRef}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Miniaturas de Fotos */}
          {images.length > 0 && (
            <div id="scan-preview-container" style={{ display: 'flex', width: '100%', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>Foto Cargada:</span>
                <button
                  type="button"
                  id="btn-remove-photo"
                  onClick={clearAll}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '6px',
                    color: '#fca5a5',
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    cursor: 'pointer'
                  }}
                >
                  Limpiar
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Acta ${idx + 1}`}
                    style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #a855f7' }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Barra de Progreso */}
          {progress.show && (
            <div id="scan-progress-container" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600 }}>
                <span id="scan-progress-status" style={{ color: '#c084fc' }}>{progress.status}</span>
                <span id="scan-progress-percentage" style={{ color: '#94a3b8' }}>{progress.percentage}%</span>
              </div>
              <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  id="scan-progress-bar"
                  style={{
                    width: `${progress.percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #a855f7 0%, #7c3aed 100%)',
                    transition: 'width 0.25s linear'
                  }}
                />
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════════ */}
          {/* RESULTADOS CON PESTAÑAS SEPARADAS (LIMA METROPOLITANA VS DISTRITAL) */}
          {/* ════════════════════════════════════════════════════════════════════════ */}
          {digitalizedVotes && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Selector de Pestañas (Lima Metropolitana vs Distrital) */}
              <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('PROVINCIAL')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'PROVINCIAL' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
                    color: activeTab === 'PROVINCIAL' ? '#ffffff' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Building size={15} />
                  <span>1. Lima Metropolitana</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '4px' }}>
                    {totalProv}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('DISTRITAL')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'DISTRITAL' ? 'linear-gradient(135deg, #7c3aed, #9333ea)' : 'transparent',
                    color: activeTab === 'DISTRITAL' ? '#ffffff' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <MapPin size={15} />
                  <span>2. Distrital ({selectedDistrictCol})</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '4px' }}>
                    {totalDist}
                  </span>
                </button>

                {detectedTable && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('TABLE')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeTab === 'TABLE' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      color: activeTab === 'TABLE' ? '#ffffff' : '#94a3b8',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                    title="Ver matriz completa"
                  >
                    <Table size={15} />
                  </button>
                )}
              </div>

              {/* CONTENIDO PESTAÑA 1: LIMA METROPOLITANA (PROVINCIAL) */}
              {activeTab === 'PROVINCIAL' && (
                <div style={{ background: 'rgba(2, 132, 199, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                      🏛️ Votos Alcaldía de Lima Metropolitana (Columna LIMA)
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700 }}>
                      Total: <strong style={{ color: '#38bdf8' }}>{totalProv} votos</strong>
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '6px' }}>
                    {Object.entries(digitalizedVotes.provincial || {}).map(([p, v]) => (
                      <div
                        key={`prov-${p}`}
                        style={{
                          background: 'rgba(15, 23, 42, 0.65)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#94a3b8' }}>{p}:</span>
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#38bdf8' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CONTENIDO PESTAÑA 2: DISTRITAL */}
              {activeTab === 'DISTRITAL' && (
                <div style={{ background: 'rgba(124, 58, 237, 0.06)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase' }}>
                        📍 Votos Distritales:
                      </span>
                      {/* Selector de Distrito si hay matriz */}
                      {availableDistricts.length > 1 && (
                        <select
                          value={selectedDistrictCol}
                          onChange={(e) => setSelectedDistrictCol(e.target.value)}
                          style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            color: '#c084fc',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            borderRadius: '6px',
                            padding: '2px 6px',
                            fontSize: '0.76rem',
                            fontWeight: 700
                          }}
                        >
                          {availableDistricts.map((d, idx) => (
                            <option key={idx} value={d}>{d}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700 }}>
                      Total: <strong style={{ color: '#c084fc' }}>{totalDist} votos</strong>
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '6px' }}>
                    {Object.entries(digitalizedVotes.distrital || {}).map(([p, v]) => (
                      <div
                        key={`dist-${p}`}
                        style={{
                          background: 'rgba(15, 23, 42, 0.65)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#94a3b8' }}>{p}:</span>
                        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#c084fc' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CONTENIDO PESTAÑA 3: MATRIZ COMPLETA DETECTADA */}
              {activeTab === 'TABLE' && detectedTable && (
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '10px', overflowX: 'auto' }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Matriz Completa Detectada por la IA:
                  </span>
                  <table style={{ width: '100%', fontSize: '0.76rem', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
                        {detectedTable.headers.map((h, i) => (
                          <th key={i} style={{ padding: '6px 8px', color: '#cbd5e1', fontWeight: 800, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detectedTable.rows.map((r, i) => (
                        <tr key={i}>
                          {Array.isArray(r) ? (
                            r.map((val, j) => (
                              <td key={j} style={{ padding: '5px 8px', border: '1px solid rgba(255, 255, 255, 0.05)', color: j === 0 ? '#f8fafc' : '#38bdf8', fontWeight: j === 0 ? 700 : 500 }}>
                                {val}
                              </td>
                            ))
                          ) : (
                            Object.values(r).map((val, j) => (
                              <td key={j} style={{ padding: '5px 8px', border: '1px solid rgba(255, 255, 255, 0.05)', color: j === 0 ? '#f8fafc' : '#38bdf8', fontWeight: j === 0 ? 700 : 500 }}>
                                {val}
                              </td>
                            ))
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Área de JSON / Texto Editable */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
                  Respuesta Raw / JSON (Editable):
                </span>
                <textarea
                  id="scan-raw-text-content"
                  value={rawExtractedText}
                  onChange={(e) => setRawExtractedText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    maxHeight: '120px',
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    color: '#f1f5f9',
                    background: 'rgba(0,0,0,0.35)',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
                <button
                  type="button"
                  id="btn-reparse-text"
                  onClick={handleReparse}
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.74rem',
                    borderColor: 'rgba(168, 85, 247, 0.4)',
                    background: 'rgba(168, 85, 247, 0.1)',
                    color: '#c084fc',
                    borderRadius: '8px',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={13} />
                  <span>Recalcular Votos desde Texto</span>
                </button>
              </div>

              {/* Botón Principal: Aplicar Votos */}
              <button
                type="button"
                id="btn-apply-scan"
                className="btn btn-primary"
                onClick={handleApplyVotes}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle2 size={18} />
                <span>Aplicar Votos al Formulario (Provincial + Distrital)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
