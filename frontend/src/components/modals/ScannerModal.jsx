import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { 
  ScanLine, 
  Building, 
  MapPin, 
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { analizarImagenActa, procesarTextoOCR } from '../../services/ocrPipeline';
import { 
  obtenerListaCandidatosProvincial, 
  obtenerListaCandidatosDistrital 
} from '../../constants/distritos';

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

  const userDistrict = currentUser?.ubicacion || 'BREÑA';

  // Tab activo: 'PROVINCIAL' o 'DISTRITAL'
  const [selectedSection, setSelectedSection] = useState('PROVINCIAL');

  // Fotos independientes por sección
  const [provImage, setProvImage] = useState(null);
  const [distImage, setDistImage] = useState(null);

  // Votos digitalizados por sección (clave de partido -> número de votos)
  const [provVotes, setProvVotes] = useState({});
  const [distVotes, setDistVotes] = useState({});

  // Raw text y estado de proceso
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');

  const provInputRef = useRef(null);
  const distInputRef = useRef(null);

  // Listas de candidatos oficiales
  const provincialCandidates = obtenerListaCandidatosProvincial();
  const distritalCandidates = obtenerListaCandidatosDistrital(userDistrict);

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

  // Procesamiento con Gemini Vision
  const processSingleImage = async (imgBase64, seccion) => {
    setIsProcessing(true);
    const labelSeccion = seccion === 'provincial' ? 'Lima Metropolitana' : `Distrital (${userDistrict})`;
    setProgressStatus(`Analizando acta de ${labelSeccion} con Google Gemini 2.5 Flash...`);

    try {
      const result = await analizarImagenActa(imgBase64, {
        currentDistrict: userDistrict,
        seccion: seccion
      });

      const parsed = procesarTextoOCR(result.rawText, userDistrict);

      if (seccion === 'provincial') {
        const detected = (parsed.provincial && Object.keys(parsed.provincial).length > 0) 
          ? parsed.provincial 
          : parsed.distrital || {};
        setProvVotes(prev => ({ ...prev, ...detected }));
        setOcrRawDetail(prev => (prev ? prev + '\n\n' : '') + `=== PROVINCIAL ===\n` + result.rawText);
      } else {
        const detected = (parsed.distrital && Object.keys(parsed.distrital).length > 0) 
          ? parsed.distrital 
          : parsed.provincial || {};
        setDistVotes(prev => ({ ...prev, ...detected }));
        setOcrRawDetail(prev => (prev ? prev + '\n\n' : '') + `=== DISTRITAL (${userDistrict}) ===\n` + result.rawText);
      }

      showToast(`¡Acta de ${labelSeccion} reconocida exitosamente!`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`Error al procesar el acta de ${labelSeccion}.`, 'error');
    } finally {
      setIsProcessing(false);
      setProgressStatus('');
    }
  };

  // Modificar voto individual provincial
  const handleProvVoteChange = (key, value) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setProvVotes(prev => ({ ...prev, [key]: num }));
  };

  // Modificar voto individual distrital
  const handleDistVoteChange = (key, value) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setDistVotes(prev => ({ ...prev, [key]: num }));
  };

  // Aplicar sólo Provincial
  const handleApplyProvincial = () => {
    if (Object.keys(provVotes).length === 0) return;
    setCurrentVotes(prev => ({
      ...prev,
      provincial: { ...(prev.provincial || {}), ...provVotes }
    }));
    setOcrVotes(prev => ({ ...(prev || {}), provincial: provVotes }));
    showToast('Votos de Lima Metropolitana aplicados a la mesa.', 'success');
  };

  // Aplicar sólo Distrital
  const handleApplyDistrital = () => {
    if (Object.keys(distVotes).length === 0) return;
    setCurrentVotes(prev => ({
      ...prev,
      distrital: { ...(prev.distrital || {}), ...distVotes }
    }));
    setOcrVotes(prev => ({ ...(prev || {}), distrital: distVotes }));
    showToast(`Votos Distritales (${userDistrict}) aplicados a la mesa.`, 'success');
  };

  // Aplicar Todo
  const handleApplyAll = () => {
    const hasProv = Object.keys(provVotes).length > 0;
    const hasDist = Object.keys(distVotes).length > 0;

    if (!hasProv && !hasDist) {
      showToast('Escanea al menos una foto de acta antes de aplicar.', 'warning');
      return;
    }

    setCurrentVotes(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      if (hasProv) {
        Object.entries(provVotes).forEach(([k, v]) => {
          updated.provincial[k] = Number(v) || 0;
        });
      }
      if (hasDist) {
        Object.entries(distVotes).forEach(([k, v]) => {
          updated.distrital[k] = Number(v) || 0;
        });
      }
      return updated;
    });

    setOcrVotes({
      provincial: provVotes,
      distrital: distVotes
    });

    showToast('¡Votos aplicados correctamente a la mesa de votación!', 'success');
    setIsScannerModalOpen(false);
  };

  // Sumas totales calculadas
  const totalProv = Object.values(provVotes).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalDist = Object.values(distVotes).reduce((a, b) => a + (Number(b) || 0), 0);

  return createPortal(
    <div id="modal-scanner" className="modal active">
      <div className="modal-content glass" style={{ maxWidth: 'min(95vw, 620px)', width: '100%', borderRadius: '18px', padding: '20px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Cabecera del Modal */}
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <ScanLine size={22} color="#c084fc" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                Escáner y Reconocimiento de Actas
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Candidatos, partidos, votos nulos y blancos detectados con IA
              </span>
            </div>
          </div>
          <button id="btn-close-scanner" className="btn-icon-close" onClick={() => setIsScannerModalOpen(false)}>
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          
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
              <span style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', padding: '2px 7px', borderRadius: '4px' }}>
                {totalProv} v.
              </span>
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
              <span>2. Distrital ({userDistrict})</span>
              <span style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', padding: '2px 7px', borderRadius: '4px' }}>
                {totalDist} v.
              </span>
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
                    padding: provImage ? '10px' : '18px 10px',
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
                  <img src={provImage} alt="Provincial" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #38bdf8' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8' }}>Foto 1: Lima Metropolitana</span>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Total detectado: <strong>{totalProv} votos</strong></p>
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
                    onClick={() => { setProvImage(null); setProvVotes({}); }}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* TABLA COMPLETA DE CANDIDATOS Y PARTIDOS PROVINCIALES */}
              <div style={{ background: 'rgba(2, 132, 199, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                    🏛️ Candidatos y Partidos (Lima Metropolitana)
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>
                    Total: <strong style={{ color: '#38bdf8' }}>{totalProv} votos</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                  {provincialCandidates.map(c => {
                    const val = provVotes[c.key] ?? 0;
                    return (
                      <div
                        key={`prov-cand-${c.key}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: Number(val) > 0 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.65)',
                          border: Number(val) > 0 ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '8px',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', width: '20px' }}>
                            #{c.num}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.candidato}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#38bdf8' }}>
                              {c.partyLong || c.organizacion}
                            </span>
                          </div>
                        </div>

                        <input
                          type="number"
                          min="0"
                          max="999"
                          value={val}
                          onChange={(e) => handleProvVoteChange(c.key, e.target.value)}
                          style={{
                            width: '56px',
                            textAlign: 'center',
                            padding: '4px 6px',
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            borderRadius: '6px',
                            border: Number(val) > 0 ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
                            background: '#0f172a',
                            color: Number(val) > 0 ? '#38bdf8' : '#94a3b8'
                          }}
                        />
                      </div>
                    );
                  })}

                  {/* Votos Nulos */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fca5a5' }}>❌ VOTOS NULOS:</span>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={provVotes.NULOS ?? 0}
                      onChange={(e) => handleProvVoteChange('NULOS', e.target.value)}
                      style={{ width: '56px', textAlign: 'center', padding: '4px 6px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #ef4444', background: '#0f172a', color: '#fca5a5' }}
                    />
                  </div>

                  {/* Votos en Blanco */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1' }}>⚪ VOTOS EN BLANCO:</span>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={provVotes.BLANCO ?? 0}
                      onChange={(e) => handleProvVoteChange('BLANCO', e.target.value)}
                      style={{ width: '56px', textAlign: 'center', padding: '4px 6px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #94a3b8', background: '#0f172a', color: '#ffffff' }}
                    />
                  </div>

                  {/* Votos Impugnados */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fcd34d' }}>⚠️ VOTOS IMPUGNADOS:</span>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={provVotes.IMPUGNADOS ?? 0}
                      onChange={(e) => handleProvVoteChange('IMPUGNADOS', e.target.value)}
                      style={{ width: '56px', textAlign: 'center', padding: '4px 6px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #f59e0b', background: '#0f172a', color: '#fcd34d' }}
                    />
                  </div>
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
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* SECCIÓN 2: FOTO Y VOTOS DISTRITALES */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {selectedSection === 'DISTRITAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Distrito Asignado Fijo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.7)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="#c084fc" />
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Jurisdicción Distrital Asignada:</span>
                    <strong style={{ fontSize: '0.92rem', color: '#c084fc' }}>{userDistrict}</strong>
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.3)', fontWeight: 700 }}>
                  Asignado
                </span>
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
                    padding: distImage ? '10px' : '18px 10px',
                    background: 'rgba(124, 58, 237, 0.05)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <MapPin size={28} color="#c084fc" style={{ marginBottom: '4px' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f1f5f9' }}>
                    {distImage ? `Cambiar Foto de ${userDistrict}` : `📷 Tomar Foto del Acta Distrital (${userDistrict})`}
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
                  <img src={distImage} alt="Distrital" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #c084fc' }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc' }}>Foto 2: Acta {userDistrict}</span>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Total detectado: <strong>{totalDist} votos</strong></p>
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
                    onClick={() => { setDistImage(null); setDistVotes({}); }}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* TABLA COMPLETA DE CANDIDATOS Y PARTIDOS DISTRITALES */}
              <div style={{ background: 'rgba(124, 58, 237, 0.06)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '12px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase' }}>
                    📍 Candidatos y Partidos ({userDistrict})
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>
                    Total: <strong style={{ color: '#c084fc' }}>{totalDist} votos</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                  {distritalCandidates.map(c => {
                    const val = distVotes[c.key] ?? 0;
                    return (
                      <div
                        key={`dist-cand-${c.key}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: Number(val) > 0 ? 'rgba(168, 85, 247, 0.12)' : 'rgba(15, 23, 42, 0.65)',
                          border: Number(val) > 0 ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '8px',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', width: '20px' }}>
                            #{c.num}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.candidato}
                            </span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#c084fc' }}>
                              {c.partyLong || c.organizacion}
                            </span>
                          </div>
                        </div>

                        <input
                          type="number"
                          min="0"
                          max="999"
                          value={val}
                          onChange={(e) => handleDistVoteChange(c.key, e.target.value)}
                          style={{
                            width: '56px',
                            textAlign: 'center',
                            padding: '4px 6px',
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            borderRadius: '6px',
                            border: Number(val) > 0 ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.15)',
                            background: '#0f172a',
                            color: Number(val) > 0 ? '#c084fc' : '#94a3b8'
                          }}
                        />
                      </div>
                    );
                  })}

                  {/* Votos Nulos */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fca5a5' }}>❌ VOTOS NULOS:</span>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={distVotes.NULOS ?? 0}
                      onChange={(e) => handleDistVoteChange('NULOS', e.target.value)}
                      style={{ width: '56px', textAlign: 'center', padding: '4px 6px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #ef4444', background: '#0f172a', color: '#fca5a5' }}
                    />
                  </div>

                  {/* Votos en Blanco */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1' }}>⚪ VOTOS EN BLANCO:</span>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={distVotes.BLANCO ?? 0}
                      onChange={(e) => handleDistVoteChange('BLANCO', e.target.value)}
                      style={{ width: '56px', textAlign: 'center', padding: '4px 6px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #94a3b8', background: '#0f172a', color: '#ffffff' }}
                    />
                  </div>

                  {/* Votos Impugnados */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fcd34d' }}>⚠️ VOTOS IMPUGNADOS:</span>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={distVotes.IMPUGNADOS ?? 0}
                      onChange={(e) => handleDistVoteChange('IMPUGNADOS', e.target.value)}
                      style={{ width: '56px', textAlign: 'center', padding: '4px 6px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #f59e0b', background: '#0f172a', color: '#fcd34d' }}
                    />
                  </div>
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
            disabled={totalProv === 0 && totalDist === 0}
            style={{
              flex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              fontSize: '0.88rem',
              fontWeight: 800,
              background: (totalProv > 0 || totalDist > 0) ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.1)',
              cursor: (totalProv > 0 || totalDist > 0) ? 'pointer' : 'not-allowed'
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
