import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useVotes } from '../../hooks/useVotes';
import { useAttendance } from '../../hooks/useAttendance';
import { DISTRITOS_LIMA, obtenerCandidatosPorUbicacion, obtenerAlcaldeActual } from '../../constants/distritos';
import { buscarColegioPorMesa } from '../../constants/data';
import { esCoordinador } from '../../constants/usuarios';
import { UserInfoBar } from './components/UserInfoBar';
import { SyncStatusBar } from './components/SyncStatusBar';
import { CountingTabs } from './components/CountingTabs';
import { MesaCard } from './components/MesaCard';
import { ManualCounting } from './Manual/ManualCounting';
import { OcrCounting } from './OCR/OcrCounting';
import { MapPin } from 'lucide-react';

export const CountingView = () => {
  const {
    currentUser, setCurrentUser, logout,
    currentView, setCurrentView,
    activeViewFilter, setActiveViewFilter,
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

  const { currentVotes, ocrVotes, handleVoteChange, transmitVotes, isTransmitting, isManualLocked, isOcrLocked } = useVotes();
  const {
    isAttendanceConfirmed, isLlegadaConfirmed,
    validateMesaBeforeAttendance, verifyAttendanceGpsRange,
    processAttendancePhoto, confirmLlegadaGPS
  } = useAttendance();

  const ubicacion = currentUser?.ubicacion || 'Lima';
  const isSuperAdmin = currentUser && (
    currentUser.dni === 'Admin#2026$Secure!VotoReal' ||
    currentUser.dni === '99999999' ||
    (currentUser.nombre || '').toLowerCase().includes('super admin')
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
      return;
    }

    const match = buscarColegioPorMesa(cleanMesa, mesasEstructura, cachedUsers, currentUser);

    if (match && match.colegio) {
      setColegioInput(match.colegio);
      if (match.distrito && currentUser && currentUser.ubicacion !== match.distrito) {
        const updatedUser = { ...currentUser, ubicacion: match.distrito };
        setCurrentUser(updatedUser);
        sessionStorage.setItem('votoReal_user', JSON.stringify(updatedUser));
      }
    } else {
      setColegioInput('');
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

  return (
    <section id="view-counting" className="view active" style={{ display: 'block' }}>
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
            marginTop: '-8px',
            marginBottom: '16px',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
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
              borderRadius: '4px',
              background: 'rgba(0,0,0,0.2)',
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

      <CountingTabs
        activeFilter={activeViewFilter}
        onChangeFilter={setActiveViewFilter}
      />

      <form id="form-votos" className="counting-form" onSubmit={(e) => e.preventDefault()}>
        <MesaCard
          mesaInput={mesaInput}
          onMesaChange={setMesaInput}
          colegioInput={colegioInput}
          isAttendanceConfirmed={isAttendanceConfirmed}
          onAttendanceCheck={handleAttendanceCheck}
        />

        {activeViewFilter === 'manual' && (
          <ManualCounting
            ubicacion={ubicacion}
            candidatosProvincial={candidatosProvincial}
            candidatosDistrital={candidatosDistrital}
            alcaldeProvincial={alcaldeProvincial}
            alcaldeDistrital={alcaldeDistrital}
            currentVotes={currentVotes}
            onVoteChange={handleVoteChange}
            onTransmit={() => handleTransmit('MANUAL')}
            isTransmitting={isTransmitting}
            isManualLocked={isManualLocked}
          />
        )}

        {activeViewFilter === 'ocr' && (
          <OcrCounting
            ubicacion={ubicacion}
            candidatosProvincial={candidatosProvincial}
            candidatosDistrital={candidatosDistrital}
            alcaldeProvincial={alcaldeProvincial}
            alcaldeDistrital={alcaldeDistrital}
            ocrVotes={ocrVotes}
            onOpenScanner={() => setIsScannerModalOpen(true)}
            onTransmit={() => handleTransmit('IMAGEN')}
            isTransmitting={isTransmitting}
            isOcrLocked={isOcrLocked}
          />
        )}
      </form>
    </section>
  );
};
