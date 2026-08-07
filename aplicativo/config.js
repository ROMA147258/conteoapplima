// --- STATE MANAGEMENT & CONFIG ---
const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbzVgQlnwieHYH-tiZTlsT9GRAvEyTq7sPUa945XeTeMBKIavl-ksSW0gcgkDSjOmkrJ/exec';
const DEFAULT_GEMINI_KEY = '';

// Forzar siempre la URL activa de Google Apps Script tanto en local como en producción
localStorage.setItem('votoReal_apiUrl', DEFAULT_API_URL);

let appState = {
  apiUrl: DEFAULT_API_URL,
  geminiApiKey: localStorage.getItem('votoReal_geminiApiKey') || DEFAULT_GEMINI_KEY,
  googleSheetId: localStorage.getItem('votoReal_googleSheetId') || '',
  currentUser: JSON.parse(sessionStorage.getItem('votoReal_user')) || null,
  mesas: [],
  mesas_estructura: JSON.parse(localStorage.getItem('vr_mesas_estructura') || '[]'),
  offlineVotes: JSON.parse(localStorage.getItem('votoReal_offlineVotes')) || [],
  currentVotes: {
    provincial: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "APROBADOS": 0, "NULOS": 0, "VACIOS": 0 },
    distrital: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "APROBADOS": 0, "NULOS": 0, "VACIOS": 0 }
  },
  ocrVotes: {
    provincial: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "APROBADOS": 0, "NULOS": 0, "VACIOS": 0 },
    distrital: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "APROBADOS": 0, "NULOS": 0, "VACIOS": 0 }
  },
  aggregatedVotes: JSON.parse(localStorage.getItem('votoReal_aggregatedVotes')) || {
    provincial: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "APROBADOS": 0, "NULOS": 0, "VACIOS": 0 },
    distrital: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "APROBADOS": 0, "NULOS": 0, "VACIOS": 0 }
  },
  currentChartScope: 'provincial', // 'provincial' or 'distrital'
  scannedConfidence: {
    provincial: { "FP": true, "JP": true, "SOMOS PERU": true, "FREPAP": true, "VERDE": true, "MORADO": true },
    distrital: { "FP": true, "JP": true, "SOMOS PERU": true, "FREPAP": true, "VERDE": true, "MORADO": true }
  }
};

function actualizarVisibilidadConfig() {
  const btnOpenConfig = document.getElementById('btn-open-config');
  const btnOpenMap = document.getElementById('btn-open-map');
  const isSuperAdmin = appState.currentUser && (
    appState.currentUser.dni === 'Admin#2026$Secure!VotoReal' ||
    appState.currentUser.dni === '99999999' ||
    appState.currentUser.nombre === 'Super Administrador'
  );
  if (isSuperAdmin) {
    if (btnOpenConfig) {
      btnOpenConfig.classList.remove('hidden');
      btnOpenConfig.style.display = 'flex';
    }
    if (btnOpenMap) {
      btnOpenMap.classList.remove('hidden');
      btnOpenMap.style.display = 'flex';
    }
  } else {
    if (btnOpenConfig) {
      btnOpenConfig.classList.add('hidden');
      btnOpenConfig.style.display = 'none';
    }
    if (btnOpenMap) {
      btnOpenMap.classList.add('hidden');
      btnOpenMap.style.display = 'none';
    }
  }
}

function openConfigModal() {
  document.getElementById('modal-config').classList.add('active');
}

function closeConfigModal() {
  document.getElementById('modal-config').classList.remove('active');
}

async function loadServerConfig() {
  try {
    const response = await fetch('/api/config');
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const config = await response.json();
      if (config.apiUrl) {
        appState.apiUrl = config.apiUrl;
        localStorage.setItem('votoReal_apiUrl', config.apiUrl);
      }
      if (config.geminiApiKey) {
        appState.geminiApiKey = config.geminiApiKey;
      }
      if (config.googleSheetId) {
        appState.googleSheetId = config.googleSheetId;
      }
      
      const urlInput = document.getElementById('config-url');
      const keyInput = document.getElementById('config-gemini-key');
      const sheetInput = document.getElementById('config-sheet-id');
      if (urlInput) urlInput.value = appState.apiUrl;
      if (keyInput) keyInput.value = appState.geminiApiKey;
      if (sheetInput) sheetInput.value = appState.googleSheetId;
      console.log('[CONFIG] Configuración cargada desde servidor local.');
    } else {
      // Alojamiento estático en la nube (Netlify / Vercel / GitHub Pages)
      appState.apiUrl = DEFAULT_API_URL;
      localStorage.setItem('votoReal_apiUrl', DEFAULT_API_URL);
      console.log('[CONFIG] Servidor en la nube detectado, conectado directamente a Google Apps Script.');
    }
  } catch (e) {
    appState.apiUrl = DEFAULT_API_URL;
    localStorage.setItem('votoReal_apiUrl', DEFAULT_API_URL);
    console.log('[CONFIG] Conectado a Google Apps Script por defecto.');
  }
}

async function saveConfig() {
  const urlValue = document.getElementById('config-url').value.trim();
  const geminiKeyValue = document.getElementById('config-gemini-key') ? document.getElementById('config-gemini-key').value.trim() : '';
  const sheetIdValue = document.getElementById('config-sheet-id') ? document.getElementById('config-sheet-id').value.trim() : '';

  if (urlValue) {
    if (!urlValue.startsWith('https://script.google.com/')) {
      showToast('La URL ingresada no parece ser de Google Apps Script.', 'error');
      return;
    }
  }

  const configData = {
    apiUrl: urlValue,
    geminiApiKey: geminiKeyValue,
    googleSheetId: sheetIdValue
  };

  try {
    const response = await fetch('/api/save-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(configData)
    });

    if (!response.ok) {
      throw new Error('Error al guardar configuración en el servidor');
    }

    // Update state
    appState.apiUrl = urlValue;
    appState.geminiApiKey = geminiKeyValue;
    appState.googleSheetId = sheetIdValue;

    // Cache locally as fallback
    localStorage.setItem('votoReal_apiUrl', urlValue);
    localStorage.setItem('votoReal_geminiApiKey', geminiKeyValue);
    localStorage.setItem('votoReal_googleSheetId', sheetIdValue);

    showToast('Configuración guardada en el servidor correctamente.', 'success');
    closeConfigModal();
  } catch (err) {
    console.error(err);
    showToast('Error al guardar la configuración en el servidor.', 'error');
  }
}

async function apiPost(data) {
  if (!appState.apiUrl) {
    throw new Error('La URL de la API no está configurada.');
  }

  // Inject Google Sheet ID if configured
  if (appState.googleSheetId) {
    data.googleSheetId = appState.googleSheetId;
  }

  const response = await fetch(appState.apiUrl, {
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('Error al conectar con el servidor.');
  }

  return await response.json();
}
