import { useApp, DEFAULT_VOTES } from '../context/AppContext';
import { apiPost } from '../services/api/apiClient';
import { buscarBrigadista, esCoordinador } from '../constants/usuarios';

export const useAuth = () => {
  const {
    currentUser, setCurrentUser,
    setCurrentView, showToast, showAlertDialog,
    cachedUsers, apiUrl, logout,
    setCurrentVotes, setOcrVotes
  } = useApp();

  const login = async (nombre, dni) => {
    const cleanNombre = (nombre || '').trim();
    const cleanDni = (dni || '').trim();

    if (!cleanDni) {
      showAlertDialog({
        title: 'Acceso Denegado',
        message: 'Por favor ingresa tu DNI o tu Clave de Acceso para validar tu identidad en el sistema.',
        buttonText: 'Reintentar',
        type: 'error'
      });
      return false;
    }

    // Super Admin direct bypass
    const allInputs = `${cleanNombre} ${cleanDni}`.toLowerCase();
    if (
      allInputs.includes('admin#2026$secure!votoreal') ||
      cleanDni === '99999999' ||
      cleanDni === '12345678'
    ) {
      const adminUser = {
        nombre: 'Super Administrador',
        dni: '99999999',
        ubicacion: 'Lima',
        colegio: 'CENTRAL',
        mesa: '',
        rol: 'Admin',
        origenHoja: ''
      };
      setCurrentUser(adminUser);
      sessionStorage.setItem('votoReal_user', JSON.stringify(adminUser));
      setCurrentView('view-counting');
      showToast('Bienvenido, Super Administrador.', 'success');
      return true;
    }

    let user = null;
    let serverResponded = false;

    try {
      const res = await apiPost({ action: 'login', dni: cleanDni, nombre: cleanNombre }, apiUrl);
      serverResponded = true;

      if (res && res.success && (res.usuario || res.user)) {
        user = res.usuario || res.user;
      } else {
        // El servidor respondió explícitamente rechazando el login (ej: Credenciales Bloqueadas)
        const errMsg = res?.message || 'Acceso Denegado: Tus credenciales no se encuentran confirmadas o están bloqueadas.';
        showAlertDialog({
          title: 'Acceso Denegado',
          message: errMsg,
          buttonText: 'Entendido',
          type: 'error'
        });
        return false;
      }
    } catch (err) {
      console.warn('[useAuth] Error de conexión con el servidor:', err);
    }

    // Solo como fallback si el servidor está totalmente inalcanzable (modo sin internet)
    if (!serverResponded && !user) {
      user = buscarBrigadista(cleanDni, cleanNombre, cachedUsers);
    }

    if (!user) {
      showAlertDialog({
        title: 'Acceso Denegado',
        message: 'DNI o nombre no encontrado en el sistema.<br><br>Si acabas de ser agregado, espera un momento y vuelve a intentarlo.',
        buttonText: 'Reintentar',
        type: 'error'
      });
      return false;
    }

    const targetDni = user.dni || user.DNI || cleanDni;

    const userObj = {
      ...user,
      nombre: user.nombre || user.Nombres_y_Apellidos || cleanNombre || 'Personero',
      dni: targetDni,
      ubicacion: user.ubicacion || user.Distrito_Asignado || user.Distrito_donde_Vota || 'Lima',
      colegio: user.colegio || user.Local_de_Votacion_Asignado || user.Local_de_Votacion || '',
      mesa: user.mesa || user.Mesa_Asignada || user.Mesa_de_Sufragio || '',
      rol: user.rol || 'Personero',
      origenHoja: user.origenHoja || '',
      tabla_origen: user.tabla_origen || user.origenHoja || '',
      tipo_interfaz: user.tipo_interfaz || '',
      voto_manual_enviado: Boolean(user.voto_manual_enviado),
      voto_imagen_enviado: Boolean(user.voto_imagen_enviado),
      asistencia_confirmada: Boolean(user.asistencia_confirmada),
      llegada_confirmada: Boolean(user.llegada_confirmada)
    };

    // Restricción de Coordinador Zonal (Solo existe y aplica para Villa María del Triunfo)
    const ubNorm = (userObj.ubicacion || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const isVMT = ubNorm.includes('villa maria del triunfo') || ubNorm.includes('vmt');
    const isSuperAdmin = userObj.rol === 'Admin' || userObj.dni === '99999999' || userObj.dni === '12345678';

    const isZonal = (userObj.rol || '').toLowerCase().includes('zonal') || 
                    (userObj.tabla_origen || '').toLowerCase().includes('rcoordinadoresz') ||
                    (userObj.tipo_interfaz || '').toLowerCase() === 'coordinador_zonal';

    if (isZonal && !isVMT && !isSuperAdmin) {
      // En otros distritos no existen zonas, pasa a Coordinador Local
      userObj.rol = 'Coordinador Local';
      userObj.tipo_interfaz = 'coordinador_local';
    }

    const isCoordOrAdmin = isSuperAdmin || (
      (userObj.rol || '').toLowerCase().includes('distrital') ||
      (userObj.rol || '').toLowerCase().includes('zonal') ||
      (userObj.rol || '').toLowerCase().includes('local') ||
      (userObj.rol || '').toLowerCase().includes('coordinador') ||
      (userObj.tipo_interfaz || '').includes('coordinador_')
    );

    // Sincronizar bloqueos locales si es personero normal
    if (!isCoordOrAdmin) {
      if (userObj.voto_manual_enviado) {
        localStorage.setItem(`votoReal_manualLocked_${targetDni}`, 'true');
      }
      if (userObj.voto_imagen_enviado) {
        localStorage.setItem(`votoReal_ocrLocked_${targetDni}`, 'true');
      }
      if (userObj.asistencia_confirmada) {
        localStorage.setItem(`votoReal_attConfirmed_${targetDni}`, 'true');
      }
    }

    // Cargar votos guardados para este DNI si existen, o inicializar limpio en 0s
    try {
      const savedManual = localStorage.getItem(`votoReal_manualVotes_${targetDni}`);
      setCurrentVotes(savedManual ? JSON.parse(savedManual) : JSON.parse(JSON.stringify(DEFAULT_VOTES)));

      const savedOcr = localStorage.getItem(`votoReal_ocrVotes_${targetDni}`);
      setOcrVotes(savedOcr ? JSON.parse(savedOcr) : JSON.parse(JSON.stringify(DEFAULT_VOTES)));
    } catch (e) {
      setCurrentVotes(JSON.parse(JSON.stringify(DEFAULT_VOTES)));
      setOcrVotes(JSON.parse(JSON.stringify(DEFAULT_VOTES)));
    }

    setCurrentUser(userObj);
    sessionStorage.setItem('votoReal_user', JSON.stringify(userObj));

    if (esCoordinador(userObj)) {
      setCurrentView('view-coordinator');
      showToast(`Bienvenido, ${userObj.nombre}.`, 'success');
    } else {
      // Personeros de mesa: van a la vista de conteo manual y por imagen
      setCurrentView('view-counting');
      showToast(`Bienvenido, ${userObj.nombre}.`, 'success');
    }
    return true;
  };

  return {
    currentUser,
    login,
    logout
  };
};
