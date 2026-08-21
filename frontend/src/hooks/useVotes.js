import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiPost } from '../services/api/apiClient';
import { offlineQueue } from '../services/sync/offlineQueue';
import { isCountingTimeEnabled } from '../utils/helpers';
import { obtenerCandidatosPorUbicacion, PARTIDO_ID_MAP } from '../constants/distritos';

export const useVotes = () => {
  const {
    currentUser, currentVotes, setCurrentVotes,
    ocrVotes, setOcrVotes, isOnline,
    apiUrl, showToast, showAlertDialog,
    mesasEstructura, setMesas
  } = useApp();

  const [isTransmitting, setIsTransmitting] = useState(false);

  const [isManualLocked, setIsManualLocked] = useState(() => {
    if (currentUser?.dni) {
      if (currentUser?.voto_manual_enviado !== undefined) {
        return Boolean(currentUser.voto_manual_enviado);
      }
      const local = localStorage.getItem(`votoReal_manualLocked_${currentUser.dni}`);
      return local === 'true';
    }
    return false;
  });

  // Sincronización en tiempo real con votos_detalle en la base de datos
  useEffect(() => {
    if (!currentUser?.dni) return;

    let isMounted = true;
    const syncVoteStatusFromDb = async () => {
      try {
        const res = await apiPost({ action: 'obtener_asistencia_por_dni', dni: currentUser.dni }, apiUrl);
        if (res && res.success && isMounted) {
          const dbVotoEnviado = Boolean(res.voto_manual_enviado);
          setIsManualLocked(dbVotoEnviado);
          if (dbVotoEnviado) {
            localStorage.setItem(`votoReal_manualLocked_${currentUser.dni}`, 'true');
          } else {
            // Si fue borrado de votos_detalle, desbloquear y limpiar localStorage
            localStorage.removeItem(`votoReal_manualLocked_${currentUser.dni}`);
          }
        }
      } catch (e) {
        console.warn('[useVotes] Error sincronizando votos manuales desde BD:', e);
      }
    };

    syncVoteStatusFromDb();
    return () => { isMounted = false; };
  }, [currentUser?.dni, apiUrl]);

  const handleVoteChange = (scope, key, val) => {
    if (isManualLocked) return;
    const intVal = parseInt(val, 10);
    const safeVal = isNaN(intVal) || intVal < 0 ? 0 : intVal > 999 ? 999 : intVal;

    setCurrentVotes(prev => ({
      ...prev,
      [scope]: {
        ...prev[scope],
        [key]: safeVal
      }
    }));
  };

  const transmitVotes = async (mesaVal, colegioInput, ubicacion, origen = 'MANUAL') => {
    if (isTransmitting) return;

    if (origen === 'MANUAL' && isManualLocked) {
      showToast('El conteo manual ya fue transmitido y se encuentra bloqueado.', 'warning');
      return;
    }

    if (!isCountingTimeEnabled(currentUser)) {
      showToast('El registro de votos está habilitado a partir de las 5:00 PM.', 'error');
      return;
    }

    const mesa = (mesaVal || '').trim();
    if (!mesa) {
      showAlertDialog({
        title: 'Mesa Requerida',
        message: 'Por favor, ingresa el número de mesa antes de transmitir.',
        buttonText: 'Aceptar',
        type: 'warning'
      });
      return;
    }

    setIsTransmitting(true);

    const votesToSubmit = (origen === 'IMAGEN') ? ocrVotes : currentVotes;
    const candProv = obtenerCandidatosPorUbicacion('Lima');
    const candDist = obtenerCandidatosPorUbicacion(ubicacion || 'Lima');

    // Estructurar votos provinciales y distritales con candidatos y dígitos asegurados
    const formattedProv = {};
    const formattedDist = {};

    Object.keys(PARTIDO_ID_MAP).forEach(partyKey => {
      const rawProvVal = votesToSubmit.provincial?.[partyKey];
      const pVotes = typeof rawProvVal === 'object' 
        ? (parseInt(rawProvVal?.votos, 10) || 0) 
        : (parseInt(rawProvVal, 10) || 0);

      formattedProv[partyKey] = {
        candidato: candProv[partyKey] || '',
        votos: pVotes
      };

      const rawDistVal = votesToSubmit.distrital?.[partyKey];
      const dVotes = typeof rawDistVal === 'object' 
        ? (parseInt(rawDistVal?.votos, 10) || 0) 
        : (parseInt(rawDistVal, 10) || 0);

      formattedDist[partyKey] = {
        candidato: candDist[partyKey] || '',
        votos: dVotes
      };
    });

    const pNulos = parseInt(votesToSubmit.provincial?.NULOS, 10) || 0;
    const pVacios = parseInt(votesToSubmit.provincial?.VACIOS, 10) || 0;
    const dNulos = parseInt(votesToSubmit.distrital?.NULOS, 10) || 0;
    const dVacios = parseInt(votesToSubmit.distrital?.VACIOS, 10) || 0;

    const payload = {
      action: 'registrar_votos',
      brigadista: currentUser?.nombre,
      dni: currentUser?.dni,
      departamento: 'Lima',
      provincia: 'Lima',
      ubicacion: ubicacion,
      colegio: colegioInput,
      mesa: mesa,
      origen: origen,
      votos: {
        provincial: formattedProv,
        distrital: formattedDist
      },
      votos_nulos: pNulos,
      votos_vacios: pVacios,
      votos_dist_nulos: dNulos,
      votos_dist_vacios: dVacios
    };

    try {
      if (!isOnline) {
        offlineQueue.enqueue(payload);
        showToast('Sin conexión. Votos guardados localmente para sincronización automática.', 'warning');
      } else {
        const res = await apiPost(payload, apiUrl);
        if (res && res.success) {
          showToast('¡Votos registrados y transmitidos con éxito al sistema!', 'success');
        } else {
          throw new Error(res?.message || 'Error en transmisión');
        }
      }

      if (origen === 'MANUAL') {
        setIsManualLocked(true);
        if (currentUser?.dni) {
          localStorage.setItem(`votoReal_manualLocked_${currentUser.dni}`, 'true');
          localStorage.setItem(`votoReal_manualLocked_${currentUser.dni}_${mesa}`, 'true');
        }
      }

      setMesas(prev => [...new Set([...prev, mesa])]);
      localStorage.setItem('votoReal_mesas', JSON.stringify([...new Set([...mesasEstructura, mesa])]));
    } catch (err) {
      console.warn('[useVotes] Fallback local:', err);
      if (origen === 'MANUAL') {
        setIsManualLocked(true);
        if (currentUser?.dni) {
          localStorage.setItem(`votoReal_manualLocked_${currentUser.dni}`, 'true');
        }
      }
      showToast('Votos registrados localmente.', 'success');
    } finally {
      setIsTransmitting(false);
    }
  };

  return {
    currentVotes,
    ocrVotes,
    handleVoteChange,
    transmitVotes,
    isTransmitting,
    isManualLocked
  };
};
