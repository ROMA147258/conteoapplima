import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useVotes } from '../../hooks/useVotes';
import { useAttendance } from '../../hooks/useAttendance';
import { DISTRITOS_LIMA, obtenerCandidatosPorUbicacion, obtenerAlcaldeActual } from '../../constants/distritos';
import { buscarColegioPorMesa } from '../../constants/data';
import { esCoordinador } from '../../constants/usuarios';
import { UserInfoBar } from './components/UserInfoBar';
import { SyncStatusBar } from './components/SyncStatusBar';
import { MesaCard } from './components/MesaCard';
import { ManualCountingModal } from '../../components/modals/ManualCountingModal';
import { OcrReviewModal } from '../../components/modals/OcrReviewModal';
import { 
  ClipboardList, 
  Camera, 
  CheckCircle2, 
  Lock, 
  ShieldAlert, 
  Sparkles, 
  ChevronRight, 
  Eye, 
  MapPin,
  Layers
} from 'lucide-react';

export const CountingView = () => {
  const {
    currentUser, setCurrentUser, logout,
    setCurrentView,
    isOnline,
    setIsConfigModalOpen, setIsScannerModalOpen,
    mesasEstructura, cachedUsers
  } = useApp();

  // Guard: Coordinadores van a view-coordinator
  useEffect(() => {
    if (esCoordinador(currentUser)) {
      setCurrentView('view-coordinator');
    }
  }, [currentUser, setCurrentView]);

  const { 
    currentVotes, 
    ocrVotes, 
    handleVoteChange, 
    transmitVotes, 
    isTransmitting, 
    isManualLocked, 
    isOcrLocked 
  } = useVotes();

  const {
    isAttendanceConfirmed, isLlegadaConfirmed,
    validateMesaBeforeAttendance, verifyAttendanceGpsRange,
    processAttendancePhoto, confirmLlegadaGPS
  } = useAttendance();

  // Estados de los Popups Modales
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  const ubicacion = currentUser?.ubicacion || 'Lima';
  const isSuperAdmin = currentUser && (
    currentUser.dni === 'Admin#2026$Secure!VotoReal' ||
    currentUser.dni === '99999999' ||
    (currentUser.nombre || '').toLowerCase().includes('super admin') ||
    (currentUser.rol || '').toLowerCase().includes('admin')
  );

  const [mesaInput, setMesaInput] = useState(() => {
    if (currentUser?.dni) {
      const isConfirmed = localStorage.getItem(`votoReal_attConfirmed_${currentUser.dni}`) === 'true';
      if (isConfirmed) {
        return localStorage.getItem(`votoReal_attMesa_${currentUser.dni}`) || '';
      }
    }
    return '';
  });

  const [colegioInput, setColegioInput] = useState(() => {
    if (currentUser?.dni) {
      const isConfirmed = localStorage.getItem(`votoReal_attConfirmed_${currentUser.dni}`) === 'true';
      if (isConfirmed) {
        return localStorage.getItem(`votoReal_attColegio_${currentUser.dni}`) || '';
      }
    }
    return '';
  });

  const attendanceFileRef = useRef(null);

  // Si no hay asistencia confirmada en la BD, asegurar que los campos inicien vacíos
  useEffect(() => {
    if (!isAttendanceConfirmed) {
      const localConfirmed = localStorage.getItem(`votoReal_attConfirmed_${currentUser?.dni}`) === 'true';
      if (!localConfirmed) {
        setMesaInput('');
        setColegioInput('');
      }
    }
  }, [isAttendanceConfirmed, currentUser?.dni]);

  // Sincronización en tiempo real: el colegio SOLO se detecta cuando el usuario escribe el número de mesa
  useEffect(() => {
    const cleanMesa = (mesaInput || '').trim();
    if (!cleanMesa) {
      setColegioInput('');
      localStorage.removeItem('votoReal_mesa_activa');
      localStorage.removeItem('votoReal_colegio_activo');
      return;
    }

    localStorage.setItem('votoReal_mesa_activa', cleanMesa);
    const match = buscarColegioPorMesa(cleanMesa, mesasEstructura, cachedUsers, currentUser);

    if (match && match.colegio) {
      setColegioInput(match.colegio);
      localStorage.setItem('votoReal_colegio_activo', match.colegio);
      if (match.distrito && currentUser && currentUser.ubicacion !== match.distrito) {
        const updatedUser = { ...currentUser, ubicacion: match.distrito };
        setCurrentUser(updatedUser);
        sessionStorage.setItem('votoReal_user', JSON.stringify(updatedUser));
      }
    } else {
      setColegioInput('');
      localStorage.removeItem('votoReal_colegio_activo');
    }
  }, [mesaInput, mesasEstructura, cachedUsers, currentUser]);

  const handleAttendanceCheck = async (e) => {
    if (e && e.target && e.target.type === 'checkbox') {
      if (isAttendanceConfirmed) {
        e.target.checked = true;
        return;
      }
      e.target.checked = false;
    }

    if (isAttendanceConfirmed) return;

    const targetMesa = (mesaInput || '').trim();

    // 1. Validar que la mesa esté ingresada y sea la asignada
    const isValid = validateMesaBeforeAttendance(targetMesa);
    if (!isValid) {
      return;
    }

    // 2. Abrir la cámara / selector para la fotografía de confirmación de casilla
    if (attendanceFileRef.current) {
      attendanceFileRef.current.value = '';
      attendanceFileRef.current.click();
    }
  };

  const handlePhotoCaptured = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      await processAttendancePhoto(file, mesaInput, colegioInput, ubicacion);
    }
  };

  const handleTransmit = (origen) => {
    transmitVotes(mesaInput, colegioInput, ubicacion, origen);
  };

  const candidatosProvincial = obtenerCandidatosPorUbicacion('Lima');
  const candidatosDistrital = obtenerCandidatosPorUbicacion(ubicacion);
  const alcaldeProvincial = obtenerAlcaldeActual('Lima');
  const alcaldeDistrital = obtenerAlcaldeActual(ubicacion);

  // Totales rápidos para los badges informativos
  const sumProvManual = Object.values(currentVotes?.provincial || {}).reduce((acc, v) => acc + (typeof v === 'object' ? (Number(v.votos) || 0) : (Number(v) || 0)), 0);
  const sumDistManual = Object.values(currentVotes?.distrital || {}).reduce((acc, v) => acc + (typeof v === 'object' ? (Number(v.votos) || 0) : (Number(v) || 0)), 0);
  const totalManualVotes = sumProvManual + sumDistManual;

  const sumProvOcr = Object.values(ocrVotes?.provincial || {}).reduce((acc, v) => acc + (typeof v === 'object' ? (Number(v.votos) || 0) : (Number(v) || 0)), 0);
  const sumDistOcr = Object.values(ocrVotes?.distrital || {}).reduce((acc, v) => acc + (typeof v === 'object' ? (Number(v.votos) || 0) : (Number(v) || 0)), 0);
  const totalOcrVotes = sumProvOcr + sumDistOcr;

  const isOcrEffectiveLocked = !isSuperAdmin && (
    Boolean(isOcrLocked) ||
    Boolean(currentUser?.voto_imagen_enviado) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem(`votoReal_ocrLocked_${currentUser?.dni}`) === 'true')
  );

  const isManualEffectiveLocked = !isSuperAdmin && (
    Boolean(isManualLocked) ||
    Boolean(currentUser?.voto_manual_enviado) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem(`votoReal_manualLocked_${currentUser?.dni}`) === 'true')
  );

  return (
    <section id="view-counting" className="view active" style={{ display: 'block', maxWidth: '780px', margin: '0 auto', padding: '10px' }}>
      <input
        type="file"
        ref={attendanceFileRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoCaptured}
      />

      <UserInfoBar
        currentUser={currentUser}
        ubicacion={ubicacion}
        isLlegadaConfirmed={isLlegadaConfirmed}
        onConfirmarLlegada={() => confirmLlegadaGPS(colegioInput, ubicacion, mesaInput)}
        isSuperAdmin={isSuperAdmin}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onLogout={logout}
      />

      {isSuperAdmin && (
        <div
          id="district-selector-container"
          className="glass"
          style={{
            marginTop: '-6px',
            marginBottom: '12px',
            padding: '8px 14px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <label
            htmlFor="app-district-select"
            style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <MapPin size={14} /> Distrito:
          </label>
          <select
            id="app-district-select"
            className="select-field"
            value={ubicacion}
            onChange={(e) => {
              const newDist = e.target.value;
              const updated = { ...currentUser, ubicacion: newDist };
              setCurrentUser(updated);
              sessionStorage.setItem('votoReal_user', JSON.stringify(updated));
            }}
            style={{
              margin: 0,
              padding: '6px 12px',
              fontSize: '0.85rem',
              flex: 1,
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              background: 'rgba(0,0,0,0.25)',
              color: 'white'
            }}
          >
            {DISTRITOS_LIMA.map(dist => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>
        </div>
      )}

      <SyncStatusBar isOnline={isOnline} />

      <form id="form-votos" className="counting-form" onSubmit={(e) => e.preventDefault()}>
        <MesaCard
          mesaInput={mesaInput}
          onMesaChange={setMesaInput}
          colegioInput={colegioInput}
          isLlegadaConfirmed={isLlegadaConfirmed}
          onConfirmarLlegada={() => confirmLlegadaGPS(colegioInput, ubicacion, mesaInput)}
          isAttendanceConfirmed={isAttendanceConfirmed}
          onAttendanceCheck={handleAttendanceCheck}
        />

        {/* ======================================================== */}
        {/* PANEL PRINCIPAL COMPACTO CON BOTONES / TARJETAS POPUP    */}
        {/* ======================================================== */}
        <div
          id="counting-hub-container"
          className="glass"
          style={{
            marginTop: '14px',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.7) 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#38bdf8" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>
                Módulos de Conteo y Transmisión
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
              Mesa {mesaInput || '---'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '12px'
            }}
          >
            {/* 1. BOTÓN / TARJETA POPUP CONTEO MANUAL */}
            <div
              className="glass"
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: isManualLocked
                  ? '1px solid rgba(34, 197, 94, 0.35)'
                  : '1px solid rgba(56, 189, 248, 0.3)',
                background: isManualLocked
                  ? 'linear-gradient(145deg, rgba(34, 197, 94, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)'
                  : 'linear-gradient(145deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(37, 99, 235, 0.3))',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8'
                    }}
                  >
                    <ClipboardList size={20} />
                  </div>

                  {/* Estado */}
                  {isManualLocked ? (
                    isSuperAdmin ? (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#fef08a',
                          background: 'rgba(234, 179, 8, 0.2)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          border: '1px solid rgba(234, 179, 8, 0.4)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ShieldAlert size={12} /> Modificar (Superadmin)
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#86efac',
                          background: 'rgba(34, 197, 94, 0.2)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          border: '1px solid rgba(34, 197, 94, 0.4)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle2 size={12} /> Transmitido
                      </span>
                    )
                  ) : (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: '#94a3b8',
                        background: 'rgba(255, 255, 255, 0.06)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      Pendiente
                    </span>
                  )}
                </div>

                <h4 style={{ margin: '0 0 2px 0', fontSize: '0.96rem', fontWeight: 700, color: '#f8fafc' }}>
                  Conteo Manual
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.3 }}>
                  Ingreso casilla por casilla para candidatos y actas.
                </p>

                {totalManualVotes > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#38bdf8', fontWeight: 600 }}>
                    📊 Votos registrados: {totalManualVotes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  id="btn-open-manual-modal"
                  className="btn btn-primary"
                  onClick={() => setIsManualModalOpen(true)}
                  disabled={isManualEffectiveLocked}
                  style={{
                    flex: 1,
                    background: isManualEffectiveLocked
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    borderColor: isManualEffectiveLocked ? 'rgba(255,255,255,0.1)' : '#38bdf8',
                    color: isManualEffectiveLocked ? '#94a3b8' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '10px 8px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                    cursor: isManualEffectiveLocked ? 'not-allowed' : 'pointer',
                    boxShadow: isManualEffectiveLocked ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.25)',
                    opacity: isManualEffectiveLocked ? 0.6 : 1,
                    pointerEvents: isManualEffectiveLocked ? 'none' : 'auto'
                  }}
                >
                  {isManualEffectiveLocked ? <Lock size={15} /> : <ClipboardList size={15} />}
                  <span>{isSuperAdmin && isManualLocked ? 'Modificar' : isManualEffectiveLocked ? 'Transmitido (Bloqueado)' : 'Conteo Manual'}</span>
                </button>

                <button
                  type="button"
                  id="btn-view-manual-modal"
                  className="btn"
                  onClick={() => setIsManualModalOpen(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '10px 14px',
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  title="Ver tabla de votos manuales"
                >
                  <Eye size={15} />
                  <span>Ver</span>
                </button>
              </div>
            </div>

            {/* 2. BOTÓN / TARJETA POPUP CONTEO POR IMAGEN (OCR) */}
            <div
              className="glass"
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: isOcrLocked
                  ? '1px solid rgba(168, 85, 247, 0.4)'
                  : '1px solid rgba(168, 85, 247, 0.3)',
                background: isOcrLocked
                  ? 'linear-gradient(145deg, rgba(168, 85, 247, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)'
                  : 'linear-gradient(145deg, rgba(168, 85, 247, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(124, 58, 237, 0.35))',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#c084fc'
                    }}
                  >
                    <Camera size={20} />
                  </div>

                  {/* Estado */}
                  {isOcrEffectiveLocked ? (
                    isSuperAdmin ? (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#fef08a',
                          background: 'rgba(234, 179, 8, 0.2)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          border: '1px solid rgba(234, 179, 8, 0.4)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ShieldAlert size={12} /> Reescanear (Superadmin)
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#4ade80',
                          background: 'rgba(16, 185, 129, 0.2)',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle2 size={12} /> Transmitido
                      </span>
                    )
                  ) : (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        color: '#c084fc',
                        background: 'rgba(168, 85, 247, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Sparkles size={11} /> Con IA
                    </span>
                  )}
                </div>

                <h4 style={{ margin: '0 0 2px 0', fontSize: '0.96rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Conteo por Imagen (OCR)
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.3 }}>
                  Escaneo inteligente de actas con IA y extracción de votos.
                </p>

                {totalOcrVotes > 0 && (
                  <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#c084fc', fontWeight: 600 }}>
                    📷 Votos de acta detectados: {totalOcrVotes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  id="btn-scan-camera-direct"
                  className="btn btn-secondary"
                  onClick={() => !isOcrEffectiveLocked && setIsScannerModalOpen(true)}
                  disabled={isOcrEffectiveLocked}
                  style={{
                    flex: 1,
                    background: isOcrEffectiveLocked
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                    borderColor: isOcrEffectiveLocked ? 'rgba(255,255,255,0.1)' : '#a855f7',
                    color: isOcrEffectiveLocked ? '#94a3b8' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '10px 8px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                    cursor: isOcrEffectiveLocked ? 'not-allowed' : 'pointer',
                    boxShadow: isOcrEffectiveLocked ? 'none' : '0 4px 12px rgba(147, 51, 234, 0.25)',
                    opacity: isOcrEffectiveLocked ? 0.6 : 1,
                    pointerEvents: isOcrEffectiveLocked ? 'none' : 'auto'
                  }}
                >
                  {isOcrEffectiveLocked ? <Lock size={15} /> : <Camera size={15} />}
                  <span>{isSuperAdmin && isOcrLocked ? 'Reescanear' : isOcrEffectiveLocked ? 'Escaneado (Bloqueado)' : 'Escanear Acta'}</span>
                </button>

                <button
                  type="button"
                  id="btn-open-ocr-review"
                  className="btn"
                  onClick={() => setIsOcrModalOpen(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '10px 14px',
                    fontSize: '0.84rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  title="Ver tabla de votos OCR"
                >
                  <Eye size={15} />
                  <span>Ver</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ======================================================== */}
      {/* POPUP / MODAL DE CONTEO MANUAL                           */}
      {/* ======================================================== */}
      <ManualCountingModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        mesaInput={mesaInput}
        ubicacion={ubicacion}
        candidatosProvincial={candidatosProvincial}
        candidatosDistrital={candidatosDistrital}
        alcaldeProvincial={alcaldeProvincial}
        alcaldeDistrital={alcaldeDistrital}
        currentVotes={currentVotes}
        onVoteChange={handleVoteChange}
        onTransmit={() => {
          handleTransmit('MANUAL');
        }}
        isTransmitting={isTransmitting}
        isManualLocked={isManualLocked}
        isSuperAdmin={Boolean(isSuperAdmin)}
      />

      {/* ======================================================== */}
      {/* POPUP / MODAL DE CONTEO POR IMAGEN (OCR)                 */}
      {/* ======================================================== */}
      <OcrReviewModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        mesaInput={mesaInput}
        ubicacion={ubicacion}
        candidatosProvincial={candidatosProvincial}
        candidatosDistrital={candidatosDistrital}
        alcaldeProvincial={alcaldeProvincial}
        alcaldeDistrital={alcaldeDistrital}
        ocrVotes={ocrVotes}
        onOpenScanner={() => {
          setIsScannerModalOpen(true);
        }}
        onTransmit={() => {
          handleTransmit('IMAGEN');
        }}
        isTransmitting={isTransmitting}
        isOcrLocked={isOcrLocked}
        isSuperAdmin={Boolean(isSuperAdmin)}
      />
    </section>
  );
};
