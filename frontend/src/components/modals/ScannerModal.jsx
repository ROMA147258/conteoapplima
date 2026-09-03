import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { 
  ScanLine, 
  ImagePlus, 
  CheckCircle2, 
  Building, 
  MapPin, 
  Sparkles,
  Trash2,
  Send,
  Loader2
} from 'lucide-react';
import { analizarImagenActa, procesarTextoOCR } from '../../services/ocrPipeline';
import { extractJsonFromString } from '../../utils/helpers';
import { DISTRITOS_LIMA } from '../../constants/distritos';

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

  // Tab activo: 'PROVINCIAL' (Lima Metropolitana) o 'DISTRITAL'
  const [selectedSection, setSelectedSection] = useState('PROVINCIAL');
  const [selectedDistrict, setSelectedDistrict] = useState(() => currentUser?.ubicacion || 'BREÑA');

  // Fotos independientes por sección
  const [provImage, setProvImage] = useState(null);
  const [distImage, setDistImage] = useState(null);

  // Votos digitalizados por sección
  const [provVotes, setProvVotes] = useState(null);
  const [distVotes, setDistVotes] = useState(null);

  // Raw text y estado de proceso
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');

  const provInputRef = useRef(null);
  const distInputRef = useRef(null);

  useEffect(() => {
    if (currentUser?.ubicacion) {
      setSelectedDistrict(currentUser.ubicacion);
    }
  }, [currentUser]);

  if (!isScannerModalOpen) return null;

  // Manejador de subida de imagen Provincial
  const handleProvFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setProvImage(base64);
      await processSingleImage(base64, 'provincial');
    };
    reader.readAsDataURL(file);
  };

  // Manejador de subida de imagen Distrital
  const handleDistFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setDistImage(base64);
      await processSingleImage(base64, 'distrital');
    };
    reader.readAsDataURL(file);
  };

  // Procesamiento con Gemini Vision para la sección seleccionada
  const processSingleImage = async (imgBase64, seccion) => {
    setIsProcessing(true);
    const labelSeccion = seccion === 'provincial' ? 'Lima Metropolitana' : `Distrital (${selectedDistrict})`;
    setProgressStatus(`Analizando ${labelSeccion} con Google Gemini 2.5 Flash...`);

    try {
      const result = await analizarImagenActa(imgBase64, {
        currentDistrict: selectedDistrict,
        seccion: seccion
      });

      const parsed = procesarTextoOCR(result.rawText, selectedDistrict);

      if (seccion === 'provincial') {
        const detected = (parsed.provincial && Object.keys(parsed.provincial).length > 0) 
          ? parsed.provincial 
          : parsed.distrital || {};
        setProvVotes(detected);
        setOcrRawDetail(prev => (prev ? prev + '\n\n' : '') + `=== PROVINCIAL ===\n` + result.rawText);
      } else {
        const detected = (parsed.distrital && Object.keys(parsed.distrital).length > 0) 
          ? parsed.distrital 
          : parsed.provincial || {};
        setDistVotes(detected);
        setOcrRawDetail(prev => (prev ? prev + '\n\n' : '') + `=== DISTRITAL (${selectedDistrict}) ===\n` + result.rawText);
      }

      showToast(`¡Acta de ${labelSeccion} reconocida con éxito!`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`Error al procesar el acta de ${labelSeccion}.`, 'error');
    } finally {
      setIsProcessing(false);
      setProgressStatus('');
    }
  };

  // Aplicar sólo Provincial
  const handleApplyProvincial = () => {
    if (!provVotes) return;
    setCurrentVotes(prev => ({
      ...prev,
      provincial: { ...(prev.provincial || {}), ...provVotes }
    }));
    setOcrVotes(prev => ({ ...(prev || {}), provincial: provVotes }));
    showToast('Votos de Lima Metropolitana aplicados a la mesa.', 'success');
  };

  // Aplicar sólo Distrital
  const handleApplyDistrital = () => {
    if (!distVotes) return;
    setCurrentVotes(prev => ({
      ...prev,
      distrital: { ...(prev.distrital || {}), ...distVotes }
    }));
    setOcrVotes(prev => ({ ...(prev || {}), distrital: distVotes }));
    showToast(`Votos Distritales (${selectedDistrict}) aplicados a la mesa.`, 'success');
  };

  // Aplicar Todo
  const handleApplyAll = () => {
    if (!provVotes && !distVotes) {
      showToast('Escanea al menos una foto de acta antes de aplicar.', 'warning');
      return;
    }

    setCurrentVotes(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (provVotes) {
        Object.entries(provVotes).forEach(([k, v]) => {
          updated.provincial[k] = Number(v) || 0;
        });
      }
      if (distVotes) {
        Object.entries(distVotes).forEach(([k, v]) => {
          updated.distrital[k] = Number(v) || 0;
        });
      }
      return updated;
    });

    setOcrVotes({
      provincial: provVotes || {},
      distrital: distVotes || {}
    });

    showToast('¡Votos aplicados correctamente a la mesa de votación!', 'success');
    setIsScannerModalOpen(false);
  };

  // Sumas totales
  const totalProv = provVotes ? Object.values(provVotes).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
  const totalDist = distVotes ? Object.values(distVotes).reduce((a, b) => a + (Number(b) || 0), 0) : 0;

  return createPortal(
    <div id="modal-scanner" className="modal active">
      <div className="modal-content glass" style={{ maxWidth: 'min(94vw, 580px)', width: '100%', borderRadius: '18px', padding: '20px' }}>
        
        {/* Cabecera del Modal */}
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <ScanLine size={22} color="#c084fc" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                Escáner de Actas con Google Gemini Vision
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Captura una foto para Lima Metropolitana y otra para Distrital
              </span>
            </div>
          </div>
          <button id="btn-close-scanner" className="btn-icon-close" onClick={() => setIsScannerModalOpen(false)}>
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
          
          {/* Selector de Pestaña: Lima Metropolitana vs Distrital */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setSelectedSection('PROVINCIAL')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: selectedSection === 'PROVINCIAL' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
                color: selectedSection === 'PROVINCIAL' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Building size={16} />
              <span>1. Lima Metropolitana</span>
              {provVotes && (
                <span style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', padding: '2px 7px', borderRadius: '4px' }}>
                  {totalProv} v.
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSelectedSection('DISTRITAL')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: selectedSection === 'DISTRITAL' ? 'linear-gradient(135deg, #7c3aed, #9333ea)' : 'transparent',
                color: selectedSection === 'DISTRITAL' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <MapPin size={16} />
              <span>2. Distrital ({selectedDistrict})</span>
              {distVotes && (
                <span style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', padding: '2px 7px', borderRadius: '4px' }}>
                  {totalDist} v.
                </span>
              )}
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* SECCIÓN 1: FOTO Y VOTOS DE LIMA METROPOLITANA (PROVINCIAL) */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {selectedSection === 'PROVINCIAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Zona de subida Foto Provincial */}
              <div style={{ width: '100%' }}>
                <label
                  htmlFor="prov-upload"
                  style={{
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed rgba(56, 189, 248, 0.5)',
                    borderRadius: '14px',
                    padding: provImage ? '10px' : '20px 10px',
                    background: 'rgba(2, 132, 199, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Building size={28} color="#38bdf8" style={{ marginBottom: '4px' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f1f5f9' }}>
                    {provImage ? 'Cambiar Foto de Lima Metropolitana' : '📷 Tomar Foto del Acta de Lima Metropolitana'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                    Hoja oficial de Alcaldía Provincial
                  </span>
                  <input
                    type="file"
                    id="prov-upload"
                    ref={provInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleProvFile}
                  />
                </label>
              </div>

              {/* Vista previa y botón re-escanear */}
              {provImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.7)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <img src={provImage} alt="Provincial" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #38bdf8' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8' }}>Foto 1: Lima Metropolitana</span>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>{provVotes ? `Total detectado: ${totalProv} votos` : 'Procesando...'}</p>
                  </div>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => processSingleImage(provImage, 'provincial')}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid #38bdf8',
                      borderRadius: '6px',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    Re-escanear
                  </button>
                  <button
                    type="button"
                    onClick={() => { setProvImage(null); setProvVotes(null); }}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* Votos detectados Provincial */}
              {provVotes && (
                <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8' }}>
                      🏛️ Votos de Lima Metropolitana:
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>
                      Suma Total: <strong style={{ color: '#38bdf8' }}>{totalProv} votos</strong>
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {Object.entries(provVotes)
                      .filter(([_, v]) => Number(v) > 0 || ['BLANCO', 'NULOS', 'IMPUGNADOS'].includes(_))
                      .map(([p, v]) => (
                        <div
                          key={`p-${p}`}
                          style={{
                            background: 'rgba(15, 23, 42, 0.75)',
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

                  <button
                    type="button"
                    onClick={handleApplyProvincial}
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      background: 'rgba(56, 189, 248, 0.2)',
                      border: '1px solid #38bdf8',
                      borderRadius: '8px',
                      color: '#38bdf8',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Aplicar sólo votos de Lima Metropolitana
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* SECCIÓN 2: FOTO Y VOTOS DISTRITALES */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {selectedSection === 'DISTRITAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Selector de Distrito */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.7)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c084fc' }}>Distrito a Escanear:</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  style={{
                    background: 'rgba(30, 41, 59, 0.9)',
                    color: '#f8fafc',
                    border: '1px solid #a855f7',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}
                >
                  {DISTRITOS_LIMA.map((d, idx) => (
                    <option key={idx} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Zona de subida Foto Distrital */}
              <div style={{ width: '100%' }}>
                <label
                  htmlFor="dist-upload"
                  style={{
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed rgba(168, 85, 247, 0.5)',
                    borderRadius: '14px',
                    padding: distImage ? '10px' : '20px 10px',
                    background: 'rgba(124, 58, 237, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <MapPin size={28} color="#c084fc" style={{ marginBottom: '4px' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f1f5f9' }}>
                    {distImage ? `Cambiar Foto de ${selectedDistrict}` : `📷 Tomar Foto del Acta Distrital (${selectedDistrict})`}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                    Hoja oficial de Alcaldía Distrital
                  </span>
                  <input
                    type="file"
                    id="dist-upload"
                    ref={distInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleDistFile}
                  />
                </label>
              </div>

              {/* Vista previa y botón re-escanear */}
              {distImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(15, 23, 42, 0.7)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <img src={distImage} alt="Distrital" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #c084fc' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc' }}>Foto 2: Acta {selectedDistrict}</span>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>{distVotes ? `Total detectado: ${totalDist} votos` : 'Procesando...'}</p>
                  </div>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => processSingleImage(distImage, 'distrital')}
                    style={{
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid #c084fc',
                      borderRadius: '6px',
                      color: '#c084fc',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    Re-escanear
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDistImage(null); setDistVotes(null); }}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* Votos detectados Distrital */}
              {distVotes && (
                <div style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c084fc' }}>
                      📍 Votos Distritales ({selectedDistrict}):
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>
                      Suma Total: <strong style={{ color: '#c084fc' }}>{totalDist} votos</strong>
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {Object.entries(distVotes)
                      .filter(([_, v]) => Number(v) > 0 || ['BLANCO', 'NULOS', 'IMPUGNADOS'].includes(_))
                      .map(([p, v]) => (
                        <div
                          key={`d-${p}`}
                          style={{
                            background: 'rgba(15, 23, 42, 0.75)',
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

                  <button
                    type="button"
                    onClick={handleApplyDistrital}
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      background: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid #c084fc',
                      borderRadius: '8px',
                      color: '#c084fc',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      padding: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Aplicar sólo votos Distritales
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Estado de procesamiento / loader */}
          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid #a855f7', borderRadius: '10px' }}>
              <Loader2 size={18} className="animate-spin" color="#c084fc" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                {progressStatus}
              </span>
            </div>
          )}
        </div>

        {/* Footer con Botón Principal */}
        <div className="modal-footer" style={{ marginTop: '16px', display: 'flex', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsScannerModalOpen(false)}
            style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApplyAll}
            disabled={!provVotes && !distVotes}
            style={{
              flex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              fontSize: '0.88rem',
              fontWeight: 800,
              background: (provVotes || distVotes) ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.1)',
              cursor: (provVotes || distVotes) ? 'pointer' : 'not-allowed'
            }}
          >
            <CheckCircle2 size={18} />
            <span>Aplicar Votos a la Mesa ({totalProv + totalDist} total)</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
