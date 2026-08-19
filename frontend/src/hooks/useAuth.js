import { useApp } from '../context/AppContext';
import { apiPost } from '../services/api/apiClient';
import { buscarBrigadista, esCoordinador } from '../constants/usuarios';

export const useAuth = () => {
  const {
    currentUser, setCurrentUser,
    setCurrentView, showToast, showAlertDialog,
    cachedUsers, apiUrl, logout
  } = useApp();

  const login = async (nombre, dni) => {
    const cleanNombre = (nombre || '').trim();
    const cleanDni = (dni || '').trim();

    if (!cleanNombre && !cleanDni) {
      showAlertDialog({
        title: 'Acceso Denegado',
        message: 'Por favor ingresa tu DNI o tu nombre para iniciar sesión.',
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

    const userObj = {
      nombre: user.nombre || user.Nombres_y_Apellidos || cleanNombre || 'Personero',
      dni: user.dni || user.DNI || cleanDni,
      ubicacion: user.ubicacion || user.Distrito_Asignado || user.Distrito_donde_Vota || 'Lima',
      colegio: user.colegio || user.Local_de_Votacion_Asignado || user.Local_de_Votacion || '',
      mesa: user.mesa || user.Mesa_Asignada || user.Mesa_de_Sufragio || '',
      rol: user.rol || 'Personero',
      origenHoja: user.origenHoja || '',
      tabla_origen: user.tabla_origen || user.origenHoja || '',
      tipo_interfaz: user.tipo_interfaz || ''
    };

    setCurrentUser(userObj);
    sessionStorage.setItem('votoReal_user', JSON.stringify(userObj));

    if (esCoordinador(userObj)) {
      setCurrentView('view-coordinator');
      showToast(`Bienvenido Coordinador, ${userObj.nombre}.`, 'success');
    } else {
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
