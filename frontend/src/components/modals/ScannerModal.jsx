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
  Check
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
    ocrVotes,
    setOcrVotes, 
    setOcrRawDetail, 
    showToast 
  } = useApp();

  const userDistrict = currentUser?.ubicacion || 'BREÑA';
  const isLocked = Boolean(currentUser?.voto_imagen_enviado || (typeof localStorage !== 'undefined' && localStorage.getItem(`votoReal_ocrLocked_${currentUser?.dni}`) === 'true'));

  // Pestaña activa: 'PROVINCIAL' (Foto 1) o 'DISTRITAL' (Foto 2)
  const [activeStep, setActiveStep] = useState('PROVINCIAL');

  // Si ya se confirmaron votos previamente
  const hasSavedProv = ocrVotes?.provincial && Object.values(ocrVotes.provincial).some(v => Number(v) > 0);
  const hasSavedDist = ocrVotes?.distrital && Object.values(ocrVotes.distrital).some(v => Number(v) > 0);

  // Foto 1: Lima Metropolitana
  const [provImage, setProvImage] = useState(null);
  const [provVotes, setProvVotes] = useState(() => (hasSavedProv ? { ...ocrVotes.provincial } : {}));
  const [isProvConfirmed, setIsProvConfirmed] = useState(() => Boolean(isLocked || hasSavedProv));

  // Foto 2: Distrital
  const [distImage, setDistImage] = useState(null);
  const [distVotes, setDistVotes] = useState(() => (hasSavedDist ? { ...ocrVotes.distrital } : {}));
  const [isDistConfirmed, setIsDistConfirmed] = useState(() => Boolean(isLocked || hasSavedDist));

  // Estado de escaneo
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');

  const provInputRef = useRef(null);
  const distInputRef = useRef(null);

  const provincialCandidates = obtenerListaCandidatosProvincial();
  const distritalCandidates = obtenerListaCandidatosDistrital(userDistrict);

  if (!isScannerModalOpen) return null;

  // Manejar captura de Foto 1 (Lima Metropolitana)
  const handleProvFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setProvImage(base64);
      setIsProvConfirmed(false);
      await scanImage(base64, 'provincial');
    };
    reader.readAsDataURL(file);
  };

  // Manejar captura de Foto 2 (Distrital)
  const handleDistFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setDistImage(base64);
      setIsDistConfirmed(false);
      await scanImage(base64, 'distrital');
    };
    reader.readAsDataURL(file);
  };

  // Escaneo instantáneo con Gemini Vision
  const scanImage = async (imgBase64, seccion) => {
    setIsProcessing(true);
    const isProv = seccion === 'provincial';
    const label = isProv ? 'Lima Metropolitana' : `Distrital (${userDistrict})`;
    setProcessingMsg(`Escaneando y detectando votos de ${label}...`);

    try {
      const result = await analizarImagenActa(imgBase64, {
        currentDistrict: userDistrict,
        seccion: seccion
      });

      const parsed = procesarTextoOCR(result.rawText, userDistrict);

      if (isProv) {
        const detected = (parsed.provincial && Object.keys(parsed.provincial).length > 0)
          ? parsed.provincial
          : parsed.distrital || {};
        setProvVotes(detected);
        setOcrVotes(prev => ({ ...(prev || {}), provincial: detected }));
        setIsProvConfirmed(true);
        setOcrRawDetail(prev => (prev ? prev + '\n\n' : '') + `=== PROVINCIAL ===\n` + result.rawText);
      } else {
        const detected = (parsed.distrital && Object.keys(parsed.distrital).length > 0)
          ? parsed.distrital
          : parsed.provincial || {};
        setDistVotes(detected);
        setOcrVotes(prev => ({ ...(prev || {}), distrital: detected }));
        setIsDistConfirmed(true);
        setOcrRawDetail(prev => (prev ? prev + '\n\n' : '') + `=== DISTRITAL (${userDistrict}) ===\n` + result.rawText);
      }

      showToast(`¡Votos de ${label} detectados y plasmados automáticamente en la tabla!`, 'success');
    } catch (err) {
      console.error(err);
      showToast(`Error al escanear acta de ${label}.`, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
    }
  };

  // Editar voto provincial (se sincroniza inmediatamente)
  const handleProvVoteChange = (key, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setProvVotes(prev => {
      const updated = { ...prev, [key]: num };
      setOcrVotes(curr => ({ ...(curr || {}), provincial: updated }));
      return updated;
    });
  };

  // Editar voto distrital (se sincroniza inmediatamente)
  const handleDistVoteChange = (key, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setDistVotes(prev => {
      const updated = { ...prev, [key]: num };
      setOcrVotes(curr => ({ ...(curr || {}), distrital: updated }));
      return updated;
    });
  };

  // Confirmar manual (opcional, ya se aplica automáticamente)
  const handleConfirmProvincial = () => {
    setOcrVotes(prev => ({ ...(prev || {}), provincial: provVotes }));
    setIsProvConfirmed(true);
    showToast('✅ Votos de Lima Metropolitana guardados.', 'success');
    if (!isDistConfirmed) {
      setActiveStep('DISTRITAL');
    }
  };

  // Confirmar manual (opcional, ya se aplica automáticamente)
  const handleConfirmDistrital = () => {
    setOcrVotes(prev => ({ ...(prev || {}), distrital: distVotes }));
    setIsDistConfirmed(true);
    showToast(`✅ Votos Distritales (${userDistrict}) guardados.`, 'success');
  };

  // Cerrar y finalizar todo
  const handleFinalizar = () => {
    setIsScannerModalOpen(false);
  };

  const totalProv = Object.values(provVotes).reduce((a, b) => a + (Number(b) || 0), 0);
  const totalDist = Object.values(distVotes).reduce((a, b) => a + (Number(b) || 0), 0);

  return createPortal(
    <div id="modal-scanner" className="modal active">
      <div className="modal-content glass" style={{ maxWidth: 'min(96vw, 620px)', width: '100%', borderRadius: '18px', padding: '20px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Encabezado */}
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <ScanLine size={22} color="#c084fc" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                Escáner de Actas (2 Fotos por Personero)
              </h3>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Foto 1: Lima Metropolitana | Foto 2: Distrital ({userDistrict})
              </span>
            </div>
          </div>
          <button 
            id="btn-close-scanner" 
            className="btn-icon-close" 
            disabled={isProcessing}
            onClick={() => !isProcessing && setIsScannerModalOpen(false)}
            style={{ opacity: isProcessing ? 0.4 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
          >
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          
          {/* Banner de Bloqueo si ya fue transmitido */}
          {isLocked && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '10px', padding: '10px 14px', color: '#fca5a5', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔒 <strong>ACTA BLOQUEADA:</strong> Los votos de esta mesa ya fueron transmitidos. No se permite reenviar ni modificar.</span>
            </div>
          )}

          {/* PESTAÑAS SEPARADAS: FOTO 1 VS FOTO 2 */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', gap: '6px' }}>
            
            {/* Botón Pestaña 1: Lima */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => !isProcessing && setActiveStep('PROVINCIAL')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeStep === 'PROVINCIAL' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
                color: activeStep === 'PROVINCIAL' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <Building size={16} />
              <span>Foto 1: Lima</span>
              {isProvConfirmed ? (
                <span style={{ fontSize: '0.68rem', background: '#10b981', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  ✓ Confirmado
                </span>
              ) : (totalProv > 0 && (
                <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.35)', padding: '2px 6px', borderRadius: '4px' }}>
                  {totalProv} v.
                </span>
              ))}
            </button>

            {/* Botón Pestaña 2: Distrital */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => !isProcessing && setActiveStep('DISTRITAL')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeStep === 'DISTRITAL' ? 'linear-gradient(135deg, #7c3aed, #9333ea)' : 'transparent',
                color: activeStep === 'DISTRITAL' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <MapPin size={16} />
              <span>Foto 2: {userDistrict}</span>
              {isDistConfirmed ? (
                <span style={{ fontSize: '0.68rem', background: '#10b981', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  ✓ Confirmado
                </span>
              ) : (totalDist > 0 && (
                <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.35)', padding: '2px 6px', borderRadius: '4px' }}>
                  {totalDist} v.
                </span>
              ))}
            </button>
          </div>

          {/* Loader durante el análisis */}
          {isProcessing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid #a855f7', borderRadius: '10px' }}>
              <Loader2 size={20} className="animate-spin" color="#c084fc" />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                {processingMsg}
              </span>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* VISTA 1: FOTO Y TABLA DE LIMA METROPOLITANA (PROVINCIAL) */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {activeStep === 'PROVINCIAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* SI YA ESTÁ CONFIRMADO O BLOQUEADO: NO PERMITIR ENVIAR FOTO */}
              {(isProvConfirmed || isLocked) ? (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800, fontSize: '0.92rem' }}>
                    <CheckCircle2 size={20} />
                    <span>✓ Votos de Lima Metropolitana Confirmados y Guardados</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#a7f3d0' }}>
                    🔒 Ya confirmaste esta hoja. La opción de volver a tomar o mandar foto está bloqueada para preservar la integridad de los datos.
                  </p>
                </div>
              ) : (
                /* SI NO HA CONFIRMADO: PERMITIR TOMAR/SUBIR FOTO */
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
                      <Building size={16} /> Hoja 1: Acta de Alcaldía de Lima Metropolitana
                    </span>
                    {provImage && !isProvConfirmed && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => { setProvImage(null); setProvVotes({}); }}
                        style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                        title="Eliminar foto"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <label
                    htmlFor={isProcessing ? "" : "prov-file-input"}
                    style={{
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      pointerEvents: isProcessing ? 'none' : 'auto',
                      opacity: isProcessing ? 0.45 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: provImage ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.25)',
                      border: '1px dashed #38bdf8',
                      color: '#f8fafc',
                      fontSize: '0.86rem',
                      fontWeight: 700
                    }}
                  >
                    <Camera size={18} color="#38bdf8" />
                    <span>{provImage ? 'Cambiar Foto de Lima Metropolitana' : '📷 Tomar / Subir Foto de Lima Metropolitana'}</span>
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
                </div>
              )}

              {/* TABLA DE VERIFICACIÓN DE LIMA METROPOLITANA */}
              {Object.keys(provVotes).length > 0 && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Table size={16} color="#38bdf8" /> {isProvConfirmed ? 'Votos Confirmados: Lima Metropolitana' : 'Verificación de Votos: Lima Metropolitana'}
                    </span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc' }}>
                      Total: <strong style={{ color: '#38bdf8' }}>{totalProv} votos</strong>
                    </span>
                  </div>

                  {/* Lista de Filas */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '260px', overflowY: 'auto', paddingRight: '4px' }}>
                    {provincialCandidates.map(c => {
                      const val = provVotes[c.key] ?? 0;
                      const hasV = Number(val) > 0;
                      return (
                        <div
                          key={`prov-row-${c.key}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            background: hasV ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                            border: hasV ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', width: '22px' }}>
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
                            disabled={isProvConfirmed || isLocked || isProcessing}
                            readOnly={isProvConfirmed || isLocked || isProcessing}
                            onChange={(e) => handleProvVoteChange(c.key, e.target.value)}
                            style={{
                              width: '58px',
                              textAlign: 'center',
                              padding: '4px 6px',
                              fontSize: '0.88rem',
                              fontWeight: 800,
                              borderRadius: '6px',
                              border: hasV ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
                              background: (isProvConfirmed || isLocked || isProcessing) ? 'rgba(15, 23, 42, 0.95)' : '#0f172a',
                              color: hasV ? '#38bdf8' : '#94a3b8',
                              cursor: (isProvConfirmed || isLocked || isProcessing) ? 'not-allowed' : 'text'
                            }}
                          />
                        </div>
                      );
                    })}

                    {/* Votos Nulos */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fca5a5' }}>❌ VOTOS NULOS:</span>
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={provVotes.NULOS ?? 0}
                        disabled={isProvConfirmed || isLocked || isProcessing}
                        readOnly={isProvConfirmed || isLocked || isProcessing}
                        onChange={(e) => handleProvVoteChange('NULOS', e.target.value)}
                        style={{ width: '58px', textAlign: 'center', padding: '4px 6px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #ef4444', background: (isProvConfirmed || isLocked || isProcessing) ? 'rgba(15, 23, 42, 0.95)' : '#0f172a', color: '#fca5a5', cursor: (isProvConfirmed || isLocked || isProcessing) ? 'not-allowed' : 'text' }}
                      />
                    </div>

                    {/* Votos en Blanco */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#cbd5e1' }}>⚪ VOTOS EN BLANCO:</span>
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={provVotes.BLANCO ?? 0}
                        disabled={isProvConfirmed || isLocked || isProcessing}
                        readOnly={isProvConfirmed || isLocked || isProcessing}
                        onChange={(e) => handleProvVoteChange('BLANCO', e.target.value)}
                        style={{ width: '58px', textAlign: 'center', padding: '4px 6px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #94a3b8', background: (isProvConfirmed || isLocked || isProcessing) ? 'rgba(15, 23, 42, 0.95)' : '#0f172a', color: '#ffffff', cursor: (isProvConfirmed || isLocked || isProcessing) ? 'not-allowed' : 'text' }}
                      />
                    </div>

                    {/* Votos Impugnados */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fcd34d' }}>⚠️ VOTOS IMPUGNADOS:</span>
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={provVotes.IMPUGNADOS ?? 0}
                        disabled={isProvConfirmed || isLocked || isProcessing}
                        readOnly={isProvConfirmed || isLocked || isProcessing}
                        onChange={(e) => handleProvVoteChange('IMPUGNADOS', e.target.value)}
                        style={{ width: '58px', textAlign: 'center', padding: '4px 6px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #f59e0b', background: (isProvConfirmed || isLocked || isProcessing) ? 'rgba(15, 23, 42, 0.95)' : '#0f172a', color: '#fcd34d', cursor: (isProvConfirmed || isLocked || isProcessing) ? 'not-allowed' : 'text' }}
                      />
                    </div>
                  </div>

                  {/* Botón de Confirmación Foto 1 */}
                  {isProvConfirmed ? (
                    <div
                      style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '11px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10b981',
                        color: '#86efac',
                        fontSize: '0.86rem',
                        fontWeight: 800
                      }}
                    >
                      <CheckCircle2 size={18} color="#10b981" />
                      <span>✓ Votos de Lima Metropolitana Confirmados ({totalProv} total)</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleConfirmProvincial}
                      style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '11px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                        color: '#ffffff',
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        opacity: isProcessing ? 0.6 : 1
                      }}
                    >
                      <CheckCircle2 size={18} />
                      <span>Confirmar Votos de Lima Metropolitana ({totalProv} total)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* VISTA 2: FOTO Y TABLA DISTRITAL */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {activeStep === 'DISTRITAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* SI YA ESTÁ CONFIRMADO O BLOQUEADO: NO PERMITIR ENVIAR FOTO */}
              {(isDistConfirmed || isLocked) ? (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800, fontSize: '0.92rem' }}>
                    <CheckCircle2 size={20} />
                    <span>✓ Votos Distritales ({userDistrict}) Confirmados y Guardados</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#a7f3d0' }}>
                    🔒 Ya confirmaste esta hoja. La opción de volver a tomar o mandar foto está bloqueada para preservar la integridad de los datos.
                  </p>
                </div>
              ) : (
                /* SI NO HA CONFIRMADO: PERMITIR TOMAR/SUBIR FOTO */
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
                      <MapPin size={16} /> Hoja 2: Acta Distrital ({userDistrict})
                    </span>
                    {distImage && !isDistConfirmed && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => { setDistImage(null); setDistVotes({}); }}
                        style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                        title="Eliminar foto"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <label
                    htmlFor={isProcessing ? "" : "dist-file-input"}
                    style={{
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      pointerEvents: isProcessing ? 'none' : 'auto',
                      opacity: isProcessing ? 0.45 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: distImage ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.25)',
                      border: '1px dashed #c084fc',
                      color: '#f8fafc',
                      fontSize: '0.86rem',
                      fontWeight: 700
                    }}
                  >
                    <Camera size={18} color="#c084fc" />
                    <span>{distImage ? `Cambiar Foto de ${userDistrict}` : `📷 Tomar / Subir Foto de ${userDistrict}`}</span>
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
                </div>
              )}

              {/* TABLA DE VERIFICACIÓN DISTRITAL */}
              {Object.keys(distVotes).length > 0 && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Table size={16} color="#c084fc" /> {isDistConfirmed ? `Votos Confirmados: ${userDistrict}` : `Verificación de Votos: ${userDistrict}`}
                    </span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc' }}>
                      Total: <strong style={{ color: '#c084fc' }}>{totalDist} votos</strong>
                    </span>
                  </div>

                  {/* Lista de Filas */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '260px', overflowY: 'auto', paddingRight: '4px' }}>
                    {distritalCandidates.map(c => {
                      const val = distVotes[c.key] ?? 0;
                      const hasV = Number(val) > 0;
                      return (
                        <div
                          key={`dist-row-${c.key}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            background: hasV ? 'rgba(168, 85, 247, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                            border: hasV ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', width: '22px' }}>
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
                            disabled={isDistConfirmed || isLocked || isProcessing}
                            readOnly={isDistConfirmed || isLocked || isProcessing}
                            onChange={(e) => handleDistVoteChange(c.key, e.target.value)}
                            style={{
                              width: '58px',
                              textAlign: 'center',
                              padding: '4px 6px',
                              fontSize: '0.88rem',
                              fontWeight: 800,
                              borderRadius: '6px',
                              border: hasV ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.15)',
                              background: (isDistConfirmed || isLocked || isProcessing) ? 'rgba(15, 23, 42, 0.95)' : '#0f172a',
                              color: hasV ? '#c084fc' : '#94a3b8',
                              cursor: (isDistConfirmed || isLocked || isProcessing) ? 'not-allowed' : 'text'
                            }}
                          />
                        </div>
                      );
                    })}

                    {/* Votos Nulos */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fca5a5' }}>❌ VOTOS NULOS:</span>
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={distVotes.NULOS ?? 0}
                        disabled={isDistConfirmed || isLocked || isProcessing}
                        readOnly={isDistConfirmed || isLocked || isProcessing}
                        onChange={(e) => handleDistVoteChange('NULOS', e.target.value)}
                        style={{ width: '58px', textAlign: 'center', padding: '4px 6px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #ef4444', background: (isDistConfirmed || isLocked || isProcessing) ? 'rgba(15, 23, 42, 0.95)' : '#0f172a', color: '#fca5a5', cursor: (isDistConfirmed || isLocked || isProcessing) ? 'not-allowed' : 'text' }}
                      />
                    </div>

                    {/* Votos en Blanco */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#cbd5e1' }}>⚪ VOTOS EN BLANCO:</span>
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={distVotes.BLANCO ?? 0}
                        disabled={isDistConfirmed || isLocked || isProcessing}
                        readOnly={isDistConfirmed || isLocked || isProcessing}
                        onChange={(e) => handleDistVoteChange('BLANCO', e.target.value)}
                        style={{ width: '58px', textAlign: 'center', padding: '4px 6px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #94a3b8', background: (isDistConfirmed || isLocked || isProcessing) ? 'rgba(15, 23, 42, 0.95)' : '#0f172a', color: '#ffffff', cursor: (isDistConfirmed || isLocked || isProcessing) ? 'not-allowed' : 'text' }}
                      />
                    </div>

                    {/* Votos Impugnados */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fcd34d' }}>⚠️ VOTOS IMPUGNADOS:</span>
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={distVotes.IMPUGNADOS ?? 0}
                        disabled={isDistConfirmed || isLocked || isProcessing}
                        readOnly={isDistConfirmed || isLocked || isProcessing}
                        onChange={(e) => handleDistVoteChange('IMPUGNADOS', e.target.value)}
                        style={{ width: '58px', textAlign: 'center', padding: '4px 6px', fontSize: '0.88rem', fontWeight: 800, borderRadius: '6px', border: '1px solid #f59e0b', background: (isDistConfirmed || isLocked || isProcessing) ? 'rgba(15, 23, 42, 0.95)' : '#0f172a', color: '#fcd34d', cursor: (isDistConfirmed || isLocked || isProcessing) ? 'not-allowed' : 'text' }}
                      />
                    </div>
                  </div>

                  {/* Botón de Confirmación Foto 2 */}
                  {isDistConfirmed ? (
                    <div
                      style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '11px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10b981',
                        color: '#86efac',
                        fontSize: '0.86rem',
                        fontWeight: 800
                      }}
                    >
                      <CheckCircle2 size={18} color="#10b981" />
                      <span>✓ Votos Distritales ({userDistrict}) Confirmados ({totalDist} total)</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleConfirmDistrital}
                      style={{
                        marginTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '11px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                        color: '#ffffff',
                        fontSize: '0.86rem',
                        fontWeight: 800,
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        opacity: isProcessing ? 0.6 : 1
                      }}
                    >
                      <CheckCircle2 size={18} />
                      <span>Confirmar Votos Distritales ({totalDist} total)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con Botón Finalizar */}
        <div className="modal-footer" style={{ marginTop: '14px', display: 'flex', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isProcessing}
            onClick={() => !isProcessing && setIsScannerModalOpen(false)}
            style={{ flex: 1, padding: '10px', fontSize: '0.84rem', opacity: isProcessing ? 0.5 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isProcessing}
            onClick={() => !isProcessing && handleFinalizar()}
            style={{
              flex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              fontSize: '0.88rem',
              fontWeight: 800,
              background: (isProvConfirmed || isDistConfirmed) ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255, 255, 255, 0.1)',
              cursor: 'pointer'
            }}
          >
            <Check size={18} />
            <span>Listo / Volver a la Mesa</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
