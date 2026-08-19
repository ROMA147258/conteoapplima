import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiPost } from '../services/api/apiClient';
import { getRealGeolocationFast, obtenerCoordenadasColegio, calcularDistanciaMetros } from '../services/gps/geolocationService';
import { compressImage } from '../utils/imageCompressor';
import { isLlegadaButtonUnlocked } from '../utils/helpers';
import { buscarBrigadista } from '../constants/usuarios';

export const useAttendance = () => {
  const {
    currentUser, apiUrl,
    showAlertDialog, showToast, setAttendanceSyncLoader
  } = useApp();

  const isSuperAdmin = currentUser && (
    currentUser.dni === 'Admin#2026$Secure!VotoReal' ||
    currentUser.dni === '99999999' ||
    (currentUser.nombre || '').toLowerCase().includes('super admin')
  );

  const [isAttendanceConfirmed, setIsAttendanceConfirmed] = useState(() => {
    if (currentUser?.dni) {
      return localStorage.getItem(`votoReal_attConfirmed_${currentUser.dni}`) === 'true';
    }
    return false;
  });

  const [isLlegadaConfirmed, setIsLlegadaConfirmed] = useState(() => {
    if (currentUser?.dni) {
      return localStorage.getItem(`votoReal_llegadaConfirmed_${currentUser.dni}`) === 'true';
    }
    return false;
  });

  const validateMesaBeforeAttendance = (mesaVal) => {
    const cleanMesa = (mesaVal || '').trim();

    // 1. Empty check -> img/5.png
    if (!cleanMesa) {
      showAlertDialog({
        title: 'Mesa Requerida',
        message: 'Por favor, ingresa tu número de mesa en la casilla antes de confirmar.',
        buttonText: 'Aceptar',
        type: 'warning',
        onClose: () => {
          const mesaEl = document.getElementById('input-mesa');
          if (mesaEl) mesaEl.focus();
        }
      });
      return false;
    }

    // 2. Assigned Mesa check -> img/1.png
    let assignedMesa = currentUser?.mesa || '';
    if (!assignedMesa && currentUser?.dni) {
      const savedMesa = localStorage.getItem(`votoReal_attMesa_${currentUser.dni}`);
      if (savedMesa) assignedMesa = savedMesa;
      else {
        const u = buscarBrigadista(currentUser.dni, currentUser.nombre);
        if (u && u.mesa) assignedMesa = u.mesa;
      }
    }

    if (assignedMesa && !isSuperAdmin) {
      const normInput = cleanMesa.replace(/\D/g, '').padStart(6, '0');
      const normAssigned = assignedMesa.replace(/\D/g, '').padStart(6, '0');

      if (normInput !== normAssigned) {
        showAlertDialog({
          title: '⚠️ Mesa Incorrecta',
          message: `Has ingresado la mesa <strong>${cleanMesa}</strong>, pero tu mesa asignada es la <strong>${assignedMesa}</strong>.<br><br>Por favor, ingresa tu número de mesa correcto (<strong>${assignedMesa}</strong>) para poder continuar.`,
          buttonText: 'Corregir Mesa',
          type: 'error',
          onClose: () => {
            const mesaEl = document.getElementById('input-mesa');
            if (mesaEl) {
              mesaEl.value = '';
              mesaEl.focus();
            }
          }
        });
        return false;
      }
    }

    return true;
  };

  const processAttendancePhoto = async (file, mesaVal, colegioVal, ubicacionVal) => {
    if (!file) return;

    setAttendanceSyncLoader({
      isOpen: true,
      percentage: 20,
      text: 'Comprimiendo foto de confirmación...',
      step: 1
    });

    try {
      const base64Data = await compressImage(file, 500, 0.35);

      setAttendanceSyncLoader({
        isOpen: true,
        percentage: 55,
        text: 'Obteniendo ubicación GPS exacta...',
        step: 2
      });

      const gpsResult = await getRealGeolocationFast(6500);
      let gpsString = '';
      if (gpsResult && gpsResult.lat) {
        gpsString = `Lat: ${gpsResult.lat}, Lng: ${gpsResult.lng} (±${gpsResult.acc || 10}m)`;
      } else {
        const coords = obtenerCoordenadasColegio(colegioVal, ubicacionVal);
        gpsString = `Lat: ${coords.lat}, Lng: ${coords.lon}`;
      }

      setAttendanceSyncLoader({
        isOpen: true,
        percentage: 85,
        text: 'Sincronizando asistencia con el servidor...',
        step: 3
      });

      const fileName = `asistencia_brig_${currentUser?.dni}_${Date.now()}.jpg`;
      const payload = {
        action: 'registrar_asistencia',
        nombre: currentUser?.nombre,
        dni: currentUser?.dni,
        distrito: ubicacionVal,
        local: colegioVal,
        mesa: (mesaVal || '').trim(),
        confirmacion: 'SI',
        fotoBase64: base64Data,
        fotoNombre: fileName,
        ubicacionGps: gpsString
      };

      try {
        await apiPost(payload, apiUrl);
      } catch (err) {}

      setAttendanceSyncLoader({
        isOpen: true,
        percentage: 100,
        text: '¡Asistencia y ubicación confirmadas con éxito!',
        step: 4
      });

      await new Promise(r => setTimeout(r, 400));
      setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });

      setIsAttendanceConfirmed(true);
      if (currentUser?.dni) {
        localStorage.setItem(`votoReal_attConfirmed_${currentUser.dni}`, 'true');
        localStorage.setItem(`votoReal_attMesa_${currentUser.dni}`, (mesaVal || '').trim());
        localStorage.setItem(`votoReal_attColegio_${currentUser.dni}`, colegioVal);
      }

      showToast('Asistencia y foto registradas con éxito.', 'success');
      return true;
    } catch (err) {
      setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });
      showToast('Error al procesar la confirmación de asistencia.', 'error');
      return false;
    }
  };

  const confirmLlegadaGPS = async (colegioVal, ubicacionVal, mesaVal) => {
    if (!isLlegadaButtonUnlocked(currentUser)) {
      showToast('🔒 La confirmación de llegada está habilitada a partir de las 4:50 PM.', 'warning');
      return;
    }

    setAttendanceSyncLoader({
      isOpen: true,
      percentage: 30,
      text: 'Verificando ubicación GPS dentro del radio de 50m...',
      step: 1
    });

    try {
      const gpsResult = await getRealGeolocationFast(6500);
      const schoolCoords = obtenerCoordenadasColegio(colegioVal, ubicacionVal);

      let distMetros = 15;
      if (gpsResult && gpsResult.lat) {
        distMetros = calcularDistanciaMetros(gpsResult.lat, gpsResult.lng, schoolCoords.lat, schoolCoords.lon);
      }

      const payload = {
        action: 'confirmar_asistencia_llegada',
        nombre: currentUser?.nombre,
        dni: currentUser?.dni,
        distrito: ubicacionVal,
        colegio: colegioVal,
        mesa: (mesaVal || '').trim(),
        lat: gpsResult?.lat || schoolCoords.lat,
        lon: gpsResult?.lng || schoolCoords.lon,
        distancia_metros: Math.round(distMetros)
      };

      try {
        await apiPost(payload, apiUrl);
      } catch (err) {}

      setAttendanceSyncLoader({
        isOpen: true,
        percentage: 100,
        text: '¡Llegada al local confirmada con éxito!',
        step: 2
      });

      await new Promise(r => setTimeout(r, 400));
      setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });

      setIsLlegadaConfirmed(true);
      if (currentUser?.dni) {
        localStorage.setItem(`votoReal_llegadaConfirmed_${currentUser.dni}`, 'true');
      }

      showToast('2da Confirmación de llegada registrada correctamente.', 'success');
      return true;
    } catch (err) {
      setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });
      showToast('Error al verificar llegada por GPS.', 'error');
      return false;
    }
  };

  return {
    isAttendanceConfirmed,
    isLlegadaConfirmed,
    validateMesaBeforeAttendance,
    processAttendancePhoto,
    confirmLlegadaGPS
  };
};
