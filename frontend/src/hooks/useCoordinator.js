import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiGet, apiPost } from '../services/api/apiClient';
import { compressImage } from '../utils/imageCompressor';

export const useCoordinator = () => {
  const { currentUser, apiUrl, showToast, setAttendanceSyncLoader } = useApp();
  const [personeros, setPersoneros] = useState([]);
  const [infoColegios, setInfoColegios] = useState([]);
  const [coordinadoresLocales, setCoordinadoresLocales] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [confirmacionesCoord, setConfirmacionesCoord] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCoordinatorData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const colQuery = currentUser.colegio || currentUser.local || '';
      const distQuery = currentUser.ubicacion || currentUser.distrito || '';
      const origenQuery = currentUser.origenHoja || currentUser.tabla_origen || '';

      const [resPersoneros, resAsist, resConf] = await Promise.all([
        apiGet({
          action: 'obtener_personeros_por_colegio',
          colegio: colQuery,
          local: colQuery,
          distrito: distQuery,
          ubicacion: distQuery,
          origenHoja: origenQuery,
          tabla_origen: origenQuery
        }, apiUrl),
        apiGet({ action: 'obtener_asistencia' }, apiUrl),
        apiGet({ action: 'obtener_confirmaciones_por_colegio', colegio: colQuery, local: colQuery }, apiUrl)
      ]);

      if (resPersoneros?.personeros) setPersoneros(resPersoneros.personeros);
      if (resPersoneros?.info_colegios) setInfoColegios(resPersoneros.info_colegios);
      if (resPersoneros?.coordinadores_locales) setCoordinadoresLocales(resPersoneros.coordinadores_locales);
      if (resAsist?.asistencia) setAsistencias(resAsist.asistencia);
      if (resConf?.confirmaciones) setConfirmacionesCoord(resConf.confirmaciones);
    } catch (e) {
      console.warn('[useCoordinator] Error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, apiUrl]);

  useEffect(() => {
    fetchCoordinatorData();
  }, [fetchCoordinatorData]);

  // Confirmación directa mediante Checkbox / Check
  const confirmPersoneroDirect = async (personero) => {
    if (!personero) return false;

    const pDni = (personero.dni || personero.DNI || '').toString().trim();
    const isAlreadyConfirmed = confirmacionesCoord.some(c => (c.personero_dni || '').toString().trim() === pDni);
    if (isAlreadyConfirmed) {
      showToast(`${personero.nombre} ya tiene la asistencia confirmada.`, 'info');
      return true;
    }

    try {
      const payload = {
        action: 'confirmar_coordinador',
        personeroNombre: personero.nombre,
        personeroDni: pDni,
        distrito: currentUser?.ubicacion || '',
        local: currentUser?.colegio || '',
        coordinadorNombre: currentUser?.nombre || '',
        coordinadorDni: currentUser?.dni || '',
        confirmacion: 'SI',
        fotoBase64: ''
      };

      // Actualización optimista en interfaz
      setConfirmacionesCoord(prev => [
        ...prev.filter(c => (c.personero_dni || '').toString().trim() !== payload.personeroDni),
        {
          personero_dni: payload.personeroDni,
          personero_nombre: payload.personeroNombre,
          confirmacion: 'SI',
          fecha_hora: new Date().toISOString()
        }
      ]);

      await apiPost(payload, apiUrl);
      showToast(`Asistencia confirmada para ${personero.nombre}.`, 'success');
      fetchCoordinatorData();
      return true;
    } catch (err) {
      showToast('Error guardando confirmación en el servidor.', 'error');
      fetchCoordinatorData();
      return false;
    }
  };

  // Confirmación opcional con Foto de verificación
  const verifyPersoneroWithPhoto = async (personero, file) => {
    if (!file || !personero) return false;

    setAttendanceSyncLoader({
      isOpen: true,
      percentage: 30,
      text: 'Comprimiendo foto de verificación...',
      step: 1
    });

    try {
      const base64 = await compressImage(file, 500, 0.35);

      setAttendanceSyncLoader({
        isOpen: true,
        percentage: 75,
        text: 'Guardando verificación de coordinador...',
        step: 2
      });

      const payload = {
        action: 'confirmar_coordinador',
        personeroNombre: personero.nombre,
        personeroDni: (personero.dni || personero.DNI || '').toString(),
        distrito: currentUser?.ubicacion || '',
        local: currentUser?.colegio || '',
        coordinadorNombre: currentUser?.nombre || '',
        coordinadorDni: currentUser?.dni || '',
        confirmacion: 'SI',
        fotoBase64: base64
      };

      await apiPost(payload, apiUrl);

      setAttendanceSyncLoader({
        isOpen: true,
        percentage: 100,
        text: '¡Verificación guardada exitosamente!',
        step: 3
      });

      await new Promise(r => setTimeout(r, 400));
      setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });

      showToast(`Personero ${personero.nombre} verificado con éxito.`, 'success');
      fetchCoordinatorData();
      return true;
    } catch (err) {
      setAttendanceSyncLoader({ isOpen: false, percentage: 0, text: '', step: 1 });
      showToast('Error guardando verificación del coordinador.', 'error');
      return false;
    }
  };

  return {
    personeros,
    infoColegios,
    coordinadoresLocales,
    asistencias,
    confirmacionesCoord,
    isLoading,
    fetchCoordinatorData,
    confirmPersoneroDirect,
    verifyPersoneroWithPhoto
  };
};
