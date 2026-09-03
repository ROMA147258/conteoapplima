import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { 
  ScanLine, 
  Building, 
  MapPin, 
  Trash2,
  CheckCircle2,
  Loader2,
  Table,
  Camera,
  ArrowRight
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

  // Fotos cargadas
  const [provImage, setProvImage] = useState(null);
  const [distImage, setDistImage] = useState(null);

  // Votos reconocidos
  const [provVotes, setProvVotes] = useState({});
  const [distVotes, setDistVotes] = useState({});

  // Estado de carga y proceso
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');

  const provInputRef = useRef(null);
  const distInputRef = useRef(null);

  const provincialCandidates = obtenerListaCandidatosProvincial();
  const distritalCandidates = obtenerListaCandidatosDistrital(userDistrict);

  // Unir lista de organizaciones políticas para la tabla de verificación
  const allPartyKeys = Array.from(new Set([
    ...provincialCandidates.map(c => c.key),
    ...distritalCandidates.map(c => c.key)
  ]));

  if (!isScannerModalOpen) return null;

  // Manejar captura de Foto Lima Metropolitana
  const handleProvFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setProvImage(base64);
      await scanImage(base64, 'provincial');
    };
    reader.readAsDataURL(file);
  };

  // Manejar captura de Foto Distrital
  const handleDistFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setDistImage(base64);
      await scanImage(base64, 'distrital');
    };
    reader.readAsDataURL(file);
  };

  // Escaneo instantáneo con Gemini Vision
  const scanImage = async (imgBase64, seccion) => {
    setIsProcessing(true);
    const label = seccion === 'provincial' ? 'Lima Metropolitana' : `Distrital (${userDistrict})`;
    setProcessingMsg(`Escaneando y detectando votos de ${label}...`);

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

      showToast(`¡Votos de ${label} detectados con éxito!`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`Error al escanear acta de ${label}.`, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
    }
  };

  // Modificar voto provincial en la tabla
  const handleProvVoteChange = (key, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setProvVotes(prev => ({ ...prev, [key]: num }));
  };

  // Modificar voto distrital en la tabla
  const handleDistVoteChange = (key, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setDistVotes(prev => ({ ...prev, [key]: num }));
  };

  // Confirmar y plasmar en la mesa
  const handleConfirmAndApply = () => {
    const hasProv = Object.keys(provVotes).length > 0;
    const hasDist = Object.keys(distVotes).length > 0;

    if (!hasProv && !hasDist) {
      showToast('Escanea al menos una foto de acta antes de confirmar.', 'warning');
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

    showToast('¡Votos verificados y plasmados exitosamente en la mesa!', 'success');
    setIsScannerModalOpen(false);
  };

  const totalProv = Object.values(provVotes).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalDist = Object.values(distVotes).reduce((a, b) => a + (Number(b) || 0), 0);
  const hasData = Object.keys(provVotes).length > 0 || Object.keys(distVotes).length > 0;

  return createPortal(
    <div id="modal-scanner" className="modal active">
      <div className="modal-content glass" style={{ maxWidth: 'min(96vw, 680px)', width: '100%', borderRadius: '18px', padding: '20px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Encabezado */}
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <ScanLine size={22} color="#c084fc" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                Escáner y Verificación de Actas
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Sube la foto, el sistema detecta los votos y te muestra la tabla para confirmar
              </span>
            </div>
          </div>
          <button id="btn-close-scanner" className="btn-icon-close" onClick={() => setIsScannerModalOpen(false)}>
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          
          {/* PASO 1: BOTONES DE CAPTURA DE FOTOS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            
            {/* Foto 1: Lima Metropolitana */}
            <div style={{
              background: 'rgba(2, 132, 199, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={16} /> 1. Lima Metropolitana
                </span>
                {provImage && (
                  <button
                    type="button"
                    onClick={() => { setProvImage(null); setProvVotes({}); }}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
                    title="Eliminar foto"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <label
                htmlFor="prov-file-input"
                style={{
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: provImage ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.25)',
                  border: '1px dashed #38bdf8',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}
              >
                <Camera size={16} color="#38bdf8" />
                <span>{provImage ? 'Cambiar Foto Provincial' : 'Tomar / Subir Foto Lima'}</span>
                <input
                  type="file"
                  id="prov-file-input"
                  ref={provInputRef}
                  accept="image/*"
                  disabled={isProcessing}
                  style={{ display: 'none' }}
                  onChange={handleProvFile}
                />
              </label>

              {provImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: '#38bdf8', fontWeight: 600 }}>
                  <CheckCircle2 size={14} color="#38bdf8" />
                  <span>Foto cargada ({totalProv} votos detectados)</span>
                </div>
              )}
            </div>

            {/* Foto 2: Distrital */}
            <div style={{
              background: 'rgba(124, 58, 237, 0.06)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} /> 2. Distrital ({userDistrict})
                </span>
                {distImage && (
                  <button
                    type="button"
                    onClick={() => { setDistImage(null); setDistVotes({}); }}
                    style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
                    title="Eliminar foto"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <label
                htmlFor="dist-file-input"
                style={{
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: distImage ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.25)',
                  border: '1px dashed #c084fc',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}
              >
                <Camera size={16} color="#c084fc" />
                <span>{distImage ? 'Cambiar Foto Distrital' : `Tomar / Subir Foto ${userDistrict}`}</span>
                <input
                  type="file"
                  id="dist-file-input"
                  ref={distInputRef}
                  accept="image/*"
                  disabled={isProcessing}
                  style={{ display: 'none' }}
                  onChange={handleDistFile}
                />
              </label>

              {distImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: '#c084fc', fontWeight: 600 }}>
                  <CheckCircle2 size={14} color="#c084fc" />
                  <span>Foto cargada ({totalDist} votos detectados)</span>
                </div>
              )}
            </div>
          </div>

          {/* Loader mientras analiza */}
          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #a855f7', borderRadius: '10px' }}>
              <Loader2 size={20} className="animate-spin" color="#c084fc" />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                {processingMsg}
              </span>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* PASO 2: TABLA DE VERIFICACIÓN COMPLETA (ANTES DE CONFIRMAR) */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Table size={16} color="#38bdf8" /> Tabla de Verificación de Votos
              </span>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.76rem', fontWeight: 700 }}>
                <span style={{ color: '#38bdf8' }}>Lima: <strong>{totalProv}</strong></span>
                <span style={{ color: '#c084fc' }}>{userDistrict}: <strong>{totalDist}</strong></span>
              </div>
            </div>

            {/* Cabecera de Columnas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 75px 75px',
              gap: '6px',
              padding: '6px 10px',
              background: 'rgba(30, 41, 59, 0.8)',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#94a3b8',
              textTransform: 'uppercase'
            }}>
              <span>Organización Política / Candidato</span>
              <span style={{ textAlign: 'center', color: '#38bdf8' }}>Lima</span>
              <span style={{ textAlign: 'center', color: '#c084fc' }}>{userDistrict.slice(0, 7)}</span>
            </div>

            {/* Lista de Filas de Candidatos / Partidos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
              {allPartyKeys.map(partyKey => {
                const provCand = provincialCandidates.find(c => c.key === partyKey);
                const distCand = distritalCandidates.find(c => c.key === partyKey);

                const partyLabel = provCand?.partyLong || distCand?.partyLong || partyKey;
                const candProvName = provCand?.candidato;
                const candDistName = distCand?.candidato;

                const valProv = provVotes[partyKey] ?? 0;
                const valDist = distVotes[partyKey] ?? 0;
                const hasVotes = Number(valProv) > 0 || Number(valDist) > 0;

                return (
                  <div
                    key={`verify-row-${partyKey}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 75px 75px',
                      gap: '6px',
                      alignItems: 'center',
                      padding: '6px 10px',
                      background: hasVotes ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.5)',
                      border: hasVotes ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: '8px'
                    }}
                  >
                    {/* Info del Partido y Candidato */}
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: hasVotes ? '#f8fafc' : '#cbd5e1', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {partyLabel}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {candProvName ? `Prov: ${candProvName}` : candDistName ? `Dist: ${candDistName}` : ''}
                      </span>
                    </div>

                    {/* Voto Provincial */}
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={valProv}
                      onChange={(e) => handleProvVoteChange(partyKey, e.target.value)}
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        padding: '4px',
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        borderRadius: '6px',
                        border: Number(valProv) > 0 ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)',
                        background: '#0f172a',
                        color: Number(valProv) > 0 ? '#38bdf8' : '#94a3b8'
                      }}
                    />

                    {/* Voto Distrital */}
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={valDist}
                      onChange={(e) => handleDistVoteChange(partyKey, e.target.value)}
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        padding: '4px',
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        borderRadius: '6px',
                        border: Number(valDist) > 0 ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.12)',
                        background: '#0f172a',
                        color: Number(valDist) > 0 ? '#c084fc' : '#94a3b8'
                      }}
                    />
                  </div>
                );
              })}

              {/* Fila: VOTOS NULOS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 75px 75px', gap: '6px', alignItems: 'center', padding: '6px 10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fca5a5' }}>❌ VOTOS NULOS</span>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={provVotes.NULOS ?? 0}
                  onChange={(e) => handleProvVoteChange('NULOS', e.target.value)}
                  style={{ width: '100%', textAlign: 'center', padding: '4px', fontSize: '0.86rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #ef4444', background: '#0f172a', color: '#fca5a5' }}
                />
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={distVotes.NULOS ?? 0}
                  onChange={(e) => handleDistVoteChange('NULOS', e.target.value)}
                  style={{ width: '100%', textAlign: 'center', padding: '4px', fontSize: '0.86rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #ef4444', background: '#0f172a', color: '#fca5a5' }}
                />
              </div>

              {/* Fila: VOTOS EN BLANCO */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 75px 75px', gap: '6px', alignItems: 'center', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#cbd5e1' }}>⚪ VOTOS EN BLANCO</span>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={provVotes.BLANCO ?? 0}
                  onChange={(e) => handleProvVoteChange('BLANCO', e.target.value)}
                  style={{ width: '100%', textAlign: 'center', padding: '4px', fontSize: '0.86rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #94a3b8', background: '#0f172a', color: '#ffffff' }}
                />
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={distVotes.BLANCO ?? 0}
                  onChange={(e) => handleDistVoteChange('BLANCO', e.target.value)}
                  style={{ width: '100%', textAlign: 'center', padding: '4px', fontSize: '0.86rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #94a3b8', background: '#0f172a', color: '#ffffff' }}
                />
              </div>

              {/* Fila: VOTOS IMPUGNADOS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 75px 75px', gap: '6px', alignItems: 'center', padding: '6px 10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fcd34d' }}>⚠️ VOTOS IMPUGNADOS</span>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={provVotes.IMPUGNADOS ?? 0}
                  onChange={(e) => handleProvVoteChange('IMPUGNADOS', e.target.value)}
                  style={{ width: '100%', textAlign: 'center', padding: '4px', fontSize: '0.86rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #f59e0b', background: '#0f172a', color: '#fcd34d' }}
                />
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={distVotes.IMPUGNADOS ?? 0}
                  onChange={(e) => handleDistVoteChange('IMPUGNADOS', e.target.value)}
                  style={{ width: '100%', textAlign: 'center', padding: '4px', fontSize: '0.86rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #f59e0b', background: '#0f172a', color: '#fcd34d' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer con Botón Único de Confirmación */}
        <div className="modal-footer" style={{ marginTop: '14px', display: 'flex', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsScannerModalOpen(false)}
            style={{ flex: 1, padding: '10px', fontSize: '0.84rem' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmAndApply}
            disabled={!hasData || isProcessing}
            style={{
              flex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              fontSize: '0.88rem',
              fontWeight: 800,
              background: hasData ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.1)',
              cursor: hasData ? 'pointer' : 'not-allowed'
            }}
          >
            <CheckCircle2 size={18} />
            <span>✅ Confirmar y Plasmar Votos en la Mesa</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
