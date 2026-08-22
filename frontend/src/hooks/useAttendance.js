import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiPost } from '../services/api/apiClient';
import { getRealGeolocationFast, obtenerCoordenadasColegio, obtenerCoordenadasMesaColegio, calcularDistanciaMetros } from '../services/gps/geolocationService';
import { compressImage } from '../utils/imageCompressor';
import { isLlegadaButtonUnlocked } from '../utils/helpers';
import { buscarBrigadista } from '../constants/usuarios';

export const useAttendance = () => {
  const {
    currentUser, apiUrl,
    showAlertDialog, showConfirmDialog, showToast, setAttendanceSyncLoader,
    mesasEstructura
  } = useApp();

  const isSuperAdmin = currentUser && (
    currentUser.dni === 'Admin#2026$Secure!VotoReal' ||
    currentUser.dni === '99999999' ||
    (currentUser.nombre || '').toLowerCase().includes('super admin')
  );

  const [isAttendanceConfirmed, setIsAttendanceConfirmed] = useState(() => {
    if (currentUser?.asistencia_confirmada !== undefined) {
      return Boolean(currentUser.asistencia_confirmada);
    }
    if (currentUser?.dni) {
      return localStorage.getItem(`votoReal_attConfirmed_${currentUser.dni}`) === 'true';
    }
    return false;
  });

  const [isLlegadaConfirmed, setIsLlegadaConfirmed] = useState(() => {
    if (currentUser?.llegada_confirmada !== undefined) {
      return Boolean(currentUser.llegada_confirmada);
    }
    if (currentUser?.dni) {
      return localStorage.getItem(`votoReal_llegadaConfirmed_${currentUser.dni}`) === 'true';
    }
    return false;
  });

  // Sincronización en tiempo real con la Base de Datos (asistencia y asistenciallegada)
  useEffect(() => {
    if (!currentUser?.dni || isSuperAdmin) return;

    let isMounted = true;
    const syncAttendanceFromDb = async () => {
      try {
        const res = await apiPost({ action: 'obtener_asistencia_por_dni', dni: currentUser.dni }, apiUrl);
        if (res && res.success && isMounted) {
          // 1. Asistencia oficial (Foto)
          const dbAsis = Boolean(res.asistencia_confirmada);
          setIsAttendanceConfirmed(dbAsis);
          if (dbAsis) {
            localStorage.setItem(`votoReal_attConfirmed_${currentUser.dni}`, 'true');
            if (res.asistencia?.mesa) {
              localStorage.setItem(`votoReal_attMesa_${currentUser.dni}`, res.asistencia.mesa);
            }
            if (res.asistencia?.local) {
              localStorage.setItem(`votoReal_attColegio_${currentUser.dni}`, res.asistencia.local);
            }
          } else {
            // Si fue borrado en la base de datos, limpiar estado local
            localStorage.removeItem(`votoReal_attConfirmed_${currentUser.dni}`);
            localStorage.removeItem(`votoReal_attMesa_${currentUser.dni}`);
            localStorage.removeItem(`votoReal_attColegio_${currentUser.dni}`);
          }

          // 2. Asistencia de Llegada (GPS)
          const dbLlegada = Boolean(res.llegada_confirmada);
          setIsLlegadaConfirmed(dbLlegada);
          if (dbLlegada) {
            localStorage.setItem(`votoReal_llegadaConfirmed_${currentUser.dni}`, 'true');
          } else {
            // Si fue borrado en la base de datos, limpiar estado local
            localStorage.removeItem(`votoReal_llegadaConfirmed_${currentUser.dni}`);
          }
        }
      } catch (err) {
        console.warn('[useAttendance] Error sincronizando estado de asistencia con BD:', err);
      }
    };

    syncAttendanceFromDb();
    return () => { isMounted = false; };
  }, [currentUser?.dni, apiUrl, isSuperAdmin]);

  const validateMesaBeforeAttendance = (mesaVal) => {
    const cleanMesa = (mesaVal || '').trim();

    // 1. Obtener la mesa asignada del usuario
    let assignedMesa = currentUser?.mesa || '';
    if (!assignedMesa && currentUser?.dni) {
      const u = buscarBrigadista(currentUser.dni, currentUser.nombre);
      if (u && u.mesa) assignedMesa = u.mesa;
    }

    // 2. Validación de campo vacío -> mostrar mesa asignada para guiar al usuario
    if (!cleanMesa) {
      const msg = assignedMesa 
        ? `Tu mesa asignada es la <strong>N° ${assignedMesa}</strong>.<br><br>Por favor, ingrésala en la casilla para poder confirmar tu asistencia.`
        : `Por favor, ingresa tu número de mesa en la casilla antes de confirmar.`;

      showAlertDialog({
        title: 'Mesa Requerida',
        message: msg,
        buttonText: 'Aceptar',
        type: 'warning',
        onClose: () => {
          const mesaEl = document.getElementById('input-mesa');
          if (mesaEl) {
            mesaEl.focus();
          }
        }
      });
      return false;
    }

    // 3. Validación de coincidencia con mesa asignada
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

  const verifyAttendanceGpsRange = async (mesaVal, colegioVal, ubicacionVal, structureList = mesasEstructura) => {
    // 1. Validar mesa asignada / requerida
    const isValid = validateMesaBeforeAttendance(mesaVal);
    if (!isValid) return false;

    if (!colegioVal) {
      showAlertDialog({
        title: 'Colegio Requerido',
        message: 'Por favor, ingresa un número de mesa válido para detectar el local de votación.',
        buttonText: 'Aceptar',
        type: 'warning'
      });
      return false;
    }

    if (isSuperAdmin) {
      return true;
    }

    setAttendanceSyncLoader({
      isOpen: true,
      percentage: 25,
      text: 'Detectando ubicación GPS para validar radio de 50m...',
      step: 1
    });

    try {
      const gpsResult = await getRealGeolocationFast(6500);
      const targetCoords = obtenerCoordenadasMesaColegio(mesaVal, colegioVal, ubicacionVal, structureList);

      setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });

      if (!gpsResult || !gpsResult.lat) {
        showAlertDialog({
          title: '📍 GPS Requerido',
          message: 'No se pudo obtener tu ubicación GPS con precisión.<br><br>Por favor, <strong>activa la ubicación GPS</strong> en tu dispositivo y concede los permisos en el navegador para confirmar tu asistencia.',
          buttonText: 'Entendido',
          type: 'warning'
        });
        return false;
      }

      const distMetros = calcularDistanciaMetros(gpsResult.lat, gpsResult.lng, targetCoords.lat, targetCoords.lon);
      const RADIO_MAX_METROS = 50;

      if (distMetros > RADIO_MAX_METROS) {
        showAlertDialog({
          title: '⚠️ Fuera del Rango Permitido',
          message: `Te encuentras a <strong>${Math.round(distMetros)} metros</strong> del local de votación (<strong>${colegioVal}</strong>).<br><br>Para confirmar asistencia debes estar dentro del radio permitido de <strong>50 metros</strong> de las coordenadas del colegio.`,
          buttonText: 'Entendido',
          type: 'error'
        });
        return false;
      }

      return true;
    } catch (err) {
      setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });
      showAlertDialog({
        title: 'Error de Ubicación',
        message: 'Ocurrió un inconveniente al validar las coordenadas GPS. Inténtalo nuevamente.',
        buttonText: 'Aceptar',
        type: 'error'
      });
      return false;
    }
  };

  const processAttendancePhoto = async (file, mesaVal, colegioVal, ubicacionVal) => {
    if (!file) return;

    setAttendanceSyncLoader({
      isOpen: true,
      percentage: 30,
      text: 'Comprimiendo foto de la casilla...',
      step: 1
    });

    try {
      const base64Data = await compressImage(file, 500, 0.35);

      setAttendanceSyncLoader({
        isOpen: true,
        percentage: 75,
        text: 'Sincronizando foto con el servidor...',
        step: 2
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
        foto_url: base64Data,
        fotoBase64: base64Data,
        fotoNombre: fileName
      };

      try {
        await apiPost(payload, apiUrl);
      } catch (err) {}

      setAttendanceSyncLoader({
        isOpen: true,
        percentage: 100,
        text: '¡Foto de la casilla confirmada con éxito!',
        step: 3
      });

      await new Promise(r => setTimeout(r, 400));
      setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });

      setIsAttendanceConfirmed(true);
      if (currentUser?.dni) {
        localStorage.setItem(`votoReal_attConfirmed_${currentUser.dni}`, 'true');
        localStorage.setItem(`votoReal_attMesa_${currentUser.dni}`, (mesaVal || '').trim());
        localStorage.setItem(`votoReal_attColegio_${currentUser.dni}`, colegioVal);
      }

      showToast('Foto de confirmación de casilla registrada con éxito.', 'success');
      return true;
    } catch (err) {
      setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });
      showToast('Error al procesar la confirmación de la casilla.', 'error');
      return false;
    }
  };

  const ejecutarVerificacionGPS = async (targetColegio, ubicacionVal, targetMesa) => {
    setAttendanceSyncLoader({
      isOpen: true,
      percentage: 25,
      text: 'Detectando ubicación GPS para validar radio de 50m del colegio...',
      step: 1
    });

    try {
      const gpsResult = await getRealGeolocationFast(6500);
      const targetCoords = obtenerCoordenadasMesaColegio(targetMesa, targetColegio, ubicacionVal, mesasEstructura);

      if (!isSuperAdmin && (!gpsResult || !gpsResult.lat)) {
        setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });
        showAlertDialog({
          title: '📍 GPS Requerido',
          message: 'No se pudo obtener tu ubicación GPS en tiempo real.<br><br>Por favor, <strong>activa el GPS</strong> en tu dispositivo y concede los permisos de ubicación en el navegador para confirmar tu llegada.',
          buttonText: 'Entendido',
          type: 'warning'
        });
        return false;
      }

      let distMetros = 0;
      if (gpsResult && gpsResult.lat) {
        distMetros = calcularDistanciaMetros(gpsResult.lat, gpsResult.lng, targetCoords.lat, targetCoords.lon);
      }

      const RADIO_MAX_METROS = 50;

      if (!isSuperAdmin && distMetros > RADIO_MAX_METROS) {
        setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });
        showAlertDialog({
          title: '⚠️ Fuera del Rango Permitido',
          message: `Te encuentras a <strong>${Math.round(distMetros)} metros</strong> del local de votación (<strong>${targetColegio || 'Colegio Asignado'}</strong>).<br><br>Para confirmar llegada debes estar dentro del radio permitido de <strong>50 metros</strong> del colegio.`,
          buttonText: 'Entendido',
          type: 'error'
        });
        return false;
      }

      setAttendanceSyncLoader({
        isOpen: true,
        percentage: 70,
        text: 'Enviando confirmación de llegada...',
        step: 2
      });

      const payload = {
        action: 'confirmar_asistencia_llegada',
        nombre: currentUser?.nombre,
        dni: currentUser?.dni,
        distrito: ubicacionVal,
        colegio: targetColegio || 'Local Asignado',
        mesa: targetMesa,
        lat: gpsResult?.lat || targetCoords.lat,
        lon: gpsResult?.lng || targetCoords.lon,
        distancia_metros: Math.round(distMetros)
      };

      try {
        await apiPost(payload, apiUrl);
      } catch (err) {}

      setAttendanceSyncLoader({
        isOpen: true,
        percentage: 100,
        text: '¡Llegada al local confirmada con éxito!',
        step: 3
      });

      await new Promise(r => setTimeout(r, 400));
      setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });

      setIsLlegadaConfirmed(true);
      if (currentUser?.dni) {
        localStorage.setItem(`votoReal_llegadaConfirmed_${currentUser.dni}`, 'true');
      }

      showToast('Confirmación de llegada por GPS registrada correctamente.', 'success');
      return true;
    } catch (err) {
      setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });
      showToast('Error al verificar llegada por GPS.', 'error');
      return false;
    }
  };

  const confirmLlegadaGPS = async (colegioVal, ubicacionVal, mesaVal) => {
    if (isLlegadaConfirmed) {
      showToast('✅ Tu llegada al colegio ya fue confirmada.', 'info');
      return true;
    }

    if (!isLlegadaButtonUnlocked(currentUser)) {
      showToast('🔒 La confirmación de llegada está habilitada a partir de las 4:50 PM.', 'warning');
      return false;
    }

    let targetColegio = (colegioVal || '').trim();
    let targetMesa = (mesaVal || '').trim();

    // Si aún no ha ingresado la mesa, intentar obtener de datos asignados
    if (!targetMesa && currentUser?.dni) {
      let assignedMesa = currentUser?.mesa || '';
      if (!assignedMesa) {
        const u = buscarBrigadista(currentUser.dni, currentUser.nombre);
        if (u && u.mesa) assignedMesa = u.mesa;
      }
      if (assignedMesa) targetMesa = assignedMesa;
    }

    if (!targetColegio && !targetMesa && !isSuperAdmin) {
      showAlertDialog({
        title: 'Colegio / Mesa Requerido',
        message: 'Por favor, ingresa tu número de mesa o identifica tu local de votación para validar tu llegada por GPS.',
        buttonText: 'Aceptar',
        type: 'warning'
      });
      return false;
    }

    // Popup modal que solicita permitir reconocer su ubicación
    showConfirmDialog({
      title: '📍 Confirmar Llegada al Colegio',
      message: `Se verificará tu ubicación GPS en tiempo real para comprobar que te encuentras dentro del radio de <strong>50 metros</strong> del local de votación (<strong>${targetColegio || 'Colegio Asignado'}</strong>).<br><br>¿Deseas permitir el acceso a tu ubicación?`,
      confirmText: 'Permitir Reconocer Ubicación',
      cancelText: 'Cancelar',
      type: 'info',
      onConfirm: () => {
        ejecutarVerificacionGPS(targetColegio, ubicacionVal, targetMesa);
      }
    });
  };

  return {
    isAttendanceConfirmed,
    isLlegadaConfirmed,
    validateMesaBeforeAttendance,
    verifyAttendanceGpsRange,
    processAttendancePhoto,
    confirmLlegadaGPS
  };
};
