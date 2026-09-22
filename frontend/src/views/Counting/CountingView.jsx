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
  ShieldCheck,
  Users,
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
    setIsScannerModalOpen,
    mesasEstructura, cachedUsers
  } = useApp();

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

  const isCoordinadorDistrital = Boolean(
    (currentUser?.rol || '').toLowerCase().includes('distrital') ||
    (currentUser?.tipo_interfaz || '') === 'coordinador_distrital' ||
    (currentUser?.tabla_origen || '').toLowerCase() === 'rcoordinadoresd' ||
    (currentUser?.dni || '').toString() === '43310677'
  );

  const ubicacion = currentUser?.distrito || currentUser?.ubicacion || (isCoordinadorDistrital ? 'Villa María del Triunfo' : 'Lima');
  const isSuperAdmin = currentUser && (
    currentUser.dni === 'Admin#2026$Secure!VotoReal' ||
    currentUser.dni === '99999999' ||
    (currentUser.nombre || '').toLowerCase().includes('super admin') ||
    (currentUser.rol || '').toLowerCase().includes('admin')
  );

  // Detección de Personero de Villa María del Triunfo (VMT)
  const cleanUbicacion = (
    currentUser?.ubicacion ||
    currentUser?.distrito ||
    currentUser?.distrito_asignado ||
    currentUser?.distrito_donde_vota ||
    ubicacion ||
    ''
  )
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const isVMT = cleanUbicacion.includes('villa maria del triunfo') || cleanUbicacion === 'vmt';
  const isPersoneroVMT = isVMT && !isSuperAdmin && !isCoordinadorDistrital;

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

  // Sincronizar mesa y local cada vez que cambia el usuario activo (DNI)
  useEffect(() => {
    if (!currentUser?.dni) {
      setMesaInput('');
      setColegioInput('');
      setIsManualModalOpen(false);
      setIsOcrModalOpen(false);
      return;
    }

    const localConfirmed = localStorage.getItem(`votoReal_attConfirmed_${currentUser.dni}`) === 'true';
    if (isAttendanceConfirmed || localConfirmed) {
      const savedMesa = localStorage.getItem(`votoReal_attMesa_${currentUser.dni}`) || currentUser.mesa || '';
      const savedColegio = localStorage.getItem(`votoReal_attColegio_${currentUser.dni}`) || currentUser.colegio || '';
      setMesaInput(savedMesa);
      setColegioInput(savedColegio);
    } else {
      setMesaInput(currentUser.mesa || '');
      setColegioInput(currentUser.colegio || '');
    }
    setIsManualModalOpen(false);
    setIsOcrModalOpen(false);
  }, [currentUser?.dni, isAttendanceConfirmed]);

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
      if (match.distrito && currentUser && currentUser.ubicacion !== match.distrito && !isCoordinadorDistrital) {
        const updatedUser = { ...currentUser, ubicacion: match.distrito };
        setCurrentUser(updatedUser);
        sessionStorage.setItem('votoReal_user', JSON.stringify(updatedUser));
      }
    } else {
      setColegioInput('');
      localStorage.removeItem('votoReal_colegio_activo');
    }
  }, [mesaInput, mesasEstructura, cachedUsers, currentUser, isCoordinadorDistrital]);

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

  const isOcrEffectiveLocked = !isSuperAdmin && !isCoordinadorDistrital && (
    Boolean(isOcrLocked) ||
    Boolean(currentUser?.voto_imagen_enviado) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem(`votoReal_ocrLocked_${currentUser?.dni}`) === 'true')
  );

  const isManualEffectiveLocked = !isSuperAdmin && !isCoordinadorDistrital && (
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

      {/* Banner de Navegación para Coordinadores (Distrital, Zonal, Local) */}
      {(isCoordinadorDistrital || Boolean((currentUser?.rol || '').toLowerCase().includes('coordinador') || (currentUser?.tipo_interfaz || '').includes('coordinador') || (currentUser?.tabla_origen || '').includes('coordinador'))) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '14px',
          padding: '10px 16px',
          marginBottom: '12px',
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#e0f2fe', padding: '6px', borderRadius: '8px' }}>
              <ShieldCheck size={20} color="#0284c7" />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0369a1', letterSpacing: '0.3px' }}>
                {isCoordinadorDistrital ? 'ACCESO TOTAL COORDINADORA DISTRITAL' : 'MODO COORDINADOR'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                Conteo en Vivo activo. Puedes registrar votos de cualquier mesa o volver a Supervisión.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('view-coordinator')}
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)'
            }}
          >
            <Users size={16} />
            <span>Supervisión & Asistencia</span>
          </button>
        </div>
      )}

      <UserInfoBar
        currentUser={currentUser}
        ubicacion={ubicacion}
        isLlegadaConfirmed={isLlegadaConfirmed}
        onConfirmarLlegada={() => confirmLlegadaGPS(colegioInput, ubicacion, mesaInput)}
        isSuperAdmin={isSuperAdmin}
        onLogout={logout}
      />

      {/* Selector de Distrito solo para SuperAdmin (No para Coordinadora Distrital que ya está fija en su distrito) */}
      {(isSuperAdmin && !isCoordinadorDistrital) && (
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
            gap: '10px',
            background: '#ffffff',
            border: '1px solid #e2e8f0'
          }}
        >
          <label
            htmlFor="app-district-select"
            style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#334155', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
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
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              background: '#f8fafc',
              color: '#0f172a'
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
        {!isCoordinadorDistrital && (
          <MesaCard
            mesaInput={mesaInput}
            onMesaChange={setMesaInput}
            colegioInput={colegioInput}
            isAttendanceConfirmed={isAttendanceConfirmed}
            onAttendanceCheck={handleAttendanceCheck}
          />
        )}

        {/* ======================================================== */}
        {/* PANEL DE ESCRUTINIO: REGISTRO MANUAL Y POR IMAGEN        */}
        {/* (Exclusivo para otros distritos; VMT solo asistencia)    */}
        {/* ======================================================== */}
        {isPersoneroVMT ? (
          <div
            className="glass"
            style={{
              marginTop: '14px',
              padding: '20px 16px',
              borderRadius: '16px',
              border: '1px solid #bae6fd',
              background: '#ffffff',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '10px'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#e0f2fe',
                border: '1px solid #bae6fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7'
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                Módulo de Asistencia - Villa María del Triunfo
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', maxWidth: '420px', lineHeight: 1.4 }}>
                Tu función designada en tu mesa es la <strong>confirmación de asistencia</strong> en tu local de votación. Al confirmar tu llegada con tu fotografía de acreditación, tu registro quedará guardado satisfactoriamente.
              </p>
            </div>
          </div>
        ) : (
          <div
            id="counting-hub-container"
            className="glass"
            style={{
              marginTop: '14px',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#0284c7" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                  Escrutinio
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                Mesa de sufragio {mesaInput || '---'}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '12px'
              }}
            >
              {/* 1. BOTÓN / TARJETA POPUP REGISTRO MANUAL */}
              <div
                className="glass"
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  border: isManualLocked
                    ? '1px solid #86efac'
                    : '1px solid #bae6fd',
                  background: isManualLocked
                    ? '#f0fdf4'
                    : '#f0f9ff',
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
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0284c7'
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
                            color: '#854d0e',
                            background: '#fef9c3',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            border: '1px solid #fde047',
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
                            color: '#15803d',
                            background: '#dcfce7',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            border: '1px solid #86efac',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <CheckCircle2 size={12} /> Completado
                        </span>
                      )
                    ) : (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: '#475569',
                          background: '#f1f5f9',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        Pendiente
                      </span>
                    )}
                  </div>

                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                    Registro Manual
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', lineHeight: 1.3 }}>
                    Ingreso casilla por casilla para candidatos y actas.
                  </p>

                  {totalManualVotes > 0 && (
                    <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#0284c7', fontWeight: 700 }}>
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
                        ? '#e2e8f0'
                        : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      borderColor: isManualEffectiveLocked ? '#cbd5e1' : '#0284c7',
                      color: isManualEffectiveLocked ? '#64748b' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '10px 8px',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      borderRadius: '8px',
                      cursor: isManualEffectiveLocked ? 'not-allowed' : 'pointer',
                      boxShadow: isManualEffectiveLocked ? 'none' : '0 2px 8px rgba(2, 132, 199, 0.25)',
                      opacity: isManualEffectiveLocked ? 0.7 : 1,
                      pointerEvents: isManualEffectiveLocked ? 'none' : 'auto'
                    }}
                  >
                    {isManualEffectiveLocked ? <Lock size={15} /> : <ClipboardList size={15} />}
                    <span>{isSuperAdmin && isManualLocked ? 'Modificar' : isManualEffectiveLocked ? 'Transmitido (Bloqueado)' : 'Registro Manual'}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-view-manual-modal"
                    className="btn"
                    onClick={() => setIsManualModalOpen(true)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '10px 14px',
                      fontSize: '0.84rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700
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
                    ? '1px solid #86efac'
                    : '1px solid #e9d5ff',
                  background: isOcrLocked
                    ? '#f0fdf4'
                    : '#faf5ff',
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
                        background: '#f3e8ff',
                        border: '1px solid #e9d5ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#7e22ce'
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
                            color: '#854d0e',
                            background: '#fef9c3',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            border: '1px solid #fde047',
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
                            color: '#15803d',
                            background: '#dcfce7',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            border: '1px solid #86efac',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <CheckCircle2 size={12} /> Completado
                        </span>
                      )
                    ) : (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: '#475569',
                          background: '#f1f5f9',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        Pendiente
                      </span>
                    )}
                  </div>

                  <h4 style={{ margin: '0 0 2px 0', fontSize: '0.96rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Conteo por Imagen (OCR)
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', lineHeight: 1.3 }}>
                    Escaneo inteligente de actas con IA y extracción de votos.
                  </p>

                  {totalOcrVotes > 0 && (
                    <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#7e22ce', fontWeight: 700 }}>
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
                        ? '#e2e8f0'
                        : 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                      borderColor: isOcrEffectiveLocked ? '#cbd5e1' : '#7e22ce',
                      color: isOcrEffectiveLocked ? '#64748b' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '10px 8px',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      borderRadius: '8px',
                      cursor: isOcrEffectiveLocked ? 'not-allowed' : 'pointer',
                      boxShadow: isOcrEffectiveLocked ? 'none' : '0 2px 8px rgba(126, 34, 206, 0.25)',
                      opacity: isOcrEffectiveLocked ? 0.7 : 1,
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
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '10px 14px',
                      fontSize: '0.84rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                    title="Ver acta escaneada"
                  >
                    <Eye size={15} />
                    <span>Ver</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* ======================================================== */}
      {/* POPUP / MODAL DE CONTEO MANUAL Y OCR (Solo otros distritos) */}
      {/* ======================================================== */}
      {!isPersoneroVMT && (
        <>
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
        </>
      )}
    </section>
  );
};
