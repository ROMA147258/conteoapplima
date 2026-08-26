import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiPost } from '../services/api/apiClient';
import { offlineQueue } from '../services/sync/offlineQueue';
import { isCountingTimeEnabled } from '../utils/helpers';
import {
  obtenerCandidatosPorUbicacion,
  obtenerListaCandidatosProvincial,
  obtenerListaCandidatosDistrital,
  PARTIDO_ID_MAP
} from '../constants/distritos';

export const useVotes = () => {
  const {
    currentUser, currentVotes, setCurrentVotes,
    ocrVotes, setOcrVotes, isOnline,
    apiUrl, showToast, showAlertDialog,
    mesasEstructura, setMesas
  } = useApp();

  const [isTransmitting, setIsTransmitting] = useState(false);

  // Bloqueo de Conteo Manual (solo 1 vez)
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

  // Bloqueo de Conteo por Imagen / OCR (solo 1 vez)
  const [isOcrLocked, setIsOcrLocked] = useState(() => {
    if (currentUser?.dni) {
      if (currentUser?.voto_imagen_enviado !== undefined) {
        return Boolean(currentUser.voto_imagen_enviado);
      }
      const local = localStorage.getItem(`votoReal_ocrLocked_${currentUser.dni}`);
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
          // 1. Voto Manual
          const dbVotoManual = Boolean(res.voto_manual_enviado);
          setIsManualLocked(dbVotoManual);
          if (dbVotoManual) {
            localStorage.setItem(`votoReal_manualLocked_${currentUser.dni}`, 'true');
          } else {
            localStorage.removeItem(`votoReal_manualLocked_${currentUser.dni}`);
          }

          // 2. Voto Imagen / OCR
          const dbVotoImagen = Boolean(res.voto_imagen_enviado);
          setIsOcrLocked(dbVotoImagen);
          if (dbVotoImagen) {
            localStorage.setItem(`votoReal_ocrLocked_${currentUser.dni}`, 'true');
          } else {
            localStorage.removeItem(`votoReal_ocrLocked_${currentUser.dni}`);
          }
        }
      } catch (e) {
        console.warn('[useVotes] Error sincronizando estado de votos desde BD:', e);
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

    // Validación de Bloqueo Único
    if (origen === 'MANUAL' && isManualLocked) {
      showToast('El conteo manual ya fue transmitido y se encuentra bloqueado (solo 1 envío permitido).', 'warning');
      return;
    }

    if (origen === 'IMAGEN' && isOcrLocked) {
      showToast('El conteo por imagen ya fue transmitido y se encuentra bloqueado (solo 1 envío permitido).', 'warning');
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
    const provCandidates = obtenerListaCandidatosProvincial();
    const distCandidates = obtenerListaCandidatosDistrital(ubicacion || 'Lima');

    // Estructurar votos provinciales y distritales con candidatos y dígitos asegurados
    const formattedProv = {};
    const formattedDist = {};

    provCandidates.forEach(cand => {
      const rawProvVal = votesToSubmit.provincial?.[cand.key];
      const pVotes = typeof rawProvVal === 'object' 
        ? (parseInt(rawProvVal?.votos, 10) || 0) 
        : (parseInt(rawProvVal, 10) || 0);

      formattedProv[cand.key] = {
        candidato: cand.candidato || '',
        organizacion: cand.organizacion || cand.partyLong || '',
        votos: pVotes
      };
    });

    distCandidates.forEach(cand => {
      const rawDistVal = votesToSubmit.distrital?.[cand.key];
      const dVotes = typeof rawDistVal === 'object' 
        ? (parseInt(rawDistVal?.votos, 10) || 0) 
        : (parseInt(rawDistVal, 10) || 0);

      formattedDist[cand.key] = {
        candidato: cand.candidato || '',
        organizacion: cand.organizacion || cand.partyLong || '',
        votos: dVotes
      };
    });

    const pNulos = parseInt(votesToSubmit.provincial?.NULOS, 10) || 0;
    const pBlanco = parseInt(votesToSubmit.provincial?.BLANCO ?? votesToSubmit.provincial?.VACIOS, 10) || 0;
    const pImpugnados = parseInt(votesToSubmit.provincial?.IMPUGNADOS, 10) || 0;

    const dNulos = parseInt(votesToSubmit.distrital?.NULOS, 10) || 0;
    const dBlanco = parseInt(votesToSubmit.distrital?.BLANCO ?? votesToSubmit.distrital?.VACIOS, 10) || 0;
    const dImpugnados = parseInt(votesToSubmit.distrital?.IMPUGNADOS, 10) || 0;

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
      votos_blancos: pBlanco,
      votos_vacios: pBlanco,
      votos_impugnados: pImpugnados,
      votos_dist_nulos: dNulos,
      votos_dist_blancos: dBlanco,
      votos_dist_vacios: dBlanco,
      votos_dist_impugnados: dImpugnados
    };

    try {
      if (!isOnline) {
        offlineQueue.enqueue(payload);
        showToast('Sin conexión. Votos guardados localmente para sincronización automática.', 'warning');
      } else {
        const res = await apiPost(payload, apiUrl);
        if (res && res.success) {
          showToast(`¡Votos de ${origen === 'IMAGEN' ? 'Imagen' : 'Manual'} registrados y transmitidos con éxito!`, 'success');
        } else {
          throw new Error(res?.message || 'Error en transmisión');
        }
      }

      // Bloquear según el origen enviado
      if (origen === 'MANUAL') {
        setIsManualLocked(true);
        if (currentUser?.dni) {
          localStorage.setItem(`votoReal_manualLocked_${currentUser.dni}`, 'true');
          localStorage.setItem(`votoReal_manualLocked_${currentUser.dni}_${mesa}`, 'true');
        }
      } else if (origen === 'IMAGEN') {
        setIsOcrLocked(true);
        if (currentUser?.dni) {
          localStorage.setItem(`votoReal_ocrLocked_${currentUser.dni}`, 'true');
          localStorage.setItem(`votoReal_ocrLocked_${currentUser.dni}_${mesa}`, 'true');
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
      } else if (origen === 'IMAGEN') {
        setIsOcrLocked(true);
        if (currentUser?.dni) {
          localStorage.setItem(`votoReal_ocrLocked_${currentUser.dni}`, 'true');
        }
      }
      showToast(`Votos de ${origen === 'IMAGEN' ? 'Imagen' : 'Manual'} registrados localmente.`, 'success');
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
    isManualLocked,
    isOcrLocked
  };
};
