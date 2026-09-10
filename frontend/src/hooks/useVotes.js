import { useState, useEffect } from 'react';
import { useApp, DEFAULT_VOTES } from '../context/AppContext';
import { apiPost } from '../services/api/apiClient';
import { offlineQueue } from '../services/sync/offlineQueue';
import { isCountingTimeEnabled, checkIsSuperAdmin } from '../utils/helpers';
import {
  obtenerCandidatosPorUbicacion,
  obtenerListaCandidatosProvincial,
  obtenerListaCandidatosDistrital,
  PARTIDO_ID_MAP
} from '../constants/distritos';

export const useVotes = () => {
  const {
    currentUser, setCurrentUser, currentVotes, setCurrentVotes,
    ocrVotes, setOcrVotes, isOnline,
    apiUrl, showToast, showAlertDialog,
    mesasEstructura, setMesas
  } = useApp();

  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const [isTransmitting, setIsTransmitting] = useState(false);

  // Bloqueo de Conteo Manual (solo 1 vez para usuarios normales)
  const [isManualLocked, setIsManualLocked] = useState(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem('votoReal_user') || '{}');
      if (checkIsSuperAdmin(u)) return false;
      if (u.voto_manual_enviado) return true;
      const mesaKey = u.mesa ? `votoReal_manualLocked_${u.dni}_${u.mesa}` : null;
      if (mesaKey && localStorage.getItem(mesaKey) === 'true') return true;
      return localStorage.getItem(`votoReal_manualLocked_${u.dni}`) === 'true';
    } catch (e) {
      return false;
    }
  });

  // Bloqueo de Conteo por Imagen / OCR (solo 1 vez para usuarios normales)
  const [isOcrLocked, setIsOcrLocked] = useState(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem('votoReal_user') || '{}');
      if (checkIsSuperAdmin(u)) return false;
      if (u.voto_imagen_enviado) return true;
      const mesaKey = u.mesa ? `votoReal_ocrLocked_${u.dni}_${u.mesa}` : null;
      if (mesaKey && localStorage.getItem(mesaKey) === 'true') return true;
      return localStorage.getItem(`votoReal_ocrLocked_${u.dni}`) === 'true';
    } catch (e) {
      return false;
    }
  });

  // Helper para convertir registro de votos de BD a formato frontend
  const parseDbVoteRow = (row) => {
    if (!row) return null;
    let prov = {};
    let dist = {};

    if (row.votos_json) {
      try {
        const parsed = typeof row.votos_json === 'string' ? JSON.parse(row.votos_json) : row.votos_json;
        if (parsed && typeof parsed === 'object') {
          if (parsed.provincial) prov = { ...parsed.provincial };
          if (parsed.distrital) dist = { ...parsed.distrital };
        }
      } catch (e) {}
    }

    // Si prov viene vacío o incompleto, extraer de columnas SQL
    const defaultProv = {
      "SOMOS PERU": Number(row.p_sp_votos) || 0,
      "RENOVACION": Number(row.p_rp_votos) || 0,
      "AHORA NACION": Number(row.p_an_votos) || 0,
      "AVANZA PAIS": Number(row.p_avanza_votos) || 0,
      "PODEMOS": Number(row.p_podemos_votos) || 0,
      "JP": Number(row.p_jp_votos) || 0,
      "OBRAS": Number(row.p_obras_votos) || 0,
      "FREPAP": Number(row.p_frepap_votos) || 0,
      "ACCION POPULAR": Number(row.p_ap_votos) || 0,
      "ESPERANZA": Number(row.p_esperanza_votos) || 0,
      "VENCEREMOS": Number(row.p_venceremos_votos) || 0,
      "VISION PERU": Number(row.p_vision_votos) || 0,
      "APRA": Number(row.p_apra_votos) || 0,
      "FP": Number(row.p_fp_votos) || 0,
      "PPC": Number(row.p_ppc_votos) || 0,
      "PROGRESEMOS": Number(row.p_progresemos_votos) || 0,
      "MORADO": Number(row.p_morado_votos) || 0,
      "BUEN GOBIERNO": Number(row.p_buen_gobierno_votos) || 0,
      "VERDE": Number(row.p_verde_votos) || 0,
      "PERU LIBRE": Number(row.p_peru_libre_votos) || 0,
      "TIERRA VERDE": Number(row.p_tierra_verde_votos) || 0,
      "PUEBLO CONSCIENTE": Number(row.p_pueblo_consciente_votos) || 0,
      "PPP": Number(row.p_ppp_votos) || 0,
      "INTEGRIDAD": Number(row.p_integridad_votos) || 0,
      "FUERZA CIUDADANA": Number(row.p_fuerza_ciudadana_votos) || 0,
      "BATALLA PERU": Number(row.p_batalla_votos) || 0,
      "APP": Number(row.p_app_votos) || 0,
      "ALIANZA REGIONAL": Number(row.p_alianza_regional_votos) || 0
    };

    const defaultDist = {
      "SOMOS PERU": Number(row.d_sp_votos) || 0,
      "RENOVACION": Number(row.d_rp_votos) || 0,
      "AHORA NACION": Number(row.d_an_votos) || 0,
      "AVANZA PAIS": Number(row.d_avanza_votos) || 0,
      "PODEMOS": Number(row.d_podemos_votos) || 0,
      "JP": Number(row.d_jp_votos) || 0,
      "OBRAS": Number(row.d_obras_votos) || 0,
      "FREPAP": Number(row.d_frepap_votos) || 0,
      "ACCION POPULAR": Number(row.d_ap_votos) || 0,
      "ESPERANZA": Number(row.d_esperanza_votos) || 0,
      "VENCEREMOS": Number(row.d_venceremos_votos) || 0,
      "VISION PERU": Number(row.d_vision_votos) || 0,
      "APRA": Number(row.d_apra_votos) || 0,
      "FP": Number(row.d_fp_votos) || 0,
      "PPC": Number(row.d_ppc_votos) || 0,
      "PROGRESEMOS": Number(row.d_progresemos_votos) || 0,
      "MORADO": Number(row.d_morado_votos) || 0,
      "BUEN GOBIERNO": Number(row.d_buen_gobierno_votos) || 0,
      "VERDE": Number(row.d_verde_votos) || 0,
      "PERU LIBRE": Number(row.d_peru_libre_votos) || 0,
      "TIERRA VERDE": Number(row.d_tierra_verde_votos) || 0,
      "PUEBLO CONSCIENTE": Number(row.d_pueblo_consciente_votos) || 0,
      "PPP": Number(row.d_ppp_votos) || 0,
      "INTEGRIDAD": Number(row.d_integridad_votos) || 0,
      "FUERZA CIUDADANA": Number(row.d_fuerza_ciudadana_votos) || 0,
      "BATALLA PERU": Number(row.d_batalla_votos) || 0,
      "APP": Number(row.d_app_votos) || 0,
      "ALIANZA REGIONAL": Number(row.d_alianza_regional_votos) || 0
    };

    // Combinar asegurando que no se pierdan candidatos
    prov = { ...defaultProv, ...prov };
    dist = { ...defaultDist, ...dist };

    // Inyectar de forma garantizada las métricas de nulos, blancos e impugnados
    const pNulos = Number(row.p_nulos ?? (typeof prov.NULOS === 'object' ? prov.NULOS?.votos : prov.NULOS) ?? 0);
    const pBlanco = Number(row.p_blanco ?? (typeof prov.BLANCO === 'object' ? prov.BLANCO?.votos : prov.BLANCO) ?? 0);
    const pImpugnados = Number(row.p_impugnados ?? (typeof prov.IMPUGNADOS === 'object' ? prov.IMPUGNADOS?.votos : prov.IMPUGNADOS) ?? 0);

    const dNulos = Number(row.d_nulos ?? (typeof dist.NULOS === 'object' ? dist.NULOS?.votos : dist.NULOS) ?? 0);
    const dBlanco = Number(row.d_blanco ?? (typeof dist.BLANCO === 'object' ? dist.BLANCO?.votos : dist.BLANCO) ?? 0);
    const dImpugnados = Number(row.d_impugnados ?? (typeof dist.IMPUGNADOS === 'object' ? dist.IMPUGNADOS?.votos : dist.IMPUGNADOS) ?? 0);

    prov.NULOS = pNulos;
    prov.BLANCO = pBlanco;
    prov.IMPUGNADOS = pImpugnados;

    dist.NULOS = dNulos;
    dist.BLANCO = dBlanco;
    dist.IMPUGNADOS = dImpugnados;

    return { provincial: prov, distrital: dist };
  };

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
            if (res.voto_manual) {
              const parsedManual = parseDbVoteRow(res.voto_manual);
              if (parsedManual) {
                setCurrentVotes(parsedManual);
                localStorage.setItem(`votoReal_manualVotes_${currentUser.dni}`, JSON.stringify(parsedManual));
              }
            }
          } else {
            localStorage.removeItem(`votoReal_manualLocked_${currentUser.dni}`);
            if (currentUser.mesa) localStorage.removeItem(`votoReal_manualLocked_${currentUser.dni}_${currentUser.mesa}`);
            localStorage.removeItem(`votoReal_manualVotes_${currentUser.dni}`);
            setCurrentVotes(JSON.parse(JSON.stringify(DEFAULT_VOTES)));
          }

          // 2. Voto Imagen / OCR
          const dbVotoImagen = Boolean(res.voto_imagen_enviado);
          setIsOcrLocked(dbVotoImagen);
          if (dbVotoImagen) {
            localStorage.setItem(`votoReal_ocrLocked_${currentUser.dni}`, 'true');
            if (res.voto_imagen) {
              const parsedOcr = parseDbVoteRow(res.voto_imagen);
              if (parsedOcr) {
                setOcrVotes(parsedOcr);
                localStorage.setItem(`votoReal_ocrVotes_${currentUser.dni}`, JSON.stringify(parsedOcr));
              }
            }
          } else {
            localStorage.removeItem(`votoReal_ocrLocked_${currentUser.dni}`);
            if (currentUser.mesa) localStorage.removeItem(`votoReal_ocrLocked_${currentUser.dni}_${currentUser.mesa}`);
            localStorage.removeItem(`votoReal_ocrVotes_${currentUser.dni}`);
            setOcrVotes(JSON.parse(JSON.stringify(DEFAULT_VOTES)));
          }

          // Sincronizar currentUser y sessionStorage si cambió el estado
          setCurrentUser(prev => {
            if (!prev) return prev;
            if (prev.voto_manual_enviado === dbVotoManual && prev.voto_imagen_enviado === dbVotoImagen) {
              return prev;
            }
            const updated = {
              ...prev,
              voto_manual_enviado: dbVotoManual,
              voto_imagen_enviado: dbVotoImagen
            };
            sessionStorage.setItem('votoReal_user', JSON.stringify(updated));
            return updated;
          });
        }
      } catch (e) {
        console.warn('[useVotes] Error sincronizando estado de votos desde BD:', e);
      }
    };

    syncVoteStatusFromDb();
    return () => { isMounted = false; };
  }, [currentUser?.dni, currentUser?.mesa, apiUrl, setCurrentUser, setCurrentVotes, setOcrVotes]);

  const handleVoteChange = (scope, key, val) => {
    // Si está bloqueado y NO es superadmin, no permitir edición
    if (isManualLocked && !isSuperAdmin) return;
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

  const transmitVotes = async (mesaVal, colegioInput, ubicacion, origen = 'MANUAL', customVotes = null) => {
    if (isTransmitting) return;

    // Validación de Bloqueo Único para personeros normales (Superadmin tiene permiso de modificación)
    if (!isSuperAdmin) {
      if (origen === 'MANUAL' && isManualLocked) {
        showToast('El registro manual ya fue transmitido y se encuentra bloqueado (solo 1 envío permitido).', 'warning');
        return;
      }

      if (origen === 'IMAGEN' && isOcrLocked) {
        showToast('El conteo por imagen ya fue transmitido y se encuentra bloqueado (solo 1 envío permitido).', 'warning');
        return;
      }
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

    const votesToSubmit = customVotes || ((origen === 'IMAGEN') ? ocrVotes : currentVotes);
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
    const pBlanco = parseInt(votesToSubmit.provincial?.BLANCO, 10) || 0;
    const pImpugnados = parseInt(votesToSubmit.provincial?.IMPUGNADOS, 10) || 0;

    const dNulos = parseInt(votesToSubmit.distrital?.NULOS, 10) || 0;
    const dBlanco = parseInt(votesToSubmit.distrital?.BLANCO, 10) || 0;
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
      votos_impugnados: pImpugnados,
      votos_dist_nulos: dNulos,
      votos_dist_blancos: dBlanco,
      votos_dist_impugnados: dImpugnados
    };

    try {
      if (!isOnline) {
        offlineQueue.enqueue(payload);
        showToast('Sin conexión. Votos guardados localmente para sincronización automática.', 'warning');
      } else {
        const res = await apiPost(payload, apiUrl);
        if (res && res.success) {
          const isModifying = isSuperAdmin && (origen === 'MANUAL' ? isManualLocked : isOcrLocked);
          if (isModifying) {
            showToast(`¡Modificación de votos (${origen === 'IMAGEN' ? 'Imagen' : 'Manual'}) guardada y actualizada en la BD exitosamente!`, 'success');
          } else {
            showToast(`¡Votos de ${origen === 'IMAGEN' ? 'Imagen' : 'Manual'} registrados y transmitidos con éxito!`, 'success');
          }
        } else {
          throw new Error(res?.message || 'Error en transmisión');
        }
      }

      // Bloquear según el origen enviado
      if (origen === 'MANUAL') {
        setIsManualLocked(true);
        const savedManualObj = {
          provincial: { ...(votesToSubmit.provincial || {}), NULOS: pNulos, BLANCO: pBlanco, IMPUGNADOS: pImpugnados },
          distrital: { ...(votesToSubmit.distrital || {}), NULOS: dNulos, BLANCO: dBlanco, IMPUGNADOS: dImpugnados }
        };
        setCurrentVotes(savedManualObj);
        if (currentUser?.dni) {
          localStorage.setItem(`votoReal_manualLocked_${currentUser.dni}`, 'true');
          localStorage.setItem(`votoReal_manualLocked_${currentUser.dni}_${mesa}`, 'true');
          localStorage.setItem(`votoReal_manualVotes_${currentUser.dni}`, JSON.stringify(savedManualObj));
        }
        setCurrentUser(prev => {
          if (!prev) return prev;
          const updated = { ...prev, voto_manual_enviado: true };
          sessionStorage.setItem('votoReal_user', JSON.stringify(updated));
          return updated;
        });
      } else if (origen === 'IMAGEN') {
        setIsOcrLocked(true);
        const savedOcrObj = {
          provincial: { ...(votesToSubmit.provincial || {}), NULOS: pNulos, BLANCO: pBlanco, IMPUGNADOS: pImpugnados },
          distrital: { ...(votesToSubmit.distrital || {}), NULOS: dNulos, BLANCO: dBlanco, IMPUGNADOS: dImpugnados }
        };
        setOcrVotes(savedOcrObj);
        if (currentUser?.dni) {
          localStorage.setItem(`votoReal_ocrLocked_${currentUser.dni}`, 'true');
          localStorage.setItem(`votoReal_ocrLocked_${currentUser.dni}_${mesa}`, 'true');
          localStorage.setItem(`votoReal_ocrVotes_${currentUser.dni}`, JSON.stringify(savedOcrObj));
        }
        setCurrentUser(prev => {
          if (!prev) return prev;
          const updated = { ...prev, voto_imagen_enviado: true };
          sessionStorage.setItem('votoReal_user', JSON.stringify(updated));
          return updated;
        });
      }

      setMesas(prev => [...new Set([...prev, mesa])]);
      localStorage.setItem('votoReal_mesas', JSON.stringify([...new Set([...mesasEstructura, mesa])]));
    } catch (err) {
      console.warn('[useVotes] Fallback local:', err);
      if (origen === 'MANUAL') {
        setIsManualLocked(true);
        const savedManualObj = {
          provincial: { ...(votesToSubmit.provincial || {}), NULOS: pNulos, BLANCO: pBlanco, IMPUGNADOS: pImpugnados },
          distrital: { ...(votesToSubmit.distrital || {}), NULOS: dNulos, BLANCO: dBlanco, IMPUGNADOS: dImpugnados }
        };
        setCurrentVotes(savedManualObj);
        if (currentUser?.dni) {
          localStorage.setItem(`votoReal_manualLocked_${currentUser.dni}`, 'true');
          localStorage.setItem(`votoReal_manualVotes_${currentUser.dni}`, JSON.stringify(savedManualObj));
        }
        setCurrentUser(prev => {
          if (!prev) return prev;
          const updated = { ...prev, voto_manual_enviado: true };
          sessionStorage.setItem('votoReal_user', JSON.stringify(updated));
          return updated;
        });
      } else if (origen === 'IMAGEN') {
        setIsOcrLocked(true);
        const savedOcrObj = {
          provincial: { ...(votesToSubmit.provincial || {}), NULOS: pNulos, BLANCO: pBlanco, IMPUGNADOS: pImpugnados },
          distrital: { ...(votesToSubmit.distrital || {}), NULOS: dNulos, BLANCO: dBlanco, IMPUGNADOS: dImpugnados }
        };
        setOcrVotes(savedOcrObj);
        if (currentUser?.dni) {
          localStorage.setItem(`votoReal_ocrLocked_${currentUser.dni}`, 'true');
          localStorage.setItem(`votoReal_ocrVotes_${currentUser.dni}`, JSON.stringify(savedOcrObj));
        }
        setCurrentUser(prev => {
          if (!prev) return prev;
          const updated = { ...prev, voto_imagen_enviado: true };
          sessionStorage.setItem('votoReal_user', JSON.stringify(updated));
          return updated;
        });
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
