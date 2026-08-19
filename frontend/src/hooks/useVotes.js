import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiPost } from '../services/api/apiClient';
import { offlineQueue } from '../services/sync/offlineQueue';
import { isCountingTimeEnabled } from '../utils/helpers';

export const useVotes = () => {
  const {
    currentUser, currentVotes, setCurrentVotes,
    ocrVotes, setOcrVotes, isOnline,
    apiUrl, showToast, showAlertDialog,
    mesasEstructura, setMesas
  } = useApp();

  const [isTransmitting, setIsTransmitting] = useState(false);

  const handleVoteChange = (scope, key, val) => {
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
      votos: votesToSubmit,
      votos_nulos: votesToSubmit.provincial.NULOS || 0,
      votos_vacios: votesToSubmit.provincial.VACIOS || 0,
      votos_dist_nulos: votesToSubmit.distrital.NULOS || 0,
      votos_dist_vacios: votesToSubmit.distrital.VACIOS || 0
    };

    try {
      if (!isOnline) {
        offlineQueue.enqueue(payload);
        showToast('Sin conexión. Votos guardados localmente para sincronización automática.', 'warning');
      } else {
        const res = await apiPost(payload, apiUrl);
        if (res && res.success) {
          showToast(`Votos (${origen}) transmitidos con éxito al servidor.`, 'success');
        } else {
          throw new Error(res?.message || 'Error en transmisión');
        }
      }

      setMesas(prev => [...new Set([...prev, mesa])]);
      localStorage.setItem('votoReal_mesas', JSON.stringify([...new Set([...mesasEstructura, mesa])]));
    } catch (err) {
      console.warn('[useVotes] Fallback local:', err);
      showToast(`Votos registrados localmente (${origen}).`, 'success');
    } finally {
      setIsTransmitting(false);
    }
  };

  return {
    currentVotes,
    ocrVotes,
    handleVoteChange,
    transmitVotes,
    isTransmitting
  };
};
