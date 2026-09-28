import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_API_URL, fetchServerConfig, apiPost, apiGet, serverLogout } from '../services/api';
import { buscarBrigadista, esCoordinador } from '../constants/usuarios';
import { isCountingTimeEnabled, isLlegadaButtonUnlocked } from '../utils/helpers';
import InactivityWarningModal from '../components/modals/InactivityWarningModal';

const AppContext = createContext(null);

export const INITIAL_KEYS = [
  "SOMOS PERU", "RENOVACION", "AHORA NACION", "AVANZA PAIS", "PODEMOS", "JP",
  "OBRAS", "FREPAP", "ACCION POPULAR", "ESPERANZA", "VENCEREMOS", "VISION PERU",
  "APRA", "FP", "PPC", "PROGRESEMOS", "MORADO", "BUEN GOBIERNO", "VERDE",
  "PERU LIBRE", "TIERRA VERDE", "PUEBLO CONSCIENTE", "PPP", "INTEGRIDAD",
  "FUERZA CIUDADANA", "BATALLA PERU", "APP", "ALIANZA REGIONAL",
  "BLANCO", "NULOS", "IMPUGNADOS"
];

export const createInitialVotesObj = () => {
  const obj = {};
  INITIAL_KEYS.forEach(k => { obj[k] = 0; });
  return obj;
};

export const DEFAULT_VOTES = {
  provincial: createInitialVotesObj(),
  distrital: createInitialVotesObj()
};

export const AppProvider = ({ children }) => {
  // Config state
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [ocrProvider, setOcrProvider] = useState(() => localStorage.getItem('votoReal_ocrProvider') || 'gemini');

  // User & View state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('votoReal_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState(() => {
    try {
      const saved = sessionStorage.getItem('votoReal_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (esCoordinador(u)) return 'view-coordinator';
        return 'view-counting';
      }
    } catch (e) {}
    return 'view-login';
  });

  const [activeViewFilter, setActiveViewFilter] = useState(() => {
    const saved = localStorage.getItem('votoReal_activeViewFilter');
    return (saved === 'ocr') ? 'ocr' : 'manual';
  });

  // Electoral Data state
  const [currentVotes, setCurrentVotes] = useState(() => {
    try {
      const userStr = sessionStorage.getItem('votoReal_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const saved = localStorage.getItem(`votoReal_manualVotes_${u?.dni}`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_VOTES));
  });

  const [ocrVotes, setOcrVotes] = useState(() => {
    try {
      const userStr = sessionStorage.getItem('votoReal_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        const saved = localStorage.getItem(`votoReal_ocrVotes_${u?.dni}`);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_VOTES));
  });
  const [offlineVotes, setOfflineVotes] = useState(() => {
    try {
      const saved = localStorage.getItem('votoReal_offlineVotes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [mesas, setMesas] = useState(() => {
    try {
      const saved = localStorage.getItem('votoReal_mesas');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [mesasEstructura, setMesasEstructura] = useState(() => {
    try {
      const saved = localStorage.getItem('vr_mesas_estructura');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [cachedUsers, setCachedUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('votoReal_usuariosDb');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Modals & Popups State
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isOcrDetailModalOpen, setIsOcrDetailModalOpen] = useState(false);
  const [ocrRawDetail, setOcrRawDetail] = useState('');

  // Generic Alert Dialog (Matches img/1.png and img/5.png)
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    buttonText: 'Aceptar',
    type: 'warning', // 'warning', 'error', 'info', 'success'
    onClose: null
  });

  // Welcome Popup (Matches img/4.png)
  const [welcomePopup, setWelcomePopup] = useState(false);

  // Attendance Sync Loader (with animated percentage and steps)
  const [attendanceSyncLoader, setAttendanceSyncLoader] = useState({
    isOpen: false,
    percentage: 0,
    text: '',
    step: 1
  });

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Loading Overlay
  const [globalLoading, setGlobalLoading] = useState({ show: false, text: 'Cargando...' });

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const showAlertDialog = useCallback(({ title, message, buttonText = 'Aceptar', type = 'warning', onClose = null }) => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      buttonText,
      type,
      isConfirm: false,
      onClose
    });
  }, []);

  const showConfirmDialog = useCallback(({
    title,
    message,
    confirmText = 'Permitir Ubicación',
    cancelText = 'Cancelar',
    type = 'info',
    onConfirm = null,
    onCancel = null
  }) => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      buttonText: confirmText,
      confirmText,
      cancelText,
      type,
      isConfirm: true,
      onConfirm,
      onClose: onCancel
    });
  }, []);

  const closeAlertDialog = useCallback(() => {
    if (alertDialog.onClose && typeof alertDialog.onClose === 'function') {
      alertDialog.onClose();
    }
    setAlertDialog(prev => ({ ...prev, isOpen: false, isConfirm: false, onConfirm: null }));
  }, [alertDialog]);

  // Load server config on startup
  useEffect(() => {
    (async () => {
      const cfg = await fetchServerConfig();
      if (cfg && cfg.ocrProvider) {
        setOcrProvider(cfg.ocrProvider);
      }
    })();
  }, []);

  // Sync users database in background
  const fetchUsersDb = useCallback(async () => {
    try {
      const res = await apiGet({ action: 'obtener_usuarios' }, apiUrl);
      if (res && res.success && res.usuarios) {
        setCachedUsers(res.usuarios);
        localStorage.setItem('votoReal_usuariosDb', JSON.stringify(res.usuarios));
      }
    } catch (e) {
      console.warn('[AppContext] Error pre-cargando usuarios:', e.message);
    }
  }, [apiUrl]);

  // Sync mesas database directly from SQL Server
  const fetchMesasDb = useCallback(async () => {
    try {
      const res = await apiGet({ action: 'obtener_mesas' }, apiUrl);
      if (res && res.success && Array.isArray(res.mesas)) {
        setMesasEstructura(res.mesas);
        localStorage.setItem('vr_mesas_estructura', JSON.stringify(res.mesas));
      }
    } catch (e) {
      console.warn('[AppContext] Error pre-cargando mesas desde SQL Server:', e.message);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchUsersDb();
    fetchMesasDb();
  }, [fetchUsersDb, fetchMesasDb]);

  // Network listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Conexión reestablecida. Sincronizando datos...', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Sin conexión. Los votos se guardarán localmente.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  // Auto-sync offline votes every 15s
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!navigator.onLine) return;
      const queue = JSON.parse(localStorage.getItem('votoReal_offlineVotes') || '[]');
      if (queue.length === 0) return;

      console.log(`[Sync] Sincronizando ${queue.length} votos offline pendientes...`);
      const remaining = [];

      for (const item of queue) {
        try {
          const res = await apiPost(item, apiUrl);
          if (!res || !res.success) {
            remaining.push(item);
          }
        } catch (e) {
          remaining.push(item);
        }
      }

      setOfflineVotes(remaining);
      localStorage.setItem('votoReal_offlineVotes', JSON.stringify(remaining));

      if (remaining.length === 0) {
        showToast('Todos los votos locales se sincronizaron con el servidor.', 'success');
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [apiUrl, showToast]);

  const changeView = (viewId) => {
    setCurrentView(viewId);
    if (viewId === 'view-counting') {
      const alreadyShown = sessionStorage.getItem('votoReal_popupEntradaMostrar');
      if (!alreadyShown) {
        setTimeout(() => {
          setWelcomePopup(true);
          sessionStorage.setItem('votoReal_popupEntradaMostrar', '1');
        }, 500);
      }
    }
  };

  // Estado de aviso de inactividad
  const [inactivityModal, setInactivityModal] = useState({
    isOpen: false,
    countdown: 20
  });

  const logout = useCallback(() => {
    // 1. Notificar e invalidar token en el servidor
    serverLogout(apiUrl);

    // 2. Limpiar sesión en el cliente
    setCurrentUser(null);
    sessionStorage.removeItem('votoReal_user');
    sessionStorage.removeItem('votoReal_token');
    sessionStorage.removeItem('votoReal_popupEntradaMostrar');
    localStorage.removeItem('votoReal_mesa_activa');
    localStorage.removeItem('votoReal_colegio_activo');
    setCurrentVotes(JSON.parse(JSON.stringify(DEFAULT_VOTES)));
    setOcrVotes(JSON.parse(JSON.stringify(DEFAULT_VOTES)));
    setOcrRawDetail('');
    setIsScannerModalOpen(false);
    setIsOcrDetailModalOpen(false);
    setInactivityModal({ isOpen: false, countdown: 20 });
    setCurrentView('view-login');
    showToast('Sesión cerrada correctamente.', 'info');
  }, [apiUrl, showToast]);

  // Protección de sesión por inactividad física (90s) y segundo plano (25s) con Modal Popup
  useEffect(() => {
    if (!currentUser) {
      setInactivityModal({ isOpen: false, countdown: 20 });
      return;
    }

    let warningTimer = null;
    let countdownInterval = null;
    let backgroundTimer = null;

    const TOTAL_TIMEOUT_MS = 90 * 1000; // 90 segundos total
    const WARNING_TIME_MS = 70 * 1000;  // Aviso a los 70 segundos (20s restantes)

    const clearAllTimers = () => {
      if (warningTimer) clearTimeout(warningTimer);
      if (countdownInterval) clearInterval(countdownInterval);
      if (backgroundTimer) clearTimeout(backgroundTimer);
    };

    const startCountdown = (startSec = 20) => {
      let currentSec = startSec;
      setInactivityModal({ isOpen: true, countdown: currentSec });

      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(() => {
        currentSec -= 1;
        if (currentSec <= 0) {
          clearInterval(countdownInterval);
          setInactivityModal({ isOpen: false, countdown: 0 });
          logout();
          showToast('Sesión cerrada por inactividad.', 'warning');
        } else {
          setInactivityModal(prev => ({ ...prev, countdown: currentSec }));
        }
      }, 1000);
    };

    const resetInactivity = () => {
      clearAllTimers();
      setInactivityModal({ isOpen: false, countdown: 20 });

      warningTimer = setTimeout(() => {
        startCountdown(20);
      }, WARNING_TIME_MS);
    };

    // Escuchar interacciones físicas del usuario
    const userEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    userEvents.forEach(evt => window.addEventListener(evt, resetInactivity, { passive: true }));
    resetInactivity();

    // Detección de cambio de pestaña o segundo plano en móviles (25s)
    const handleVisibility = () => {
      if (document.hidden) {
        backgroundTimer = setTimeout(() => {
          logout();
          showToast('Sesión cerrada por seguridad al salir de la aplicación.', 'info');
        }, 25 * 1000);
      } else {
        if (backgroundTimer) clearTimeout(backgroundTimer);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearAllTimers();
      userEvents.forEach(evt => window.removeEventListener(evt, resetInactivity));
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentUser, logout, showToast]);

  const handleStayLoggedIn = () => {
    setInactivityModal({ isOpen: false, countdown: 20 });
  };

  return (
    <AppContext.Provider value={{
      apiUrl, setApiUrl,
      ocrProvider, setOcrProvider,
      currentUser, setCurrentUser,
      currentView, setCurrentView: changeView,
      activeViewFilter, setActiveViewFilter: (filter) => {
        setActiveViewFilter(filter);
        localStorage.setItem('votoReal_activeViewFilter', filter);
      },
      currentVotes, setCurrentVotes,
      ocrVotes, setOcrVotes,
      offlineVotes, setOfflineVotes,
      mesas, setMesas,
      mesasEstructura, setMesasEstructura,
      cachedUsers, setCachedUsers,
      isOnline,
      isScannerModalOpen, setIsScannerModalOpen,
      isOcrDetailModalOpen, setIsOcrDetailModalOpen,
      ocrRawDetail, setOcrRawDetail,
      alertDialog, showAlertDialog, showConfirmDialog, closeAlertDialog,
      welcomePopup, setWelcomePopup,
      attendanceSyncLoader, setAttendanceSyncLoader,
      toasts, showToast,
      globalLoading, setGlobalLoading,
      logout,
      fetchUsersDb
    }}>
      {children}
      <InactivityWarningModal
        isOpen={inactivityModal.isOpen}
        countdown={inactivityModal.countdown}
        maxCountdown={20}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={logout}
      />
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

