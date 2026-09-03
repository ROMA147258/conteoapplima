import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_API_URL, fetchServerConfig, apiPost, apiGet } from '../services/api';
import { buscarBrigadista, esCoordinador } from '../constants/usuarios';
import { isCountingTimeEnabled, isLlegadaButtonUnlocked } from '../utils/helpers';

const AppContext = createContext(null);

const INITIAL_KEYS = [
  "SOMOS PERU", "RENOVACION", "AHORA NACION", "AVANZA PAIS", "PODEMOS", "JP",
  "OBRAS", "FREPAP", "ACCION POPULAR", "ESPERANZA", "VENCEREMOS", "VISION PERU",
  "APRA", "FP", "PPC", "PROGRESEMOS", "MORADO", "BUEN GOBIERNO", "VERDE",
  "PERU LIBRE", "TIERRA VERDE", "PUEBLO CONSCIENTE", "PPP", "INTEGRIDAD",
  "FUERZA CIUDADANA", "BATALLA PERU", "APP", "ALIANZA REGIONAL",
  "BLANCO", "NULOS", "IMPUGNADOS", "VACIOS"
];

const createInitialVotesObj = () => {
  const obj = {};
  INITIAL_KEYS.forEach(k => { obj[k] = 0; });
  return obj;
};

const DEFAULT_VOTES = {
  provincial: createInitialVotesObj(),
  distrital: createInitialVotesObj()
};

export const AppProvider = ({ children }) => {
  // Config state
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [ollamaHost, setOllamaHost] = useState(() => localStorage.getItem('votoReal_ollamaHost') || 'http://127.0.0.1:11434');
  const [ollamaModel, setOllamaModel] = useState(() => {
    const saved = localStorage.getItem('votoReal_ollamaModel');
    if (saved && (saved.includes('minicpm') || saved.includes('vision') || saved.includes('moondream'))) {
      return saved;
    }
    return 'minicpm-v:latest';
  });

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
  const [currentVotes, setCurrentVotes] = useState(JSON.parse(JSON.stringify(DEFAULT_VOTES)));
  const [ocrVotes, setOcrVotes] = useState(JSON.parse(JSON.stringify(DEFAULT_VOTES)));
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
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
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
      if (cfg) {
        if (cfg.ollamaHost) setOllamaHost(cfg.ollamaHost);
        if (cfg.ollamaModel) setOllamaModel(cfg.ollamaModel);
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

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('votoReal_user');
    sessionStorage.removeItem('votoReal_popupEntradaMostrar');
    setCurrentVotes(JSON.parse(JSON.stringify(DEFAULT_VOTES)));
    setOcrVotes(JSON.parse(JSON.stringify(DEFAULT_VOTES)));
    setCurrentView('view-login');
    showToast('Sesión cerrada correctamente.', 'info');
  };

  return (
    <AppContext.Provider value={{
      apiUrl, setApiUrl,
      ollamaHost, setOllamaHost,
      ollamaModel, setOllamaModel,
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
      isConfigModalOpen, setIsConfigModalOpen,
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
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
