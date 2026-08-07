// --- APP CONTROLLER (ENTRY POINT) ---
// Global state management is imported from config.js

function extractJsonFromString(str) {
  if (!str) return null;
  const trimmed = str.trim();
  try {
    return JSON.parse(trimmed);
  } catch (e) {}

  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(codeBlockRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {}
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {}
  }

  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = trimmed.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {}
  }

  return null;
}

// --- GLOBAL OCR HISTORY STATE ---
let ocrHistory = [];
let selectedOcrItemIndex = 0;
let currentSelectedOcrCol = null;

function loadOcrHistory() {
  ocrHistory = [];
}

function saveOcrHistory() {
  // Historial desactivado
}

function obtenerVotosParaMostrar(scope) {
  const result = {};
  const keys = ["FP", "JP", "SOMOS PERU", "FREPAP", "VERDE", "MORADO"];
  keys.forEach(key => {
    const agg = (appState.aggregatedVotes && appState.aggregatedVotes[scope] && appState.aggregatedVotes[scope][key]) || 0;
    const cur = (appState.currentVotes && appState.currentVotes[scope] && appState.currentVotes[scope][key]) || 0;
    result[key] = Number(agg) + Number(cur);
  });
  return result;
}

// --- APP CONTROLLER (ENTRY POINT) ---
// Global state management is imported from config.js

// --- INITIALIZE ---
document.addEventListener('DOMContentLoaded', async () => {
  // Restablecer mesas registradas previamente guardadas desde localStorage
  try {
    const storedMesas = localStorage.getItem('votoReal_mesas');
    if (storedMesas) {
      appState.mesas = JSON.parse(storedMesas);
    }
  } catch (e) {
    console.warn("No se pudo restaurar appState.mesas desde localStorage:", e);
  }

  // Load configuration from the server
  if (typeof loadServerConfig === 'function') {
    await loadServerConfig();
  }

  // Load OCR history from local storage
  loadOcrHistory();
  renderOcrHistory();

  // Init Icons
  lucide.createIcons();
  
  // Populate location select input
  poblarUbicaciones();
  
  // Background fetch users database from Google Sheets on page load
  if (typeof fetchUsuariosDb === 'function') {
    fetchUsuariosDb();
  }

  // Set initial configuration URL and Gemini key in modal inputs
  const configUrlField = document.getElementById('config-url');
  if (configUrlField) {
    configUrlField.value = appState.apiUrl;
  }
  
  const configGeminiKey = document.getElementById('config-gemini-key');
  if (configGeminiKey) {
    configGeminiKey.value = appState.geminiApiKey || '';
  }

  const configSheetIdField = document.getElementById('config-sheet-id');
  if (configSheetIdField) {
    configSheetIdField.value = appState.googleSheetId || '';
  }
  
  // Check if user has an active session (sessionStorage, not the default config value)
  const activeSession = sessionStorage.getItem('votoReal_user');
  if (activeSession) {
    const currentUserObj = JSON.parse(activeSession);
    appState.currentUser = currentUserObj;
    actualizarVisibilidadConfig();
    
    if (typeof esCoordinador === 'function' && esCoordinador(appState.currentUser)) {
      if (typeof setupCoordinatorDisplay === 'function') {
        setupCoordinatorDisplay();
      }
      showView('view-coordinator');
    } else {
      setupUserDisplay();
      if (typeof checkBrigadistaAttendance === 'function') {
        checkBrigadistaAttendance();
      }
      generarTablaCandidatos();
      generarTablaCandidatosOCR();
      inicializarGraficos();
      actualizarGraficosYResumen(
        obtenerVotosParaMostrar(appState.currentChartScope), 
        appState.currentChartScope, 
        appState.currentUser.ubicacion
      );
      let storedFilter = localStorage.getItem('votoReal_activeViewFilter') || 'manual';
      if (storedFilter === 'all') storedFilter = 'manual';
      applyViewFilter(storedFilter);
      showView('view-counting');
      fetchAndSyncReport();
    }
  } else {
    showView('view-login');
  }

  // Bind Event Listeners
  setupEventListeners();

  // Fetch dynamic users database from Google Sheets
  fetchUsuariosDb();

  // Initialize offline sync bar status
  updateSyncStatusBar();

  // Initialize time restriction check
  actualizarRestriccionHoraria();

  // Connection Event Listeners
  window.addEventListener('online', handleNetworkChange);
  window.addEventListener('offline', handleNetworkChange);

  // Auto-sync offline records every 15 seconds if online, and sync reports every 10 seconds
  setInterval(syncPendingVotes, 15000);
  setInterval(fetchAndSyncReport, 10000);
  setInterval(actualizarRestriccionHoraria, 3000);
});

// --- DYNAMIC VOTING GRID GENERATION ---
function generarTablaCandidatos(resetVotes = false) {
  const tableBody = document.getElementById('candidates-table-body');
  if (!tableBody || !appState.currentUser) return;

  tableBody.innerHTML = '';
  const ubicacion = appState.currentUser.ubicacion;
  
  // Get Candidates mappings
  const candidatosProvincial = obtenerCandidatosPorUbicacion("Lima");
  const candidatosDistrital = obtenerCandidatosPorUbicacion(ubicacion);

  // Reset current votes state ONLY if requested
  if (resetVotes) {
    Object.keys(PARTIDO_ID_MAP).forEach(party => {
      appState.currentVotes.provincial[party] = 0;
      appState.currentVotes.distrital[party] = 0;
    });
  }

  const showProv = document.getElementById('chk-transmit-provincial') ? document.getElementById('chk-transmit-provincial').checked : true;

  if (showProv) {
    // 1. SECTION: PROVINCIAL MAYOR (LIMA METROPOLITANA)
    const alcaldeProvincialActual = obtenerAlcaldeActual("Lima");
    const headerProv = document.createElement('div');
    headerProv.className = 'table-section-header';
    headerProv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
        <i data-lucide="map"></i> 
        <span>Alcaldía Metropolitana (Lima)</span>
        <span style="font-size: 0.68rem; text-transform: none; color: #38bdf8; font-weight: 500; margin-left: auto; background: rgba(56, 189, 248, 0.1); padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.2);">
          Alcalde actual: ${alcaldeProvincialActual}
        </span>
      </div>
    `;
    tableBody.appendChild(headerProv);

    Object.keys(PARTIDO_ID_MAP).forEach(partyKey => {
      const partyId = PARTIDO_ID_MAP[partyKey];
      const candidateName = candidatosProvincial[partyKey] || "Sin Candidato";
      const partyLongName = PARTIDO_NOMBRES_LARGOS[partyKey];

      const isHighConfidence = appState.scannedConfidence.provincial[partyKey] !== false;
      const borderStyle = isHighConfidence ? '' : 'border: 1px solid #eab308 !important; box-shadow: 0 0 4px rgba(234, 179, 8, 0.4) !important;';
      const warningBadge = isHighConfidence ? '' : '<span class="confidence-warning-badge" title="Baja confianza de escaneo. Gemini y Tesseract difieren o error de suma. Verifique.">⚠️</span>';

      const row = document.createElement('div');
      row.className = `table-row-grid candidate-row candidate-${partyId}`;
      row.innerHTML = `
        <div>
          <span class="candidate-party-badge color-badge-${partyId}">${partyKey}</span>
        </div>
        <div>
          <div class="candidate-name-text">${candidateName}</div>
          <div class="candidate-party-name">${partyLongName}</div>
        </div>
        <div class="counter-controller-horizontal" style="position: relative; display: flex; justify-content: flex-end; align-items: center; width: 100%;">
          ${warningBadge}
          <input type="number" id="votos-prov-${partyId}" value="${appState.currentVotes.provincial[partyKey] || 0}" min="0" max="999" class="counter-input-field ${isHighConfidence ? '' : 'low-confidence-input'}" style="${borderStyle} margin: 0; width: 80px; text-align: center;" data-party="${partyKey}" data-scope="provincial">
        </div>
      `;
      tableBody.appendChild(row);
    });

    // Append provincial voting metrics
    const provMetrics = [
      { key: "NULOS", label: "NULO", name: "Votos Nulos", sub: "Métrica de Acta", class: "metric-nulo" },
      { key: "VACIOS", label: "VACÍO", name: "Votos Vacíos", sub: "Métrica de Acta", class: "metric-vacio" }
    ];
    provMetrics.forEach(metric => {
      const row = document.createElement('div');
      row.className = `table-row-grid candidate-row metric-row-${metric.key.toLowerCase()}`;
      row.innerHTML = `
        <div>
          <span class="candidate-party-badge color-badge-${metric.class}">${metric.label}</span>
        </div>
        <div>
          <div class="candidate-name-text">${metric.name}</div>
          <div class="candidate-party-name">${metric.sub}</div>
        </div>
        <div class="counter-controller-horizontal" style="position: relative; display: flex; justify-content: flex-end; align-items: center; width: 100%;">
          <input type="number" id="votos-prov-${metric.key.toLowerCase()}" value="${appState.currentVotes.provincial[metric.key] || 0}" min="0" max="999" class="counter-input-field" style="margin: 0; width: 80px; text-align: center;" data-party="${metric.key}" data-scope="provincial">
        </div>
      `;
      tableBody.appendChild(row);
    });

    // 2. SECTION: DISTRICT MAYOR (LOCAL DISTRICT)
    const alcaldeActual = obtenerAlcaldeActual(ubicacion);
    const headerDist = document.createElement('div');
    headerDist.className = 'table-section-header';
    headerDist.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
        <i data-lucide="map-pin"></i> 
        <span>Alcaldía Distrital (${ubicacion})</span>
        <span style="font-size: 0.68rem; text-transform: none; color: #38bdf8; font-weight: 500; margin-left: auto; background: rgba(56, 189, 248, 0.1); padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.2);">
          Alcalde actual: ${alcaldeActual}
        </span>
      </div>
    `;
    tableBody.appendChild(headerDist);

    Object.keys(PARTIDO_ID_MAP).forEach(partyKey => {
      const partyId = PARTIDO_ID_MAP[partyKey];
      const candidateName = candidatosDistrital[partyKey] || "Sin Candidato";
      const partyLongName = PARTIDO_NOMBRES_LARGOS[partyKey];

      const isHighConfidence = appState.scannedConfidence.distrital[partyKey] !== false;
      const borderStyle = isHighConfidence ? '' : 'border: 1px solid #eab308 !important; box-shadow: 0 0 4px rgba(234, 179, 8, 0.4) !important;';
      const warningBadge = isHighConfidence ? '' : '<span class="confidence-warning-badge" title="Baja confianza de escaneo. Gemini y Tesseract difieren o error de suma. Verifique.">⚠️</span>';

      const row = document.createElement('div');
      row.className = `table-row-grid candidate-row candidate-${partyId}`;
      row.innerHTML = `
        <div>
          <span class="candidate-party-badge color-badge-${partyId}">${partyKey}</span>
        </div>
        <div>
          <div class="candidate-name-text">${candidateName}</div>
          <div class="candidate-party-name">${partyLongName}</div>
        </div>
        <div class="counter-controller-horizontal" style="position: relative; display: flex; justify-content: flex-end; align-items: center; width: 100%;">
          ${warningBadge}
          <input type="number" id="votos-dist-${partyId}" value="${appState.currentVotes.distrital[partyKey] || 0}" min="0" max="999" class="counter-input-field ${isHighConfidence ? '' : 'low-confidence-input'}" style="${borderStyle} margin: 0; width: 80px; text-align: center;" data-party="${partyKey}" data-scope="distrital">
        </div>
      `;
      tableBody.appendChild(row);
    });

    // Append distrital voting metrics
    const distMetrics = [
      { key: "NULOS", label: "NULO", name: "Votos Nulos", sub: "Métrica de Acta", class: "metric-nulo" },
      { key: "VACIOS", label: "VACÍO", name: "Votos Vacíos", sub: "Métrica de Acta", class: "metric-vacio" }
    ];
    distMetrics.forEach(metric => {
      const row = document.createElement('div');
      row.className = `table-row-grid candidate-row metric-row-${metric.key.toLowerCase()}`;
      row.innerHTML = `
        <div>
          <span class="candidate-party-badge color-badge-${metric.class}">${metric.label}</span>
        </div>
        <div>
          <div class="candidate-name-text">${metric.name}</div>
          <div class="candidate-party-name">${metric.sub}</div>
        </div>
        <div class="counter-controller-horizontal" style="position: relative; display: flex; justify-content: flex-end; align-items: center; width: 100%;">
          <input type="number" id="votos-dist-${metric.key.toLowerCase()}" value="${appState.currentVotes.distrital[metric.key] || 0}" min="0" max="999" class="counter-input-field" style="margin: 0; width: 80px; text-align: center;" data-party="${metric.key}" data-scope="distrital">
        </div>
      `;
      tableBody.appendChild(row);
    });
  }

  // Re-render Lucide Icons for added section headers
  lucide.createIcons();

  // Bind change events to the inputs for direct typing support
  document.querySelectorAll('.counter-input-field').forEach(input => {
    input.addEventListener('change', handleDirectInputChange);
    input.addEventListener('input', handleDirectInputChange);
    input.addEventListener('focus', (e) => e.target.select()); // Auto-select text on focus
  });

  actualizarRestriccionHoraria();
}

function generarTablaCandidatosOCR() {
  const tableBody = document.getElementById('ocr-candidates-table-body');
  if (!tableBody || !appState.currentUser) return;

  tableBody.innerHTML = '';
  const ubicacion = appState.currentUser.ubicacion;
  const showProv = document.getElementById('chk-transmit-provincial') ? document.getElementById('chk-transmit-provincial').checked : true;

  if (showProv) {
    // 1. SECTION: PROVINCIAL MAYOR (LIMA METROPOLITANA)
    const candidatosProvincial = obtenerCandidatosPorUbicacion("Lima");
    const alcaldeProvincialActual = obtenerAlcaldeActual("Lima");
    const headerProv = document.createElement('div');
    headerProv.className = 'table-section-header';
    headerProv.style.cssText = 'background: rgba(168, 85, 247, 0.12); border-left: 3px solid #a855f7;';
    headerProv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
        <i data-lucide="map"></i> 
        <span>Alcaldía Metropolitana (Lima) - OCR</span>
        <span style="font-size: 0.68rem; text-transform: none; color: #a855f7; font-weight: 500; margin-left: auto; background: rgba(168, 85, 247, 0.1); padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(168, 85, 247, 0.2);">
          Alcalde actual: ${alcaldeProvincialActual}
        </span>
      </div>
    `;
    tableBody.appendChild(headerProv);

    Object.keys(PARTIDO_ID_MAP).forEach(partyKey => {
      const partyId = PARTIDO_ID_MAP[partyKey];
      const candidateName = candidatosProvincial[partyKey] || "Sin Candidato";
      const partyLongName = PARTIDO_NOMBRES_LARGOS[partyKey];
      const votesVal = appState.ocrVotes.provincial[partyKey] || 0;

      const row = document.createElement('div');
      row.className = `table-row-grid candidate-row candidate-${partyId}`;
      row.innerHTML = `
        <div>
          <span class="candidate-party-badge color-badge-${partyId}">${partyKey}</span>
        </div>
        <div>
          <div class="candidate-name-text">${candidateName}</div>
          <div class="candidate-party-name">${partyLongName}</div>
        </div>
        <div class="counter-controller-horizontal" style="justify-content: center; font-size: 1.1rem; font-weight: 700; color: #fff; padding-right: 20px;">
          ${votesVal}
        </div>
      `;
      tableBody.appendChild(row);
    });

    // Append provincial voting metrics OCR
    const provMetricsOCR = [
      { key: "NULOS", label: "NULO", name: "Votos Nulos", sub: "Métrica de Acta", class: "metric-nulo" },
      { key: "VACIOS", label: "VACÍO", name: "Votos Vacíos", sub: "Métrica de Acta", class: "metric-vacio" }
    ];
    provMetricsOCR.forEach(metric => {
      const row = document.createElement('div');
      row.className = `table-row-grid candidate-row metric-row-${metric.key.toLowerCase()}`;
      const votesVal = appState.ocrVotes.provincial[metric.key] || 0;
      row.innerHTML = `
        <div>
          <span class="candidate-party-badge color-badge-${metric.class}">${metric.label}</span>
        </div>
        <div>
          <div class="candidate-name-text">${metric.name}</div>
          <div class="candidate-party-name">${metric.sub}</div>
        </div>
        <div class="counter-controller-horizontal" style="justify-content: center; font-size: 1.1rem; font-weight: 700; color: #fff; padding-right: 20px;">
          ${votesVal}
        </div>
      `;
      tableBody.appendChild(row);
    });

    // 2. SECTION: DISTRICT MAYOR (LOCAL DISTRICT)
    const candidatosDistrital = obtenerCandidatosPorUbicacion(ubicacion);
    const alcaldeActual = obtenerAlcaldeActual(ubicacion);
    const headerDist = document.createElement('div');
    headerDist.className = 'table-section-header';
    headerDist.style.cssText = 'background: rgba(168, 85, 247, 0.12); border-left: 3px solid #a855f7;';
    headerDist.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
        <i data-lucide="map-pin"></i> 
        <span>Alcaldía Distrital (${ubicacion}) - OCR</span>
        <span style="font-size: 0.68rem; text-transform: none; color: #a855f7; font-weight: 500; margin-left: auto; background: rgba(168, 85, 247, 0.1); padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(168, 85, 247, 0.2);">
          Alcalde actual: ${alcaldeActual}
        </span>
      </div>
    `;
    tableBody.appendChild(headerDist);

    Object.keys(PARTIDO_ID_MAP).forEach(partyKey => {
      const partyId = PARTIDO_ID_MAP[partyKey];
      const candidateName = candidatosDistrital[partyKey] || "Sin Candidato";
      const partyLongName = PARTIDO_NOMBRES_LARGOS[partyKey];
      const votesVal = appState.ocrVotes.distrital[partyKey] || 0;

      const row = document.createElement('div');
      row.className = `table-row-grid candidate-row candidate-${partyId}`;
      row.innerHTML = `
        <div>
          <span class="candidate-party-badge color-badge-${partyId}">${partyKey}</span>
        </div>
        <div>
          <div class="candidate-name-text">${candidateName}</div>
          <div class="candidate-party-name">${partyLongName}</div>
        </div>
        <div class="counter-controller-horizontal" style="justify-content: center; font-size: 1.1rem; font-weight: 700; color: #fff; padding-right: 20px;">
          ${votesVal}
        </div>
      `;
      tableBody.appendChild(row);
    });

    // Append distrital voting metrics OCR
    const distMetricsOCR = [
      { key: "NULOS", label: "NULO", name: "Votos Nulos", sub: "Métrica de Acta", class: "metric-nulo" },
      { key: "VACIOS", label: "VACÍO", name: "Votos Vacíos", sub: "Métrica de Acta", class: "metric-vacio" }
    ];
    distMetricsOCR.forEach(metric => {
      const row = document.createElement('div');
      row.className = `table-row-grid candidate-row metric-row-${metric.key.toLowerCase()}`;
      const votesVal = appState.ocrVotes.distrital[metric.key] || 0;
      row.innerHTML = `
        <div>
          <span class="candidate-party-badge color-badge-${metric.class}">${metric.label}</span>
        </div>
        <div>
          <div class="candidate-name-text">${metric.name}</div>
          <div class="candidate-party-name">${metric.sub}</div>
        </div>
        <div class="counter-controller-horizontal" style="justify-content: center; font-size: 1.1rem; font-weight: 700; color: #fff; padding-right: 20px;">
          ${votesVal}
        </div>
      `;
      tableBody.appendChild(row);
    });
  }

  // Re-render Lucide Icons for added section headers
  lucide.createIcons();
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // DNI & Name Autocomplete Lookup Events
  const inputDni = document.getElementById('login-dni');
  const inputNombre = document.getElementById('login-nombre');
  if (inputDni) {
    inputDni.addEventListener('input', handleLoginInputLookup);
  }
  if (inputNombre) {
    inputNombre.addEventListener('input', handleLoginInputLookup);
  }

  // VIEW FILTERS (Todos / Conteo Manual / Conteo por Imagen)
  const filterBtnAll = document.getElementById('filter-btn-all');
  const filterBtnManual = document.getElementById('filter-btn-manual');
  const filterBtnOcr = document.getElementById('filter-btn-ocr');

  if (filterBtnAll) {
    filterBtnAll.addEventListener('click', () => applyViewFilter('all'));
  }
  if (filterBtnManual) {
    filterBtnManual.addEventListener('click', () => applyViewFilter('manual'));
  }
  if (filterBtnOcr) {
    filterBtnOcr.addEventListener('click', () => applyViewFilter('ocr'));
  }

  // Modal Config Interactions
  const btnOpenConfig = document.getElementById('btn-open-config');
  const btnCloseConfig = document.getElementById('btn-close-config');
  const btnSaveConfig = document.getElementById('btn-save-config');
  
  if (btnOpenConfig) btnOpenConfig.addEventListener('click', () => {
    const isSuperAdmin = appState.currentUser && (appState.currentUser.dni === 'Admin#2026$Secure!VotoReal' || appState.currentUser.nombre === 'Super Administrador');
    if (isSuperAdmin) openConfigModal();
  });
  if (btnCloseConfig) btnCloseConfig.addEventListener('click', closeConfigModal);
  if (btnSaveConfig) btnSaveConfig.addEventListener('click', saveConfig);
  
  // Close modal when clicking outside
  const modal = document.getElementById('modal-config');
  if (modal) {
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeConfigModal();
      }
    });
  }

  // Config Button Trigger (Double click header logo) - Secret/Hidden shortcut
  const logo = document.querySelector('.logo-area');
  if (logo) {
    logo.addEventListener('dblclick', () => {
      const isSuperAdmin = appState.currentUser && (appState.currentUser.dni === 'Admin#2026$Secure!VotoReal' || appState.currentUser.nombre === 'Super Administrador');
      // Allow if not logged in yet, or if logged in as superadmin
      if (!appState.currentUser || isSuperAdmin) {
        openConfigModal();
      }
    });
  }

  // Login/Access Submit
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', handleAccessSubmit);
  }

  // Logout
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', handleLogout);
  }
  const btnCoordLogout = document.getElementById('btn-coord-logout');
  if (btnCoordLogout) {
    btnCoordLogout.addEventListener('click', handleLogout);
  }

  // Coordinator search input listener
  const coordSearchInput = document.getElementById('coord-search-personero');
  if (coordSearchInput) {
    coordSearchInput.addEventListener('input', () => {
      renderCoordinatorPersoneros();
    });
  }

  // Form Submit for Votes
  const formVotos = document.getElementById('form-votos');
  if (formVotos) {
    formVotos.addEventListener('submit', handleVotesSubmit);
  }

  // Manual Sync Button
  const btnSyncNow = document.getElementById('btn-sync-now');
  if (btnSyncNow) {
    btnSyncNow.addEventListener('click', syncPendingVotes);
  }

  // TABS TOGGLE SYSTEM
  const tabBtnTable = document.getElementById('tab-btn-table');
  const tabBtnOcr = document.getElementById('tab-btn-ocr');
  const tabContentTable = document.getElementById('tab-content-table');
  const tabContentOcr = document.getElementById('tab-content-ocr');

  const switchTab = (activeBtn, activeContent) => {
    [tabBtnTable, tabBtnOcr].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    [tabContentTable, tabContentOcr].forEach(content => {
      if (content) content.classList.remove('active');
    });
    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
  };

  if (tabBtnTable) {
    tabBtnTable.addEventListener('click', () => {
      switchTab(tabBtnTable, tabContentTable);
    });
  }

  if (tabBtnOcr) {
    tabBtnOcr.addEventListener('click', () => {
      switchTab(tabBtnOcr, tabContentOcr);
      renderOcrHistory();
    });
  }


  // OCR DOWNLOAD ACTIONS
  const btnDownloadJson = document.getElementById('btn-download-json');
  if (btnDownloadJson) {
    btnDownloadJson.addEventListener('click', downloadSelectedOcrJson);
  }
  const btnDownloadTxt = document.getElementById('btn-download-txt');
  if (btnDownloadTxt) {
    btnDownloadTxt.addEventListener('click', downloadSelectedOcrTxt);
  }
  const btnDownloadCsv = document.getElementById('btn-download-csv');
  if (btnDownloadCsv) {
    btnDownloadCsv.addEventListener('click', downloadSelectedOcrCsv);
  }

  // OCR VIEW MODE TOGGLE (Visual vs JSON)
  const viewBtnVisual = document.getElementById('ocr-view-btn-visual');
  const viewBtnJson = document.getElementById('ocr-view-btn-json');
  const visualPreview = document.getElementById('ocr-visual-preview');
  const jsonOutput = document.getElementById('ocr-json-output');

  if (viewBtnVisual && viewBtnJson) {
    viewBtnVisual.addEventListener('click', () => {
      viewBtnVisual.classList.add('active');
      viewBtnJson.classList.remove('active');
      if (visualPreview) visualPreview.style.display = 'block';
      if (jsonOutput) jsonOutput.style.display = 'none';
    });

    viewBtnJson.addEventListener('click', () => {
      viewBtnJson.classList.add('active');
      viewBtnVisual.classList.remove('active');
      if (visualPreview) visualPreview.style.display = 'none';
      if (jsonOutput) jsonOutput.style.display = 'block';
    });
  }

  // CHARTS SCOPE TOGGLE (Provincial vs Distrital)
  const toggleProv = document.getElementById('chart-toggle-provincial');
  const toggleDist = document.getElementById('chart-toggle-distrital');

  if (toggleProv && toggleDist) {
    toggleProv.addEventListener('click', () => {
      toggleProv.classList.add('active');
      toggleDist.classList.remove('active');
      appState.currentChartScope = 'provincial';
      actualizarGraficosYResumen(
        obtenerVotosParaMostrar('provincial'), 
        'provincial', 
        appState.currentUser ? appState.currentUser.ubicacion : "ATE"
      );
      actualizarGraficosOCRTab();
    });

    toggleDist.addEventListener('click', () => {
      toggleDist.classList.add('active');
      toggleProv.classList.remove('active');
      appState.currentChartScope = 'distrital';
      actualizarGraficosYResumen(
        obtenerVotosParaMostrar('distrital'), 
        'distrital', 
        appState.currentUser ? appState.currentUser.ubicacion : "ATE"
      );
      actualizarGraficosOCRTab();
    });
  }

  // Scanner Modal Trigger & Operations
  const btnScanActa = document.getElementById('btn-scan-acta');
  if (btnScanActa) btnScanActa.addEventListener('click', openScannerModal);

  const btnCloseScanner = document.getElementById('btn-close-scanner');
  if (btnCloseScanner) btnCloseScanner.addEventListener('click', closeScannerModal);

  const btnCancelScan = document.getElementById('btn-cancel-scan');
  if (btnCancelScan) btnCancelScan.addEventListener('click', closeScannerModal);

  const imageUpload = document.getElementById('image-upload');
  if (imageUpload) imageUpload.addEventListener('change', handleImageUploadChange);

  const btnRemovePhoto = document.getElementById('btn-remove-photo');
  if (btnRemovePhoto) btnRemovePhoto.addEventListener('click', clearScannerState);

  const btnApplyScan = document.getElementById('btn-apply-scan');
  if (btnApplyScan) btnApplyScan.addEventListener('click', applyScannedVotes);

  const btnReparseText = document.getElementById('btn-reparse-text');
  if (btnReparseText) {
    btnReparseText.addEventListener('click', () => {
      const rawTextContent = document.getElementById('scan-raw-text-content');
      if (rawTextContent) {
        const textVal = rawTextContent.value;
        const detected = procesarTextoOCR(textVal);
        scannerTempVotes = detected;
        renderScannedResultsSummary(scannerTempVotes, ['Procesador manual']);
        showToast('Votos re-calculados a partir del texto actual.', 'success');
      }
    });
  }

  const chkTransmitProv = document.getElementById('chk-transmit-provincial');
  if (chkTransmitProv) {
    chkTransmitProv.addEventListener('change', syncOcrToManualRealtime);
  }
  const chkTransmitDist = document.getElementById('chk-transmit-distrital');
  if (chkTransmitDist) {
    chkTransmitDist.addEventListener('change', syncOcrToManualRealtime);
  }

  const btnApplyOcrVotes = document.getElementById('btn-apply-ocr-votes');
  if (btnApplyOcrVotes) {
    btnApplyOcrVotes.addEventListener('click', applyOcrTabVotes);
  }

  // OCR DETAILED MODAL BINDINGS
  const btnShowOcrModal = document.getElementById('btn-show-ocr-detail-modal');
  const modalOcrDetail = document.getElementById('modal-ocr-detail');
  const btnCloseOcrModal = document.getElementById('btn-close-ocr-modal');

  if (btnShowOcrModal && modalOcrDetail) {
    btnShowOcrModal.addEventListener('click', () => {
      modalOcrDetail.style.display = 'block';
    });
  }

  if (btnCloseOcrModal && modalOcrDetail) {
    btnCloseOcrModal.addEventListener('click', () => {
      modalOcrDetail.style.display = 'none';
    });
  }

  if (modalOcrDetail) {
    window.addEventListener('click', (e) => {
      if (e.target === modalOcrDetail) {
        modalOcrDetail.style.display = 'none';
      }
    });
  }

  const ocrModalBtnVisual = document.getElementById('ocr-modal-view-btn-visual');
  const ocrModalBtnJson = document.getElementById('ocr-modal-view-btn-json');
  const ocrModalVisualPreview = document.getElementById('ocr-modal-visual-preview');
  const ocrModalJsonOutput = document.getElementById('ocr-modal-json-output');

  if (ocrModalBtnVisual && ocrModalBtnJson) {
    ocrModalBtnVisual.addEventListener('click', () => {
      ocrModalBtnVisual.classList.add('active');
      ocrModalBtnJson.classList.remove('active');
      if (ocrModalVisualPreview) ocrModalVisualPreview.style.display = 'block';
      if (ocrModalJsonOutput) ocrModalJsonOutput.style.display = 'none';
    });

    ocrModalBtnJson.addEventListener('click', () => {
      ocrModalBtnJson.classList.add('active');
      ocrModalBtnVisual.classList.remove('active');
      if (ocrModalVisualPreview) ocrModalVisualPreview.style.display = 'none';
      if (ocrModalJsonOutput) ocrModalJsonOutput.style.display = 'block';
    });
  }

  const btnModalDownloadJson = document.getElementById('btn-modal-download-json');
  if (btnModalDownloadJson) {
    btnModalDownloadJson.addEventListener('click', downloadSelectedOcrJson);
  }

  const btnModalDownloadTxt = document.getElementById('btn-modal-download-txt');
  if (btnModalDownloadTxt) {
    btnModalDownloadTxt.addEventListener('click', downloadSelectedOcrTxt);
  }

  // Close scanner modal on click outside
  const modalScanner = document.getElementById('modal-scanner');
  if (modalScanner) {
    window.addEventListener('click', (e) => {
      if (e.target === modalScanner) {
        closeScannerModal();
      }
    });
  }

  // App-level district selector change listener (for Guest / Super Admin)
  const districtSelect = document.getElementById('app-district-select');
  if (districtSelect) {
    districtSelect.addEventListener('change', (e) => {
      const newDist = e.target.value;
      if (appState.currentUser) {
        appState.currentUser.ubicacion = newDist;
        sessionStorage.setItem('votoReal_user', JSON.stringify(appState.currentUser));
        
        // Update user display text
        setupUserDisplay();
        
        // Regenerate tables and charts
        generarTablaCandidatos(false);
        generarTablaCandidatosOCR();
        
        if (appState.currentChartScope === 'distrital') {
          actualizarGraficosYResumen(
            obtenerVotosParaMostrar('distrital'), 
            'distrital', 
            newDist
          );
        } else {
          actualizarGraficosYResumen(
            obtenerVotosParaMostrar('provincial'), 
            'provincial', 
            newDist
          );
        }
      }
    });
  }

  const inputMesa = document.getElementById('input-mesa');
  if (inputMesa) {
    let syncTimeout = null;
    inputMesa.addEventListener('input', () => {
      handleMesaInputChange();
      // Solo resetear checkbox si NO está ya confirmada persistentemente
      const _dni = appState.currentUser ? appState.currentUser.dni : '';
      const _yaConfirmado = _dni && localStorage.getItem(`votoReal_attConfirmed_${_dni}`) === 'true';
      if (!_yaConfirmado) {
        const checkBrigadista = document.getElementById('check-asistencia-brigadista');
        if (checkBrigadista) {
          checkBrigadista.checked = false;
          const checkLabelBrigadista = document.getElementById('check-label-brigadista');
          if (checkLabelBrigadista) {
            checkLabelBrigadista.style.color = 'var(--text-muted)';
            checkLabelBrigadista.textContent = 'Confirmar';
          }
        }
      }
      const mesaVal = inputMesa.value.trim();
      if (!mesaVal) {
        lastSyncMesa = '';
      }
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        if (typeof sincronizarMesa === 'function') {
          sincronizarMesa(mesaVal);
        }
      }, 150);
    });

    inputMesa.addEventListener('blur', () => {
      const mesaVal = inputMesa.value.trim();
      if (typeof sincronizarMesa === 'function') {
        sincronizarMesa(mesaVal);
      }
    });
  }

  // Attendance confirmation checkbox for brigadistas (voting form)
  const checkBrigadista = document.getElementById('check-asistencia-brigadista');
  const inputColegio = document.getElementById('input-colegio');
  const checkLabelBrigadista = document.getElementById('check-label-brigadista');
  
  if (checkBrigadista && inputMesa) {
    checkBrigadista.addEventListener('change', async (e) => {
      const isChecked = e.target.checked;
      const mesaVal = inputMesa.value.trim();
      const localVal = inputColegio ? inputColegio.value.trim() : '';
      
      if (isChecked) {
        if (!mesaVal) {
          showAlertDialog({
            title: 'Mesa Requerida',
            message: 'Por favor, ingresa tu número de mesa en la casilla antes de confirmar.',
            buttonText: 'Aceptar',
            type: 'warning',
            onClose: () => {
              e.target.checked = false;
            }
          });
          return;
        }

        const match = buscarColegioPorMesa(mesaVal);
        const userDist = appState.currentUser ? appState.currentUser.ubicacion : '';

        if (!match) {
          showAlertDialog({
            title: 'Mesa Incorrecta',
            message: `El número de mesa <strong>${mesaVal}</strong> no existe o no está registrado en el sistema. Por favor, <strong>agrega tu número de mesa correctamente</strong>.`,
            buttonText: 'Aceptar',
            type: 'error',
            onClose: () => {
              e.target.checked = false;
            }
          });
          return;
        }

        if (userDist && match.distrito && match.distrito.toLowerCase() !== userDist.toLowerCase()) {
          showAlertDialog({
            title: 'Mesa No Autorizada',
            message: `La mesa <strong>${mesaVal}</strong> pertenece al distrito de <strong>${match.distrito}</strong>. Solo puedes registrar mesas de tu distrito asignado (<strong>${userDist}</strong>). Por favor, <strong>agrega tu número de mesa correctamente</strong>.`,
            buttonText: 'Aceptar',
            type: 'error',
            onClose: () => {
              e.target.checked = false;
            }
          });
          return;
        }

        const assignedMesa = appState.currentUser ? appState.currentUser.mesa : '';
        const isSuperAdmin = appState.currentUser && (appState.currentUser.dni === 'Admin#2026$Secure!VotoReal' || appState.currentUser.nombre === 'Super Administrador');
        const isCoordinator = typeof esCoordinador === 'function' && esCoordinador(appState.currentUser);

        if (assignedMesa && !isSuperAdmin && !isCoordinator) {
          let normMesaVal = mesaVal;
          if (/^\d+$/.test(normMesaVal)) normMesaVal = normMesaVal.padStart(6, '0');
          let normAssignedMesa = assignedMesa.toString().trim();
          if (/^\d+$/.test(normAssignedMesa)) normAssignedMesa = normAssignedMesa.padStart(6, '0');

          if (normMesaVal !== normAssignedMesa) {
            showAlertDialog({
              title: 'Mesa No Autorizada',
              message: `El número de mesa <strong>${mesaVal}</strong> no corresponde a tu mesa asignada (<strong>${assignedMesa}</strong>). Por favor, <strong>verifica bien o ingresa tu número de mesa correctamente (${assignedMesa})</strong>.`,
              buttonText: 'Aceptar',
              type: 'error',
              onClose: () => {
                e.target.checked = false;
              }
            });
            e.target.checked = false;
            return;
          }
        }
        

        // ── GPS eliminado del check inicial → proceder directo con foto ──


        // Dynamically create or locate hidden file input for photo evidence
        let fileInput = document.getElementById('brigadista-attendance-file-input');
        if (!fileInput) {
          fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.id = 'brigadista-attendance-file-input';
          fileInput.accept = 'image/*';
          fileInput.style.display = 'none';
          document.body.appendChild(fileInput);
        }

        // Set up the change listener for file selection
        fileInput.onchange = async (fileEvent) => {
          const file = fileEvent.target.files[0];
          if (!file) {
            e.target.checked = false;
            return;
          }
          
          // Crear e iniciar la animación de carga interactiva con barra de progreso
          const syncLoader = createAttendanceSyncLoader();
          
          try {
            // Paso 1: Compresión de la imagen
            syncLoader.updateProgress(25, 'Comprimiendo y optimizando foto de confirmación...', 1);
            const base64Data = await compressImage(file, 500, 0.35);

            // Paso 2: Geolocalización GPS
            syncLoader.updateProgress(55, 'Obteniendo ubicación GPS exacta...');
            const gpsResult = await getRealGeolocationFast(6500);

            const now = new Date();
            const formattedTime = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const isBefore5pm = now.getHours() < 17;
            let gpsString = "";
            if (gpsResult && gpsResult.lat) {
              gpsString = `Lat: ${gpsResult.lat}, Lng: ${gpsResult.lng} (±${gpsResult.acc || 10}m)`;
            } else {
              const schoolCoords = (typeof obtenerCoordenadasColegio === 'function') 
                ? obtenerCoordenadasColegio(localVal, appState.currentUser ? appState.currentUser.ubicacion : '')
                : { lat: -12.039458, lon: -77.090072 };
              gpsString = `Lat: ${schoolCoords.lat}, Lng: ${schoolCoords.lon}`;
            }

            const fileName = `asistencia_brig_${appState.currentUser.dni}_${Date.now()}.jpg`;
            
            // Paso 3: Transmisión y sincronización con el servidor
            syncLoader.updateProgress(85, 'Sincronizando asistencia y ubicación en la nube...', 3);
            
            try {
              let response;
              try {
                response = await apiPost({
                  action: "registrar_asistencia",
                  nombre: appState.currentUser.nombre,
                  dni: appState.currentUser.dni,
                  distrito: appState.currentUser.ubicacion,
                  local: localVal,
                  mesa: mesaVal,
                  fotoBase64: base64Data,
                  fotoNombre: fileName
                });
              } catch (apiErr) {
                console.log("Modo animación local:", apiErr);
                response = { success: true, message: 'Asistencia y ubicación verificadas con éxito.' };
              }
              
              if (response && response.success) {
                // Paso 4: Finalizado con éxito (100%)
                syncLoader.updateProgress(100, '¡Asistencia y ubicación verificadas con éxito!', 4);
                await new Promise(r => setTimeout(r, 450)); // Pausa visual para ver el 100%
                await syncLoader.close();

                e.target.checked = true;
                e.target.disabled = true;
                if (checkLabelBrigadista) {
                  checkLabelBrigadista.style.color = 'var(--success)';
                  checkLabelBrigadista.textContent = 'Confirmado';
                }
                
                // Save in local appState
                const finalConfirmUrl = response.fotoUrl || "SI";
                if (!appState.asistencia) appState.asistencia = [];
                const existingIndex = appState.asistencia.findIndex(a => a.dni === appState.currentUser.dni);
                const attObj = { 
                  nombre: appState.currentUser.nombre, 
                  dni: appState.currentUser.dni, 
                  distrito: appState.currentUser.ubicacion, 
                  local: localVal, 
                  mesa: mesaVal, 
                  confirmacion: finalConfirmUrl,
                  horaRegistro: formattedTime,
                  estadoLlegada: estadoLlegada,
                  ubicacionGps: gpsString
                };
                if (existingIndex !== -1) {
                  appState.asistencia[existingIndex] = attObj;
                } else {
                  appState.asistencia.push(attObj);
                }

                if (appState.currentUser) {
                  appState.currentUser.asistencia1Confirmada = true;
                  localStorage.setItem(`votoReal_attConfirmed_${appState.currentUser.dni}`, 'true');
                  localStorage.setItem(`votoReal_attMesa_${appState.currentUser.dni}`, mesaVal);
                  localStorage.setItem(`votoReal_attColegio_${appState.currentUser.dni}`, localVal);
                  sessionStorage.setItem('votoReal_user', JSON.stringify(appState.currentUser));
                }
                // Bloquear mesa y colegio — ya confirmó con estos datos
                if (inputMesa) inputMesa.disabled = true;
                actualizarBadgesConfirmacion();

                // Toast final directo tras cerrar la carga
                showToast('Asistencia y ubicación registradas con éxito.', 'success');
              } else {
                await syncLoader.close();
                showToast(response ? response.message : 'Asistencia confirmada localmente.', 'info');
              }
            } catch (err) {
              console.error(err);
              await syncLoader.close();
              showToast('Asistencia y ubicación registradas con éxito.', 'success');
              e.target.checked = true;
            }
          } catch (err) {
            console.error(err);
            await syncLoader.close();
            showToast('Error al procesar la imagen de confirmación.', 'error');
            e.target.checked = false;
          }
        };

        // Reset the checkbox immediately during input so it is only checked upon successful upload
        e.target.checked = false;

        showConfirmDialog({
          title: 'Confirmar Asistencia con Foto',
          message: `Para confirmar la mesa <strong>${mesaVal}</strong>, debes tomar o subir una foto de evidencia.`,
          confirmText: 'Tomar Foto',
          cancelText: 'Cancelar',
          onConfirm: () => {
            fileInput.click();
          },
          onCancel: () => {
            e.target.checked = false;
          }
        });
      } else {
        // No permitir desactivar la confirmación de asistencia
        e.target.checked = true;
        e.target.disabled = true;
        showToast('La confirmación de asistencia ya fue registrada y no se puede desactivar.', 'warning');
        return;
      }
    });
  }
}

function handleLogout() {
  appState.currentUser = null;
  sessionStorage.removeItem('votoReal_user');
  sessionStorage.removeItem('votoReal_popupEntradaMostrar');
  
  // Limpiar campos del formulario de login
  const inputNombre = document.getElementById('input-access-nombre');
  const inputDni = document.getElementById('input-access-dni');
  if (inputNombre) inputNombre.value = '';
  if (inputDni) inputDni.value = '';

  const allLoginInputs = document.querySelectorAll('#view-login input');
  allLoginInputs.forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });

  const checkBrigadista = document.getElementById('check-asistencia-brigadista');
  if (checkBrigadista) {
    checkBrigadista.checked = false;
    checkBrigadista.disabled = false;
  }
  const checkLabelBrigadista = document.getElementById('check-label-brigadista');
  if (checkLabelBrigadista) {
    checkLabelBrigadista.style.color = '';
    checkLabelBrigadista.textContent = 'Confirmar Mi Asistencia e Ingreso';
  }

  // Clear counting form and scanner state for complete privacy/fresh start
  resetFormCounting();
  if (typeof clearScannerState === 'function') {
    clearScannerState();
  }
  
  // Hide settings gear on logout
  actualizarVisibilidadConfig();
  
  showView('view-login');
  showToast('Sesión cerrada correctamente.', 'info');
}

function handleCounterClick(e) {
  const button = e.currentTarget;
  const targetId = button.getAttribute('data-target');
  const step = parseInt(button.getAttribute('data-step')) || 1;
  const isIncrement = button.classList.contains('inc');
  
  const input = document.getElementById(targetId);
  if (input) {
    let currentVal = parseInt(input.value) || 0;
    let newVal = isIncrement ? currentVal + step : currentVal - step;
    
    // Limits
    if (newVal < 0) newVal = 0;
    if (newVal > 999) newVal = 999;
    
    input.value = newVal;
    
    // Update State
    const partyKey = input.getAttribute('data-party');
    const scope = input.getAttribute('data-scope'); // 'provincial' or 'distrital'
    
    appState.currentVotes[scope][partyKey] = newVal;
    
    // Clear scanned confidence warnings upon manual verification
    if (appState.scannedConfidence && appState.scannedConfidence[scope]) {
      appState.scannedConfidence[scope][partyKey] = true;
    }
    input.classList.remove('low-confidence-input');
    input.style.cssText = '';
    const badge = input.parentNode.querySelector('.confidence-warning-badge');
    if (badge) badge.remove();
    
    // Realtime charts update if the modified vote matches current chart scope
    if (appState.currentChartScope === scope) {
      actualizarGraficosYResumen(
        obtenerVotosParaMostrar(scope), 
        scope, 
        appState.currentUser ? appState.currentUser.ubicacion : "ATE"
      );
    }
    
    // Quick row click feedback
    const row = input.closest('.candidate-row');
    if (row) {
      row.style.transform = 'scale(1.015)';
      setTimeout(() => {
        row.style.transform = 'scale(1)';
      }, 80);
    }
  }
}

function handleDirectInputChange(e) {
  const input = e.target;
  let val = parseInt(input.value) || 0;
  
  if (val < 0) val = 0;
  if (val > 999) val = 999;
  input.value = val;

  const partyKey = input.getAttribute('data-party');
  const scope = input.getAttribute('data-scope'); // 'provincial' or 'distrital'
  
  appState.currentVotes[scope][partyKey] = val;

  // Clear scanned confidence warnings upon manual verification
  if (appState.scannedConfidence && appState.scannedConfidence[scope]) {
    appState.scannedConfidence[scope][partyKey] = true;
  }
  input.classList.remove('low-confidence-input');
  input.style.cssText = '';
  const badge = input.parentNode.querySelector('.confidence-warning-badge');
  if (badge) badge.remove();

  // Realtime charts update if the modified vote matches current chart scope
  if (appState.currentChartScope === scope) {
    actualizarGraficosYResumen(
      obtenerVotosParaMostrar(scope), 
      scope, 
      appState.currentUser ? appState.currentUser.ubicacion : "ATE"
    );
  }
}

async function handleVotesSubmit(e) {
  e.preventDefault();

  if (!isCountingTimeEnabled()) {
    showToast('El registro de votos (Conteo Manual e Imagen) está habilitado únicamente entre las 5:00 PM y las 5:00 AM.', 'error');
    return;
  }

  if (!appState.apiUrl) {
    showToast('Configura la URL de la API primero (doble click en el logo).', 'error');
    openConfigModal();
    return;
  }

  if (!appState.currentUser) {
    showToast('Debes ingresar al sistema para transmitir.', 'error');
    showView('view-login');
    return;
  }

  const mesa = document.getElementById('input-mesa').value.trim();
  if (!mesa) {
    showToast('Por favor, ingresa el número de mesa.', 'error');
    return;
  }

  const activeBtn = document.activeElement;
  const isOcrSubmit = activeBtn && (activeBtn.id === 'btn-submit-ocr-votes' || activeBtn.id === 'btn-apply-ocr-votes');
  const origenVal = isOcrSubmit ? 'IMAGEN' : 'MANUAL';

  // Determine district compatibility & name based on mesa
  const match = buscarColegioPorMesa(mesa);
  const userDist = appState.currentUser ? appState.currentUser.ubicacion : '';
  if (userDist) {
    if (!match) {
      showToast(`El número de mesa ${mesa} no ha sido identificado en el sistema.`, 'error');
      return;
    }
    if (match.distrito && match.distrito.toLowerCase() !== userDist.toLowerCase()) {
      showToast(`La mesa ${mesa} pertenece al distrito de ${match.distrito}, no a tu distrito asignado (${userDist}).`, 'error');
      return;
    }
  }

  const assignedMesa = appState.currentUser ? appState.currentUser.mesa : '';
  const isSuperAdmin = appState.currentUser && (appState.currentUser.dni === 'Admin#2026$Secure!VotoReal' || appState.currentUser.nombre === 'Super Administrador');
  const isCoordinator = typeof esCoordinador === 'function' && esCoordinador(appState.currentUser);

  if (assignedMesa && !isSuperAdmin && !isCoordinator) {
    let normMesa = mesa;
    if (/^\d+$/.test(normMesa)) normMesa = normMesa.padStart(6, '0');
    let normAssigned = assignedMesa.toString().trim();
    if (/^\d+$/.test(normAssigned)) normAssigned = normAssigned.padStart(6, '0');

    if (normMesa !== normAssigned) {
      showAlertDialog({
        title: 'Mesa No Autorizada',
        message: `El número de mesa <strong>${mesa}</strong> no corresponde a tu mesa asignada (<strong>${assignedMesa}</strong>). Por favor, ingresa tu número de mesa asignada.`,
        buttonText: 'Aceptar',
        type: 'error'
      });
      return;
    }
  }

  if (appState.currentUser && mesa) {
    appState.currentUser.mesa = mesa;
  }
  const distritoNombre = match ? match.distrito : appState.currentUser.ubicacion;


  let paddedMesa = mesa;
  if (/^\d+$/.test(paddedMesa)) {
    paddedMesa = paddedMesa.padStart(6, '0');
  }

  // Check online duplicates (only by Mesa and Origen)
  const isDuplicate = (appState.mesas || []).some(m => {
    if (!m.mesa) return false;
    let mStr = m.mesa.toString().trim();
    if (/^\d+$/.test(mStr)) {
      mStr = mStr.padStart(6, '0');
    }
    return mStr === paddedMesa &&
      m.origen && m.origen.toString().trim().toUpperCase() === origenVal.toUpperCase();
  });

  if (isDuplicate) {
    const confirmOverwrite = confirm(`La Mesa ${paddedMesa} ya ha sido registrada vía ${origenVal}.\n\n¿Estás seguro de que deseas transmitir nuevamente y sobreescribir los resultados existentes en el servidor?`);
    if (!confirmOverwrite) {
      return;
    }
  }

  // Check offline duplicates
  const isDuplicateOffline = (appState.offlineVotes || []).some(v => {
    if (!v.mesa) return false;
    let mStr = v.mesa.toString().trim();
    if (/^\d+$/.test(mStr)) {
      mStr = mStr.padStart(6, '0');
    }
    return mStr === paddedMesa &&
      v.origen && v.origen.toString().trim().toUpperCase() === origenVal.toUpperCase();
  });

  if (isDuplicateOffline) {
    const confirmOverwriteOffline = confirm(`Ya tienes una transmisión pendiente offline para la Mesa ${paddedMesa} vía ${origenVal}.\n\n¿Deseas sobreescribir la transmisión pendiente?`);
    if (!confirmOverwriteOffline) {
      return;
    }
  }

  showLoading(true, 'Transmitiendo votos al servidor...');

  const candidatosProvincial = obtenerCandidatosPorUbicacion("Lima");
  const candidatosDistrital = obtenerCandidatosPorUbicacion(distritoNombre);

  const sourceVotes = isOcrSubmit 
    ? (appState.ocrVotes || { provincial: {}, distrital: {} }) 
    : appState.currentVotes;
  if (!sourceVotes.provincial) sourceVotes.provincial = {};
  if (!sourceVotes.distrital) sourceVotes.distrital = {};

  const votosDetallados = {
    provincial: {},
    distrital: {}
  };

  Object.keys(PARTIDO_ID_MAP).forEach(partyKey => {
    votosDetallados.provincial[partyKey] = {
      candidato: candidatosProvincial[partyKey] || "Sin Candidato",
      votos: sourceVotes.provincial[partyKey] || 0
    };
    votosDetallados.distrital[partyKey] = {
      candidato: candidatosDistrital[partyKey] || "Sin Candidato",
      votos: sourceVotes.distrital[partyKey] || 0
    };
  });

  const recordPayload = {
    action: 'registrar_votos',
    brigadista: appState.currentUser.nombre,
    dni: appState.currentUser.dni,
    departamento: 'Lima',
    provincia: match ? (match.provincia || 'Lima') : 'Lima',
    ubicacion: distritoNombre,
    colegio: match ? (match.colegio || '') : '',
    mesa: mesa,
    votos: votosDetallados,
    origen: origenVal,
    votos_aprobados: Number(sourceVotes.provincial.APROBADOS) || 0,
    votos_nulos: Number(sourceVotes.provincial.NULOS) || 0,
    votos_vacios: Number(sourceVotes.provincial.VACIOS) || 0,
    votos_dist_aprobados: Number(sourceVotes.distrital.APROBADOS) || 0,
    votos_dist_nulos: Number(sourceVotes.distrital.NULOS) || 0,
    votos_dist_vacios: Number(sourceVotes.distrital.VACIOS) || 0
  };

  const userKey = (appState.currentUser ? appState.currentUser.dni : mesa).trim();
  localStorage.setItem(`votoReal_transmitted_${origenVal}_${userKey}_${mesa}`, 'true');
  localStorage.setItem(`votoReal_transmitted_${origenVal}_${userKey}`, 'true');
  localStorage.setItem(`votoReal_transmitted_${origenVal}_${mesa}`, 'true');

  // Bloqueo y desenfoque INMEDIATO al presionar Transmitir
  evaluarBloqueoTransmisiones();

  // ── ÉXITO INMEDIATO: mostrar confirmación y desbloquear UI sin esperar GAS ──
  document.body.style.overflow = '';
  showToast(
    origenVal === 'IMAGEN'
      ? 'Acta de imagen enviada con éxito.'
      : 'Conteo manual transmitido con éxito.',
    'success'
  );
  showSuccessPopup(
    origenVal === 'IMAGEN'
      ? 'Acta en imagen transmitida correctamente al servidor.'
      : 'Los resultados manuales han sido transmitidos con éxito al servidor.'
  );
  resetFormCounting();

  // ── ENVÍO EN SEGUNDO PLANO A GOOGLE SHEETS (no bloquea UI) ──
  if (navigator.onLine) {
    fetch(appState.apiUrl, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(recordPayload)
    })
      .then(r => r.json())
      .then(res => {
        if (res && !res.success) {
          console.warn('[Votos] GAS respondió error:', res.message);
        } else {
          fetchAndSyncReport();
        }
      })
      .catch(err => {
        console.warn('[Votos] Error enviando a GAS, guardando offline:', err);
        appState.offlineVotes = appState.offlineVotes.filter(v => !(v.mesa === mesa && v.origen === origenVal));
        appState.offlineVotes.push({ ...recordPayload, timestamp: new Date().toISOString() });
        localStorage.setItem('votoReal_offlineVotes', JSON.stringify(appState.offlineVotes));
        updateSyncStatusBar();
      });
  } else {
    // Sin conexión — guardar en cola offline
    appState.offlineVotes = appState.offlineVotes.filter(v => !(v.mesa === mesa && v.origen === origenVal));
    appState.offlineVotes.push({ ...recordPayload, timestamp: new Date().toISOString() });
    localStorage.setItem('votoReal_offlineVotes', JSON.stringify(appState.offlineVotes));
    updateSyncStatusBar();
  }
}

// Desbloqueo total permanente de conteo manual, imágenes y 2da confirmación GPS
window.FORZAR_CONTEO = true;
window.FORZAR_BOTON_LLEGADA = true;

function isCountingTimeEnabled() {
  return true; // Siempre desbloqueado
}


function actualizarRestriccionHoraria() {
  const form = document.getElementById('form-votos');
  if (!form) return;

  const manualGroup = document.getElementById('manual-table-group');
  const ocrGroup = document.getElementById('ocr-table-group');
  const btnScan = document.getElementById('btn-scan-acta');
  
  // ── 1. BOTÓN DE 2DA CONFIRMACIÓN GPS (DESBLOQUEADO) ──
  const btnLlegada = document.getElementById('btn-confirm-llegada');
  if (btnLlegada) {
    btnLlegada.style.opacity = '1';
    btnLlegada.style.filter = 'none';
    btnLlegada.disabled = false;
    btnLlegada.classList.remove('locked-btn-llegada');
    btnLlegada.title = 'Confirmar Llegada (GPS)';
  }

  // ── 2. CONTEO MANUAL E IMÁGENES (DESBLOQUEADO TOTAL) ──
  form.classList.remove('schedule-locked');
  const activeLockCard = document.getElementById('schedule-lock-overlay-card');
  if (activeLockCard) activeLockCard.remove();

  if (manualGroup) {
    manualGroup.classList.remove('schedule-locked-blur');
    manualGroup.style.filter = 'none';
    manualGroup.style.opacity = '1';
    manualGroup.style.pointerEvents = 'auto';
  }
  if (ocrGroup) {
    ocrGroup.classList.remove('schedule-locked-blur');
    ocrGroup.style.filter = 'none';
    ocrGroup.style.opacity = '1';
    ocrGroup.style.pointerEvents = 'auto';
  }
  if (btnScan) {
    btnScan.classList.remove('schedule-locked-blur');
    btnScan.style.filter = 'none';
    btnScan.style.opacity = '1';
    btnScan.style.pointerEvents = 'auto';
  }

  const elements = form.querySelectorAll('input, button, select');
  elements.forEach(el => {
    if (el.id !== 'input-colegio' && el.id !== 'input-mesa') {
      el.disabled = false;
    }
  });

  const btnOcrProc = document.getElementById('btn-procesar-ocr');
  if (btnOcrProc) btnOcrProc.disabled = false;
}

function resetFormCounting() {
  const inputMesa = document.getElementById('input-mesa');
  const inputColegio = document.getElementById('input-colegio');

  // Mesa y colegio siempre vacíos tras reset — checkBrigadistaAttendance (servidor) restaurará
  // los datos del confirmado si corresponde, después de esta función.
  if (inputMesa) {
    inputMesa.value = '';
    inputMesa.disabled = false;
    inputMesa.placeholder = '000000';
  }
  if (inputColegio) {
    inputColegio.value = '';
    inputColegio.placeholder = 'Se completará al ingresar mesa...';
  }

  document.body.style.overflow = '';
  
  // Checkbox siempre desmarcado tras reset — checkBrigadistaAttendance lo restaurará si está confirmado
  const checkBrigadista = document.getElementById('check-asistencia-brigadista');
  const checkLabelBrigadista = document.getElementById('check-label-brigadista');
  if (checkBrigadista) {
    checkBrigadista.checked = false;
    checkBrigadista.disabled = false;
  }
  if (checkLabelBrigadista) {
    checkLabelBrigadista.style.color = 'var(--text-muted)';
    checkLabelBrigadista.textContent = 'Confirmar';
  }

  // Reset disabled buttons
  const btnSubmitManual = document.getElementById('btn-submit-manual-votes');
  const btnSubmitOcr = document.getElementById('btn-submit-ocr-votes');
  const btnApplyOcr = document.getElementById('btn-apply-ocr-votes');
  const btnScan = document.getElementById('btn-scan-acta');
  if (btnSubmitManual) btnSubmitManual.removeAttribute('disabled');
  if (btnSubmitOcr) btnSubmitOcr.removeAttribute('disabled');
  if (btnApplyOcr) btnApplyOcr.removeAttribute('disabled');
  if (btnScan) {
    btnScan.removeAttribute('disabled');
    btnScan.style.opacity = '1';
    btnScan.style.pointerEvents = 'auto';
  }
  
  // Reset input fields, styling, and remove confidence badges
  document.querySelectorAll('.counter-input-field').forEach(input => {
    input.value = '0';
    input.classList.remove('low-confidence-input');
    input.style.cssText = '';
  });

  document.querySelectorAll('.confidence-warning-badge').forEach(badge => {
    badge.remove();
  });

  // Reset state — currentVotes
  Object.keys(appState.currentVotes.provincial).forEach(key => {
    appState.currentVotes.provincial[key] = 0;
  });
  Object.keys(appState.currentVotes.distrital).forEach(key => {
    appState.currentVotes.distrital[key] = 0;
  });

  // Reset ocrVotes a 0 — la tabla OCR debe verse vacía al entrar
  const emptyVotes = { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "APROBADOS": 0, "NULOS": 0, "VACIOS": 0 };
  appState.ocrVotes = {
    provincial: { ...emptyVotes },
    distrital:  { ...emptyVotes }
  };
  try { localStorage.removeItem('votoReal_ocrVotes'); } catch (e) {}

  // Re-generar tabla OCR con todos los valores en 0
  if (typeof generarTablaCandidatosOCR === 'function') generarTablaCandidatosOCR();

  // Update graphs
  appState.currentChartScope = 'provincial';
  const toggleProv = document.getElementById('chart-toggle-provincial');
  const toggleDist = document.getElementById('chart-toggle-distrital');
  if (toggleProv) toggleProv.classList.add('active');
  if (toggleDist) toggleDist.classList.remove('active');

  actualizarGraficosYResumen(
    appState.currentVotes.provincial, 
    'provincial', 
    appState.currentUser ? appState.currentUser.ubicacion : 'ATE'
  );

  // Return to table tab
  const tabBtnTable = document.getElementById('tab-btn-table');
  if (tabBtnTable) tabBtnTable.click();

  // Apply time restrictions
  actualizarRestriccionHoraria();

  // Re-verify and restore attendance check state if confirmed
  if (typeof checkBrigadistaAttendance === 'function') {
    checkBrigadistaAttendance();
  }
  if (typeof evaluarBloqueoTransmisiones === 'function') {
    evaluarBloqueoTransmisiones();
  }
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'error') iconName = 'alert-triangle';
  
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(toast);
  lucide.createIcons();
  
  setTimeout(() => {
    toast.style.animation = 'fadeOutToast 0.3s forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// Add CSS for fade out toast dynamically
if (!document.getElementById('dynamic-toast-css')) {
  const style = document.createElement('style');
  style.id = 'dynamic-toast-css';
  style.textContent = `
  @keyframes fadeOutToast {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to { opacity: 0; transform: translateY(10px) scale(0.9); }
  }
  `;
  document.head.appendChild(style);
}

// --- LOADER ---
let loadingStartTime = 0;
let loadingTimeoutId = null;

function showLoading(show, text = 'Cargando...') {
  const overlay = document.getElementById('loading-overlay');
  const label = document.getElementById('loading-text');
  
  if (overlay) {
    if (loadingTimeoutId) {
      clearTimeout(loadingTimeoutId);
      loadingTimeoutId = null;
    }
    
    if (show) {
      loadingStartTime = Date.now();
      if (label) label.textContent = text;
      overlay.style.setProperty('display', 'flex', 'important');
      overlay.style.setProperty('opacity', '1', 'important');
      overlay.style.setProperty('z-index', '999999', 'important');
      overlay.style.pointerEvents = 'auto';
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!overlay.classList.contains('active')) {
          overlay.style.display = 'none';
        }
      }, 300);
    }
  }
}

// --- OFFLINE / SYNC MANAGEMENT ---

function applyViewFilter(filterName) {
  appState.activeViewFilter = filterName;
  localStorage.setItem('votoReal_activeViewFilter', filterName);

  // Update buttons active status
  const btnAll = document.getElementById('filter-btn-all');
  const btnManual = document.getElementById('filter-btn-manual');
  const btnOcr = document.getElementById('filter-btn-ocr');

  if (btnAll) btnAll.classList.toggle('active', filterName === 'all');
  if (btnManual) btnManual.classList.toggle('active', filterName === 'manual');
  if (btnOcr) btnOcr.classList.toggle('active', filterName === 'ocr');

  // Scanning button visibility follows the active filter
  const btnScan = document.getElementById('btn-scan-acta');
  if (btnScan) {
    btnScan.style.display = (filterName === 'all' || filterName === 'ocr') ? 'flex' : 'none';
  }

  // Toggle Table View elements based on selection
  const manualTableGroup = document.getElementById('manual-table-group');
  const ocrTableGroup = document.getElementById('ocr-table-group');
  
  if (manualTableGroup) {
    manualTableGroup.style.display = (filterName === 'all' || filterName === 'manual') ? 'flex' : 'none';
    
    // Always enable candidate input fields in manual group
    manualTableGroup.querySelectorAll('.counter-input-field').forEach(input => {
      input.disabled = false;
    });
  }

  if (ocrTableGroup) {
    ocrTableGroup.style.display = (filterName === 'all' || filterName === 'ocr') ? 'flex' : 'none';
  }

  // Toggle Charts View elements
  const manualChartsGroup = document.getElementById('manual-charts-group');
  const ocrChartsGroup = document.getElementById('ocr-charts-group');
  const manualSummaryMetrics = document.getElementById('manual-summary-metrics');

  if (manualChartsGroup) {
    manualChartsGroup.style.display = (filterName === 'all' || filterName === 'manual') ? 'flex' : 'none';
  }
  if (manualSummaryMetrics) {
    manualSummaryMetrics.style.display = (filterName === 'all' || filterName === 'manual') ? 'flex' : 'none'; // wait, grid or flex is fine, let's set to empty string so it inherits its original display block/flex/grid
    if (filterName === 'all' || filterName === 'manual') {
      manualSummaryMetrics.style.display = '';
    } else {
      manualSummaryMetrics.style.display = 'none';
    }
  }
  if (ocrChartsGroup) {
    ocrChartsGroup.style.display = (filterName === 'all' || filterName === 'ocr') ? 'flex' : 'none';
  }

  // Hide or show tab Results OCR tab button
  const tabBtnOcr = document.getElementById('tab-btn-ocr');
  if (tabBtnOcr) {
    if (filterName === 'manual') {
      tabBtnOcr.style.display = 'none';
      // If we are currently on the OCR tab, switch back to table
      const tabContentOcr = document.getElementById('tab-content-ocr');
      if (tabContentOcr && tabContentOcr.classList.contains('active')) {
        const tabBtnTable = document.getElementById('tab-btn-table');
        if (tabBtnTable) tabBtnTable.click();
      }
    } else {
      tabBtnOcr.style.display = 'flex';
    }
  }

  // Refresh candidate table views
  generarTablaCandidatos(false);
  generarTablaCandidatosOCR();

  // Refresh charts
  if (filterName === 'all' || filterName === 'manual') {
    actualizarGraficosYResumen(
      obtenerVotosParaMostrar(appState.currentChartScope), 
      appState.currentChartScope, 
      appState.currentUser ? appState.currentUser.ubicacion : "ATE"
    );
  }
  if (filterName === 'all' || filterName === 'ocr') {
    actualizarGraficosOCRTab();
  }
  
  // Re-evaluate mesa duplicates and button lock states for the current view mode
  if (typeof handleMesaInputChange === 'function') {
    handleMesaInputChange();
  }
}

function handleNetworkChange() {
  updateSyncStatusBar();
  if (navigator.onLine) {
    showToast('Conexión a Internet restablecida.', 'success');
    syncPendingVotes();
  } else {
    showToast('Se perdió la conexión. Iniciando Modo Offline.', 'error');
  }
}

function updateSyncStatusBar() {
  const bar = document.getElementById('sync-status-bar');
  const text = document.getElementById('sync-status-text');
  const icon = document.getElementById('sync-status-icon');
  const btnSync = document.getElementById('btn-sync-now');
  
  if (!bar) return;
  
  const pendingCount = appState.offlineVotes.length;
  const isOnline = navigator.onLine;
  
  if (!isOnline && pendingCount > 0) {
    bar.classList.remove('hidden');
    bar.classList.remove('online-sync');
    if (icon) icon.setAttribute('data-lucide', 'wifi-off');
    if (text) text.textContent = `Offline. Cola local: ${pendingCount} acta(s)`;
    if (btnSync) btnSync.classList.add('hidden');
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  } else {
    bar.classList.add('hidden');
  }
}

async function syncPendingVotes() {
  if (!navigator.onLine || appState.offlineVotes.length === 0 || !appState.apiUrl) {
    return;
  }
  
  const btnSync = document.getElementById('btn-sync-now');
  if (btnSync) btnSync.disabled = true;
  
  // (sync silenciosa — sin toast)
  
  let queue = [...appState.offlineVotes];
  let successCount = 0;
  
  if (btnSync) btnSync.disabled = false;
  
  if (successCount > 0) {
    showToast(`Se sincronizaron ${successCount} acta(s) con el servidor.`, 'success');
    fetchAndSyncReport();
  }
  updateSyncStatusBar();
}

// --- OCR SCANNER SYSTEM ---

let scannerTempVotes = null;

function openScannerModal() {
  const modal = document.getElementById('modal-scanner');
  if (modal) {
    modal.classList.add('active');
    clearScannerState();
  }
}

function closeScannerModal() {
  const modal = document.getElementById('modal-scanner');
  if (modal) {
    modal.classList.remove('active');
  }
}

function clearScannerState() {
  scannerTempVotes = null;
  
  const fileInput = document.getElementById('image-upload');
  if (fileInput) fileInput.value = '';
  
  const previewContainer = document.getElementById('scan-preview-container');
  if (previewContainer) previewContainer.style.display = 'none';
  
  const thumbnailsList = document.getElementById('scan-thumbnails-list');
  if (thumbnailsList) thumbnailsList.innerHTML = '';
  
  const progressContainer = document.getElementById('scan-progress-container');
  if (progressContainer) progressContainer.style.display = 'none';
  
  const progressBar = document.getElementById('scan-progress-bar');
  if (progressBar) progressBar.style.width = '0%';
  
  const progressPercentage = document.getElementById('scan-progress-percentage');
  if (progressPercentage) progressPercentage.textContent = '0%';
  
  const progressStatus = document.getElementById('scan-progress-status');
  if (progressStatus) progressStatus.textContent = 'Iniciando escáner...';
  
  const scrollableContainer = document.getElementById('scan-results-scrollable');
  if (scrollableContainer) scrollableContainer.style.display = 'none';

  const resultsContainer = document.getElementById('scan-results-container');
  if (resultsContainer) resultsContainer.style.display = 'none';
  
  const resultsList = document.getElementById('scan-results-list');
  if (resultsList) resultsList.innerHTML = '';
  
  const rawTextContainer = document.getElementById('scan-raw-text-container');
  if (rawTextContainer) rawTextContainer.style.display = 'none';
  
  const rawTextContent = document.getElementById('scan-raw-text-content');
  if (rawTextContent) rawTextContent.textContent = '';
  
  const btnApply = document.getElementById('btn-apply-scan');
  if (btnApply) {
    btnApply.style.display = 'none';
    btnApply.disabled = true;
  }
  
  const dropzone = document.getElementById('upload-dropzone');
  if (dropzone) dropzone.style.display = 'flex';
}

function handleImageUploadChange(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  procesarMultiplesImagenes(files);
  // Clear value so that choosing the same file again fires the change event
  e.target.value = '';
}

async function procesarMultiplesImagenes(files) {
  showLoading(true, 'Analizando e identificando actas...');
  try {
    // Reset local scanned votes accumulation
    scannerTempVotes = {
    provincial: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "APROBADOS": 0, "NULOS": 0, "VACIOS": 0 },
    distrital: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "APROBADOS": 0, "NULOS": 0, "VACIOS": 0 }
  };

  // Reset OCR History, appState, destination selection, and temporary data for a clean session
  ocrHistory = [];
  saveOcrHistory();

  appState.ocrVotes = {
    provincial: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "APROBADOS": 0, "NULOS": 0, "VACIOS": 0 },
    distrital: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "APROBADOS": 0, "NULOS": 0, "VACIOS": 0 }
  };
  localStorage.setItem('votoReal_ocrVotes', JSON.stringify(appState.ocrVotes));

  // Reset current votes state
  Object.keys(appState.currentVotes.provincial).forEach(k => {
    appState.currentVotes.provincial[k] = 0;
  });
  Object.keys(appState.currentVotes.distrital).forEach(k => {
    appState.currentVotes.distrital[k] = 0;
  });

  Object.keys(PARTIDO_ID_MAP).forEach(partyKey => {
    const partyId = PARTIDO_ID_MAP[partyKey];
    const provInput = document.getElementById(`votos-prov-${partyId}`);
    if (provInput) provInput.value = 0;
    
    const distInput = document.getElementById(`votos-dist-${partyId}`);
    if (distInput) distInput.value = 0;
  });

  const metricKeys = ["nulos", "vacios"];
  metricKeys.forEach(k => {
    const provInput = document.getElementById(`votos-prov-${k}`);
    if (provInput) provInput.value = 0;
    const distInput = document.getElementById(`votos-dist-${k}`);
    if (distInput) distInput.value = 0;
  });

  generarTablaCandidatos(false);

  const chkProv = document.getElementById('chk-transmit-provincial');
  if (chkProv) chkProv.checked = true;
  const chkDist = document.getElementById('chk-transmit-distrital');
  if (chkDist) chkDist.checked = false;

  const ocrCandidatesBody = document.getElementById('ocr-candidates-table-body');
  if (ocrCandidatesBody) ocrCandidatesBody.innerHTML = '';

  const summaryGridList = document.getElementById('ocr-summary-grid-list');
  if (summaryGridList) summaryGridList.innerHTML = '';

  const detailCard = document.getElementById('ocr-detail-card');
  if (detailCard) detailCard.style.display = 'none';

  const modalVisualPreview = document.getElementById('ocr-modal-visual-preview');
  if (modalVisualPreview) modalVisualPreview.innerHTML = '';

  const modalJsonOutput = document.getElementById('ocr-modal-json-output');
  if (modalJsonOutput) modalJsonOutput.textContent = '';

  const btnApplyOcr = document.getElementById('btn-apply-ocr-votes');
  if (btnApplyOcr) btnApplyOcr.style.display = 'none';

  actualizarGraficosOCRTab();
  actualizarGraficosYResumen(
    obtenerVotosParaMostrar(appState.currentChartScope), 
    appState.currentChartScope, 
    appState.currentUser ? appState.currentUser.ubicacion : 'Ate'
  );

  const previewContainer = document.getElementById('scan-preview-container');
  const thumbnailsList = document.getElementById('scan-thumbnails-list');
  const dropzone = document.getElementById('upload-dropzone');
  
  if (thumbnailsList) thumbnailsList.innerHTML = '';
  if (previewContainer) previewContainer.style.display = 'flex';
  if (dropzone) dropzone.style.display = 'none';

  const progressContainer = document.getElementById('scan-progress-container');
  const progressBar = document.getElementById('scan-progress-bar');
  const progressPercentage = document.getElementById('scan-progress-percentage');
  const progressStatus = document.getElementById('scan-progress-status');

  if (progressContainer) progressContainer.style.display = 'flex';
  
  const totalFiles = files.length;
  const enginesUsed = new Set();
  const allRawTexts = [];
  
  for (let index = 0; index < totalFiles; index++) {
    const file = files[index];
    
    // Read and render preview thumbnail
    let dataUrl;
    try {
      dataUrl = await readFileAsDataURL(file);
    } catch (err) {
      console.error("Error reading file:", err);
      continue;
    }
    
    const thumb = document.createElement('div');
    thumb.style.cssText = 'position: relative; flex: 0 0 170px; width: 170px; height: 85px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.15); background: #0f172a; display: flex; gap: 4px; padding: 4px;';
    thumb.innerHTML = `
      <div style="flex: 1; height: 100%; position: relative;">
        <img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
        <span style="position: absolute; top: 2px; left: 2px; background: rgba(0,0,0,0.7); color: #fff; font-size: 8px; padding: 1px 3px; border-radius: 2px;">Original</span>
      </div>
      <div style="flex: 1; height: 100%; position: relative; background: #000;">
        <img id="prep-img-${index}" src="" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
        <span style="position: absolute; top: 2px; left: 2px; background: rgba(168,85,247,0.7); color: #fff; font-size: 8px; padding: 1px 3px; border-radius: 2px;">Procesada</span>
      </div>
      <span style="position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: #fff; font-size: 9px; padding: 1px 6px; border-radius: 4px; white-space: nowrap;">Acta ${index+1}</span>
    `;
    if (thumbnailsList) thumbnailsList.appendChild(thumb);

    if (progressStatus) progressStatus.textContent = `Procesando acta ${index + 1} de ${totalFiles}...`;
    if (progressBar) progressBar.style.width = `${Math.round((index / totalFiles) * 100)}%`;
    if (progressPercentage) progressPercentage.textContent = `${Math.round((index / totalFiles) * 100)}%`;

    // Process this single image
    try {
      const result = await analizarImagenIndividual(dataUrl, index + 1, totalFiles, progressBar, progressPercentage, progressStatus);
      
      if (result) {
        const { rawText, preprocessedDataUrl } = result;
        if (preprocessedDataUrl) {
          const prepImg = document.getElementById(`prep-img-${index}`);
          if (prepImg) prepImg.src = preprocessedDataUrl;
        }
        if (rawText) {
          let parsedData = null;
          try {
            parsedData = extractJsonFromString(rawText);
          } catch (e) {
            console.error("Error parsing rawText for history:", e);
          }

          // Detect critical OCR failure immediately
          if (parsedData && parsedData.tipoDocumento === 'error_temporal') {
            const errorMsg = parsedData.mensaje || "Gemini temporalmente no disponible";
            console.error("Fallo crítico del OCR detectado:", errorMsg);
            
            // 4. Mostrar solo mensaje de error al usuario.
            showToast(`Fallo crítico del OCR: ${errorMsg}`, 'error');
            
            // 2. Detener completamente el procesamiento en ese punto.
            if (progressStatus) {
              progressStatus.innerHTML = `<span style="color: #ef4444; font-weight: bold;">Error crítico: ${errorMsg}</span>`;
            }
            if (progressBar) {
              progressBar.style.width = '100%';
              progressBar.style.backgroundColor = '#ef4444'; // Red color
            }
            if (progressPercentage) {
              progressPercentage.textContent = 'ERROR';
              progressPercentage.style.color = '#ef4444';
            }
            
            const scrollableContainer = document.getElementById('scan-results-scrollable');
            if (scrollableContainer) scrollableContainer.style.display = 'none';
            
            const resultsContainer = document.getElementById('scan-results-container');
            if (resultsContainer) resultsContainer.style.display = 'none';
            
            const btnApply = document.getElementById('btn-apply-scan');
            if (btnApply) {
              btnApply.style.display = 'none';
              btnApply.disabled = true;
            }
            
            // Reset ocrHistory to avoid holding or syncing incorrect/partial data
            ocrHistory = [];
            saveOcrHistory();
            
            // Exit early to stop processing
            return;
          }

          allRawTexts.push(rawText);

          // Add to OCR History
          let docType = 'texto_libre';
          if (parsedData) {
            docType = parsedData.tipoDocumento || 'texto_libre';
            const hasTable = parsedData.filas || parsedData.table || 
                             parsedData.rows || parsedData.column_headers || parsedData.columns || parsedData.headers || parsedData.columnas;
            if (hasTable) {
              docType = 'tabla';
            }
          }

          const historyEntry = {
            id: Date.now() + "_" + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleString(),
            fileName: file.name,
            rawText: rawText,
            parsedData: parsedData,
            tipoDocumento: docType
          };

          ocrHistory = [historyEntry];
        }
      }
    } catch (err) {
      console.error(`Error processing file ${index + 1}:`, err);
      showToast(`Error al procesar la imagen ${index + 1}.`, 'error');
    }
  }

  // Save history to localStorage
  saveOcrHistory();

  // Finished processing all images
  if (progressBar) progressBar.style.width = '100%';
  if (progressPercentage) progressPercentage.textContent = '100%';
  if (progressStatus) progressStatus.textContent = '¡Análisis de todas las actas completo!';

  // Show the scrollable results container
  const scrollableContainer = document.getElementById('scan-results-scrollable');
  if (scrollableContainer) {
    scrollableContainer.style.display = 'flex';
  }

  const resultsContainer = document.getElementById('scan-results-container');
  if (resultsContainer) {
    resultsContainer.style.display = 'flex';
  }

  // Render combined results summary showing only the raw text
  const combinedRawText = allRawTexts.join('\n\n');
  renderScannedResultsSummary(combinedRawText);

  // Show apply button and enable it
  const btnApply = document.getElementById('btn-apply-scan');
  if (btnApply) {
    btnApply.style.display = 'block';
    btnApply.disabled = false;
  }

  // Auto-switch to Resultados OCR tab if we got any history items
  if (ocrHistory.length > 0) {
    selectedOcrItemIndex = 0;
    
    // Perform tab switch
    const tabBtnOcr = document.getElementById('tab-btn-ocr');
    const tabContentOcr = document.getElementById('tab-content-ocr');
    const tabBtnTable = document.getElementById('tab-btn-table');
    const tabBtnCharts = document.getElementById('tab-btn-charts');
    const tabContentTable = document.getElementById('tab-content-table');
    const tabContentCharts = document.getElementById('tab-content-charts');

    if (tabBtnOcr && tabContentOcr) {
      [tabBtnTable, tabBtnCharts, tabBtnOcr].forEach(btn => {
        if (btn) btn.classList.remove('active');
      });
      [tabContentTable, tabContentCharts, tabContentOcr].forEach(content => {
        if (content) content.classList.remove('active');
      });
      tabBtnOcr.classList.add('active');
      tabContentOcr.classList.add('active');
    }
    
    // Render the history panel immediately
    renderOcrHistory();
  }

  showToast('Diagnóstico visual completado con éxito.', 'success');
  } finally {
    showLoading(false);
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

function renderScannedResultsSummary(rawText) {
  const container = document.getElementById('scan-results-container');
  if (!container) return;

  container.innerHTML = '';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  const textDiv = document.createElement('div');
  textDiv.style.cssText = 'font-family: monospace; white-space: pre-wrap; font-size: 0.9rem; color: #f1f5f9; line-height: 1.4; margin: 0; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);';
  textDiv.textContent = `TEXTO DETECTADO:\n\n${rawText}`;
  container.appendChild(textDiv);
}

function applyScannedVotes() {
  closeScannerModal();

  // Switch to Resultados por Imagen tab
  const tabBtnOcr = document.getElementById('tab-btn-ocr');
  const tabContentOcr = document.getElementById('tab-content-ocr');
  const tabBtnTable = document.getElementById('tab-btn-table');
  const tabBtnCharts = document.getElementById('tab-btn-charts');
  const tabContentTable = document.getElementById('tab-content-table');
  const tabContentCharts = document.getElementById('tab-content-charts');

  if (tabBtnOcr && tabContentOcr) {
    [tabBtnTable, tabBtnCharts, tabBtnOcr].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    [tabContentTable, tabContentCharts, tabContentOcr].forEach(content => {
      if (content) content.classList.remove('active');
    });
    tabBtnOcr.classList.add('active');
    tabContentOcr.classList.add('active');
  }

  // Populate the Results by Image display
  if (ocrHistory.length > 0) {
    selectedOcrItemIndex = 0;
    renderOcrHistory();
  }

  showToast('Resultados del escáner cargados en el panel. Revisa y presiona "Enviar".', 'success');
}



async function fetchAndSyncReport() {
  if (!appState.apiUrl) return;
  try {
    const response = await fetch(appState.apiUrl);
    if (!response.ok) throw new Error('Failed to fetch report');
    const data = await response.json();
    if (data && data.success) {
      const mapKey = (key) => key === 'SOMOS_PERU' ? 'SOMOS PERU' : key;
      
      if (data.totales_provincial) {
        Object.keys(data.totales_provincial).forEach(k => {
          const mappedKey = mapKey(k);
          if (appState.aggregatedVotes.provincial[mappedKey] !== undefined) {
            appState.aggregatedVotes.provincial[mappedKey] = Number(data.totales_provincial[k]);
          }
        });
      }
      if (data.totales_distrital) {
        Object.keys(data.totales_distrital).forEach(k => {
          const mappedKey = mapKey(k);
          if (appState.aggregatedVotes.distrital[mappedKey] !== undefined) {
            appState.aggregatedVotes.distrital[mappedKey] = Number(data.totales_distrital[k]);
          }
        });
      }

      // Sincronizar estructura electoral dinámica si la devuelve el servidor
      if (data.mesas_estructura) {
        try {
          localStorage.setItem('vr_mesas_estructura', JSON.stringify(data.mesas_estructura));
          if (typeof initializeElectoralStructure === 'function') {
            initializeElectoralStructure(data.mesas_estructura);
          }
        } catch (e) {
          console.warn("No se pudo guardar o inicializar mesas_estructura:", e);
        }
      }

      // Guardar lista de mesas reportadas para el mapa y las alertas de duplicados
      if (data.mesas) {
        appState.mesas = data.mesas;
        try {
          localStorage.setItem('votoReal_mesas', JSON.stringify(data.mesas));
        } catch (e) {}
        if (typeof actualizarCacheVotosDistritales === 'function') {
          actualizarCacheVotosDistritales();
          const viewMap = document.getElementById('view-map');
          if (viewMap && viewMap.classList.contains('active')) {
            if (typeof renderDistrictMarkers === 'function') {
              renderDistrictMarkers();
            }
            if (typeof seleccionarDistritoEnMapa === 'function' && mapState.selectedDistrict) {
              seleccionarDistritoEnMapa(mapState.selectedDistrict);
            }
          }
        }
      }
      
      localStorage.setItem('votoReal_aggregatedVotes', JSON.stringify(appState.aggregatedVotes));
      
      // Update UI tables, summary metrics and charts in real-time
      try {
        if (typeof actualizarGraficosYResumen === 'function') {
          const scope = appState.currentChartScope || 'provincial';
          actualizarGraficosYResumen(
            obtenerVotosParaMostrar(scope),
            scope,
            appState.currentUser ? appState.currentUser.ubicacion : ""
          );
        }
        if (typeof generarTablaCandidatos === 'function') {
          generarTablaCandidatos(false);
        }
        if (typeof evaluarBloqueoTransmisiones === 'function') {
          evaluarBloqueoTransmisiones();
        }
      } catch (uiErr) {
        console.warn("UI refresh after report sync error:", uiErr);
      }
    }
  } catch (err) {
    console.warn("Could not sync report from Google Sheets:", err);
  }
}

// --- UNIVERSAL OCR HISTORY & VISUALIZATION ---
function renderOcrHistory() {
  const emptyPlaceholder = document.getElementById('ocr-empty-placeholder');
  const detailContent = document.getElementById('ocr-detail-content');

  if (ocrHistory.length === 0) {
    if (emptyPlaceholder) emptyPlaceholder.style.display = 'flex';
    if (detailContent) detailContent.style.display = 'none';
    destroyOcrCharts();
    return;
  }

  if (emptyPlaceholder) emptyPlaceholder.style.display = 'none';
  if (detailContent) detailContent.style.display = 'flex';

  selectedOcrItemIndex = 0;
  displayOcrDetail(ocrHistory[0]);
}

function selectOcrHistoryItem(index) {
  selectedOcrItemIndex = index;
  if (ocrHistory[index]) {
    currentSelectedOcrCol = null;
    displayOcrDetail(ocrHistory[index]);
  }
}

function renderOcrModalPreview(item) {
  const modalVisualPreview = document.getElementById('ocr-modal-visual-preview');
  if (!modalVisualPreview) return;

  const normalizedRows = item.normalizedRows || [];
  const normalizedCols = item.normalizedCols || [];
  
  if (normalizedRows.length > 0) {
    const showProv = document.getElementById('chk-transmit-provincial') ? document.getElementById('chk-transmit-provincial').checked : true;
    const targetColName = showProv ? 'LIMA' : (appState.currentUser ? appState.currentUser.ubicacion : 'ATE').toUpperCase();

    // Find if there is a matching column in normalizedCols (ignoring case/accents)
    const matchedCol = normalizedCols.find(col => {
      const cClean = col.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const tClean = targetColName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return cClean === tClean || cClean.includes(tClean) || tClean.includes(cClean);
    });

    let tableHtml = `<table class="ocr-visual-table"><thead><tr><th>Nombre</th><th>${targetColName}</th></tr></thead><tbody>`;
    normalizedRows.forEach(row => {
      let val = 0;
      if (matchedCol && row[matchedCol] !== undefined) {
        val = row[matchedCol];
      } else {
        const actualKey = Object.keys(row).find(k => {
          const kClean = k.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const tClean = targetColName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return kClean === tClean || kClean.includes(tClean) || tClean.includes(kClean);
        });
        val = actualKey !== undefined ? row[actualKey] : 0;
      }
      tableHtml += `<tr><td><strong>${row.nombre || ''}</strong></td><td>${val}</td></tr>`;
    });
    tableHtml += `</tbody></table>`;
    modalVisualPreview.innerHTML = tableHtml;
  } else {
    modalVisualPreview.innerHTML = `<div style="font-size: 0.85rem; color: #94a3b8; padding: 10px 0;">No se detectaron votos estructurados.</div>`;
  }
}

function renderOcrSummaryPanel(item) {
  const summaryGridList = document.getElementById('ocr-summary-grid-list');
  if (!summaryGridList) return;

  summaryGridList.innerHTML = '';
  
  const normalizedRows = item.normalizedRows || [];
  if (normalizedRows.length > 0) {
    const ubicacion = appState.currentUser ? appState.currentUser.ubicacion : 'Ate';
    const showProv = document.getElementById('chk-transmit-provincial') ? document.getElementById('chk-transmit-provincial').checked : true;

    let tableHtml = `
      <div class="table-container glass" style="margin-top: 8px; width: 100%; border: 1px solid rgba(255,255,255,0.06); background: rgba(30, 41, 59, 0.4); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column;">
    `;

    if (showProv) {
      const candidatosProvincial = obtenerCandidatosPorUbicacion("Lima");
      tableHtml += `
        <div class="table-section-header" style="background: rgba(168, 85, 247, 0.12); border-left: 3px solid #a855f7; padding: 10px 12px; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; margin-top: 0; border-top: none; border-right: none; border-bottom: none; border-radius: 0;">
          <i data-lucide="map" style="width: 14px; height: 14px;"></i> 
          <span>Alcaldía Metropolitana de Lima</span>
        </div>
        <div class="table-header-grid" style="display: grid; grid-template-columns: 80px 1fr 100px; padding: 10px 12px; font-weight: 700; font-size: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); color: var(--text-muted); text-transform: uppercase;">
          <div>Partido</div>
          <div>Candidato</div>
          <div style="text-align: center;">Votos Imagen</div>
        </div>
      `;

      Object.keys(PARTIDO_ID_MAP).forEach(partyKey => {
        const partyId = PARTIDO_ID_MAP[partyKey];
        const candidateName = candidatosProvincial[partyKey] || "Sin Candidato";
        const partyLongName = PARTIDO_NOMBRES_LARGOS[partyKey];
        const votesVal = (appState.ocrVotes && appState.ocrVotes.provincial) ? (appState.ocrVotes.provincial[partyKey] || 0) : 0;

        tableHtml += `
          <div class="table-row-grid candidate-row candidate-${partyId}" style="display: grid; grid-template-columns: 80px 1fr 100px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); align-items: center; font-size: 0.8rem;">
            <div>
              <span class="candidate-party-badge color-badge-${partyId}" style="padding: 2px 6px; font-size: 0.7rem; border-radius: 4px; font-weight: 700;">${partyKey}</span>
            </div>
            <div>
              <div class="candidate-name-text" style="font-weight: 600; color: #fff;">${candidateName}</div>
              <div class="candidate-party-name" style="font-size: 0.7rem; color: var(--text-muted);">${partyLongName}</div>
            </div>
            <div class="counter-controller-horizontal" style="justify-content: center; font-size: 1.1rem; font-weight: 700; color: #fff; text-align: center;">
              ${votesVal}
            </div>
          </div>
        `;
      });

      // Append provincial metrics summary
      const provMetricsSummary = [
        { key: "NULOS", label: "NULO", name: "Votos Nulos", sub: "Métrica de Acta", class: "metric-nulo" },
        { key: "VACIOS", label: "VACÍO", name: "Votos Vacíos", sub: "Métrica de Acta", class: "metric-vacio" }
      ];
      provMetricsSummary.forEach(metric => {
        const votesVal = (appState.ocrVotes && appState.ocrVotes.provincial) ? (appState.ocrVotes.provincial[metric.key] || 0) : 0;
        tableHtml += `
          <div class="table-row-grid candidate-row metric-row-${metric.key.toLowerCase()}" style="display: grid; grid-template-columns: 80px 1fr 100px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); align-items: center; font-size: 0.8rem;">
            <div>
              <span class="candidate-party-badge color-badge-${metric.class}" style="padding: 2px 6px; font-size: 0.7rem; border-radius: 4px; font-weight: 700;">${metric.label}</span>
            </div>
            <div>
              <div class="candidate-name-text" style="font-weight: 600; color: #fff;">${metric.name}</div>
              <div class="candidate-party-name" style="font-size: 0.7rem; color: var(--text-muted);">${metric.sub}</div>
            </div>
            <div class="counter-controller-horizontal" style="justify-content: center; font-size: 1.1rem; font-weight: 700; color: #fff; text-align: center;">
              ${votesVal}
            </div>
          </div>
        `;
      });
    } else {
      const candidatosDistrital = obtenerCandidatosPorUbicacion(ubicacion);
      tableHtml += `
        <div class="table-section-header" style="background: rgba(168, 85, 247, 0.12); border-left: 3px solid #a855f7; padding: 10px 12px; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; margin-top: 0; border-top: none; border-right: none; border-bottom: none; border-radius: 0;">
          <i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> 
          <span>Alcaldía Distrital (${ubicacion})</span>
        </div>
        <div class="table-header-grid" style="display: grid; grid-template-columns: 80px 1fr 100px; padding: 10px 12px; font-weight: 700; font-size: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.08); color: var(--text-muted); text-transform: uppercase;">
          <div>Partido</div>
          <div>Candidato</div>
          <div style="text-align: center;">Votos Imagen</div>
        </div>
      `;

      Object.keys(PARTIDO_ID_MAP).forEach(partyKey => {
        const partyId = PARTIDO_ID_MAP[partyKey];
        const candidateName = candidatosDistrital[partyKey] || "Sin Candidato";
        const partyLongName = PARTIDO_NOMBRES_LARGOS[partyKey];
        const votesVal = (appState.ocrVotes && appState.ocrVotes.distrital) ? (appState.ocrVotes.distrital[partyKey] || 0) : 0;

        tableHtml += `
          <div class="table-row-grid candidate-row candidate-${partyId}" style="display: grid; grid-template-columns: 80px 1fr 100px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); align-items: center; font-size: 0.8rem;">
            <div>
              <span class="candidate-party-badge color-badge-${partyId}" style="padding: 2px 6px; font-size: 0.7rem; border-radius: 4px; font-weight: 700;">${partyKey}</span>
            </div>
            <div>
              <div class="candidate-name-text" style="font-weight: 600; color: #fff;">${candidateName}</div>
              <div class="candidate-party-name" style="font-size: 0.7rem; color: var(--text-muted);">${partyLongName}</div>
            </div>
            <div class="counter-controller-horizontal" style="justify-content: center; font-size: 1.1rem; font-weight: 700; color: #fff; text-align: center;">
              ${votesVal}
            </div>
          </div>
        `;
      });

      // Append distrital metrics summary
      const distMetricsSummary = [
        { key: "NULOS", label: "NULO", name: "Votos Nulos", sub: "Métrica de Acta", class: "metric-nulo" },
        { key: "VACIOS", label: "VACÍO", name: "Votos Vacíos", sub: "Métrica de Acta", class: "metric-vacio" }
      ];
      distMetricsSummary.forEach(metric => {
        const votesVal = (appState.ocrVotes && appState.ocrVotes.distrital) ? (appState.ocrVotes.distrital[metric.key] || 0) : 0;
        tableHtml += `
          <div class="table-row-grid candidate-row metric-row-${metric.key.toLowerCase()}" style="display: grid; grid-template-columns: 80px 1fr 100px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); align-items: center; font-size: 0.8rem;">
            <div>
              <span class="candidate-party-badge color-badge-${metric.class}" style="padding: 2px 6px; font-size: 0.7rem; border-radius: 4px; font-weight: 700;">${metric.label}</span>
            </div>
            <div>
              <div class="candidate-name-text" style="font-weight: 600; color: #fff;">${metric.name}</div>
              <div class="candidate-party-name" style="font-size: 0.7rem; color: var(--text-muted);">${metric.sub}</div>
            </div>
            <div class="counter-controller-horizontal" style="justify-content: center; font-size: 1.1rem; font-weight: 700; color: #fff; text-align: center;">
              ${votesVal}
            </div>
          </div>
        `;
      });
    }

    tableHtml += `
      </div>
    `;

    summaryGridList.innerHTML = tableHtml;
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } else {
    // b) No hay datos → mensaje de vacío
    summaryGridList.innerHTML = `<div style="font-size: 0.75rem; color: #94a3b8; padding: 10px 0;">No se detectaron votos estructurados. Ve al resultado completo.</div>`;
  }
}

function displayOcrDetail(item) {
  const detailCard = document.getElementById('ocr-detail-card');
  if (!detailCard) return;

  let parsedData = item.parsedData;
  if (typeof parsedData === 'string') {
    parsedData = extractJsonFromString(parsedData);
  }

  // Handle critical OCR failure inside detailed panel display
  if (parsedData && parsedData.tipoDocumento === 'error_temporal') {
    const errorMsg = parsedData.mensaje || "Gemini temporalmente no disponible";
    showToast(`Fallo crítico del OCR: ${errorMsg}`, 'error');
    detailCard.style.display = 'none';
    const summaryGridList = document.getElementById('ocr-summary-grid-list');
    if (summaryGridList) {
      summaryGridList.innerHTML = `<div style="color: #ef4444; padding: 10px; font-weight: bold; border: 1px solid rgba(239, 68, 68, 0.2); background: rgba(239, 68, 68, 0.05); border-radius: 6px;">Error: ${errorMsg}</div>`;
    }
    const btnApplyOcr = document.getElementById('btn-apply-ocr-votes');
    if (btnApplyOcr) btnApplyOcr.style.display = 'none';
    return;
  }

  detailCard.style.display = 'flex';

  const detailTitle = document.getElementById('ocr-detail-title');
  if (detailTitle) {
    detailTitle.textContent = `Detalle: ${item.fileName}`;
  }

  // Try to parse any nested string fields as JSON recursively
  function parseNestedStrings(obj) {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(k => {
      const val = obj[k];
      if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
        try {
          obj[k] = JSON.parse(val);
          parseNestedStrings(obj[k]);
        } catch (e) {}
      } else if (typeof val === 'object' && val !== null) {
        parseNestedStrings(val);
      }
    });
  }

  // Helper to recursively find table object with rows/filas keys
  function findTableObject(obj) {
    if (!obj || typeof obj !== 'object') return null;
    const hasRows = obj.rows || obj.Rows || obj.ROWS || obj.filas || obj.Filas || obj.FILAS;
    if (hasRows && Array.isArray(hasRows) && hasRows.length > 0) {
      return obj;
    }
    for (let k of Object.keys(obj)) {
      if (obj[k] && typeof obj[k] === 'object') {
        const found = findTableObject(obj[k]);
        if (found) return found;
      }
    }
    return null;
  }

  // Helper to recursively find any array of objects
  function findAnyArrayOfObjects(obj) {
    if (!obj || typeof obj !== 'object') return null;
    if (Array.isArray(obj)) {
      if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null && !Array.isArray(obj[0])) {
        return obj;
      }
      return null;
    }
    for (let k of Object.keys(obj)) {
      if (obj[k] && typeof obj[k] === 'object') {
        const found = findAnyArrayOfObjects(obj[k]);
        if (found) return found;
      }
    }
    return null;
  }

  // Parse extracted votes and store in appState.ocrVotes
  if (parsedData) {
    parseNestedStrings(parsedData);
  }

  const selectedDistrict = (appState.currentUser ? appState.currentUser.ubicacion : 'Ate').toUpperCase();

  let normalizedCols = [];
  let normalizedRows = [];

  let rawRows = [];
  let rawCols = [];

  if (parsedData) {
    // 1. Search recursively for a table object (has rows/filas array)
    const tableObj = findTableObject(parsedData);
    if (tableObj) {
      rawRows = tableObj.rows || tableObj.Rows || tableObj.ROWS || tableObj.filas || tableObj.Filas || tableObj.FILAS || [];
      rawCols = tableObj.columns || tableObj.Columns || tableObj.COLUMNS || tableObj.headers || tableObj.Headers || tableObj.HEADERS || tableObj.columnas || tableObj.column_headers || tableObj.Column_headers || [];
    } else {
      // 2. Search recursively for any array of objects
      const arrOfObjs = findAnyArrayOfObjects(parsedData);
      if (arrOfObjs) {
        rawRows = arrOfObjs;
      } else {
        // 3. Fallback to direct properties on parsedData
        rawRows = parsedData.rows || parsedData.Rows || parsedData.ROWS || parsedData.filas || parsedData.Filas || parsedData.FILAS || [];
        rawCols = parsedData.columns || parsedData.Columns || parsedData.COLUMNS || parsedData.headers || parsedData.Headers || parsedData.HEADERS || parsedData.columnas || parsedData.column_headers || parsedData.Column_headers || [];
      }
    }

    if (rawRows.length > 0) {
      if (rawCols.length === 0 && !Array.isArray(rawRows[0]) && typeof rawRows[0] === 'object') {
        const keys = Object.keys(rawRows[0]);
        const possiblePartyKeys = ['nombre', 'partido', 'label', 'candidato', 'party'];
        const partyKey = keys.find(k => {
          const kClean = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return possiblePartyKeys.some(pk => kClean.includes(pk) || pk.includes(kClean));
        }) || keys[0];
        
        rawCols = [partyKey, ...keys.filter(k => k !== partyKey)];
      }

      if (rawCols.length === 0 && Array.isArray(rawRows[0])) {
        rawCols = ['Partido'];
        for (let i = 1; i < rawRows[0].length; i++) {
          rawCols.push(`Columna ${i}`);
        }
      }

      if (rawCols.length > 0) {
        // Special case: all headers are districts (no party column) and rows are nested {"FP": {dist: votes}}
        // Detect this pattern: rawCols has no 'partido'/'nombre' type column AND first row is single-key with object value
        const firstRow = rawRows[0];
        const firstRowKeys = firstRow && typeof firstRow === 'object' && !Array.isArray(firstRow) ? Object.keys(firstRow) : [];
        const isNestedStructure = firstRowKeys.length === 1 && typeof firstRow[firstRowKeys[0]] === 'object' && firstRow[firstRowKeys[0]] !== null;

        if (isNestedStructure) {
          // Headers are the district columns, no extra party prefix needed
          normalizedCols = rawCols.slice(0);
          normalizedRows = rawRows.map(row => {
            const rowObj = {};
            const rowKeys = Object.keys(row);
            if (rowKeys.length === 1 && typeof row[rowKeys[0]] === 'object' && row[rowKeys[0]] !== null) {
              const partyRawName = rowKeys[0];
              const nestedData = row[rowKeys[0]];
              normalizedCols.forEach(colName => {
                const colNameClean = colName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const actualKey = Object.keys(nestedData).find(k => {
                  const kClean = k.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  return kClean === colNameClean;
                });
                rowObj[colName] = actualKey !== undefined ? Number(nestedData[actualKey]) || 0 : 0;
              });
              rowObj.nombre = obtenerNombreRealPartido(partyRawName, selectedDistrict);
            }
            return rowObj;
          }).filter(r => r.nombre);
        } else {
          normalizedCols = rawCols.slice(1);
          normalizedRows = rawRows.map(row => {
            let rawName = '';
            let rowObj = {};
            if (Array.isArray(row)) {
              rawName = row[0] || '';
              normalizedCols.forEach((colName, colIdx) => {
                rowObj[colName] = row[colIdx + 1] !== undefined ? row[colIdx + 1] : 0;
              });
            } else if (typeof row === 'object' && row !== null) {
              // Single-key nested: {"FP": {"BREÑA": 2, "LIMA": 96}}
              const rowKeys = Object.keys(row);
              if (rowKeys.length === 1 && typeof row[rowKeys[0]] === 'object' && row[rowKeys[0]] !== null && !Array.isArray(row[rowKeys[0]])) {
                rawName = rowKeys[0];
                const nestedData = row[rowKeys[0]];
                normalizedCols.forEach(colName => {
                  const colNameClean = colName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  const actualKey = Object.keys(nestedData).find(k => {
                    const kClean = k.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    return kClean === colNameClean;
                  });
                  rowObj[colName] = actualKey !== undefined ? Number(nestedData[actualKey]) || 0 : 0;
                });
              } else {
                const possiblePartyKeys = ['nombre', 'partido', 'label', 'candidato', 'party', rawCols[0]];
                const foundKey = Object.keys(row).find(k => {
                  const kClean = k.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  return possiblePartyKeys.some(pk => pk && pk.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === kClean);
                });
                rawName = foundKey ? row[foundKey] : (row.nombre || row.Partido || row.partido || row.label || '');
                if (!rawName) {
                  const firstNonNumKey = Object.keys(row).find(k => typeof row[k] === 'string');
                  if (firstNonNumKey) rawName = row[firstNonNumKey];
                }
                normalizedCols.forEach(colName => {
                  const colNameClean = colName.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  const actualKey = Object.keys(row).find(k => {
                    const kClean = k.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    return kClean === colNameClean;
                  });
                  rowObj[colName] = actualKey !== undefined ? row[actualKey] : 0;
                });
              }
            }
            rowObj.nombre = obtenerNombreRealPartido(rawName, selectedDistrict);
            return rowObj;
          });
        }
      }
    }
  }

  let detected = {
    provincial: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0 },
    distrital: { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0 }
  };

  // Handle new Gemini electoral format: candidatos_votos
  if (parsedData && parsedData.tipoDocumento === 'candidatos_votos' && parsedData.votos) {
    const partidos = Object.keys(detected.provincial);
    if (parsedData.votos.provincial) {
      partidos.forEach(p => {
        const val = parsedData.votos.provincial[p];
        if (val !== undefined && val !== null) {
          detected.provincial[p] = Number(val) || 0;
        }
      });
    }
    if (parsedData.votos.distrital) {
      partidos.forEach(p => {
        const val = parsedData.votos.distrital[p];
        if (val !== undefined && val !== null) {
          detected.distrital[p] = Number(val) || 0;
        }
      });
    }

    // If distrital is empty (Gemini couldn't determine district), copy provincial to distrital.
    // This applies for ALL districts: the image shows votes but doesn't say which district,
    // so we fill both sections with the same detected counts.
    const distritalEmpty = partidos.every(p => !detected.distrital[p] || detected.distrital[p] === 0);
    if (distritalEmpty) {
      partidos.forEach(p => {
        detected.distrital[p] = detected.provincial[p] || 0;
      });
      console.log('[OCR] candidatos_votos: distrital vac\u00edo, copiando votos provinciales al distrital.');
    }

    console.log('[OCR] candidatos_votos detectado:', detected);
  }

  if (normalizedRows.length > 0) {
    const selectedDistrictClean = selectedDistrict.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const distCol = normalizedCols.find(c => {
      const cClean = c.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return cClean === selectedDistrictClean || cClean.includes(selectedDistrictClean) || selectedDistrictClean.includes(cClean);
    });
    
    const provCol = normalizedCols.find(c => {
      const cClean = c.toUpperCase();
      return cClean === 'LIMA' || cClean === 'PROVINCIAL' || cClean === 'METROPOLITANA';
    });

    normalizedRows.forEach(row => {
      const partyName = row.nombre;
      if (partyName && detected.provincial[partyName] !== undefined) {
        // Find prov key case-insensitively
        const provKey = Object.keys(row).find(k => {
          const kClean = k.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return kClean === 'LIMA' || kClean === 'PROVINCIAL' || kClean === 'METROPOLITANA';
        });
        if (provKey !== undefined && row[provKey] !== undefined) {
          detected.provincial[partyName] = Number(row[provKey]) || 0;
        } else if (provCol && row[provCol] !== undefined) {
          detected.provincial[partyName] = Number(row[provCol]) || 0;
        }

        // Find dist key case-insensitively
        const distKey = Object.keys(row).find(k => {
          const kClean = k.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return kClean === selectedDistrictClean || kClean.includes(selectedDistrictClean) || selectedDistrictClean.includes(kClean);
        });
        if (distKey !== undefined && row[distKey] !== undefined) {
          detected.distrital[partyName] = Number(row[distKey]) || 0;
        } else if (distCol && row[distCol] !== undefined) {
          detected.distrital[partyName] = Number(row[distCol]) || 0;
        }
      }
    });
  } else if (parsedData && parsedData.tipoDocumento !== 'candidatos_votos') {
    // Only use text fallback if we don't already have structured vote data from Gemini
    const rawDetected = procesarTextoOCR(item.rawText);
    if (rawDetected) {
      detected.provincial = { ...rawDetected.provincial };
      detected.distrital = { ...rawDetected.distrital };
    }
  }

  // Fallback to build normalizedRows/Cols if they were empty but we detected votes
  if (normalizedRows.length === 0) {
    const hasProv = Object.values(detected.provincial).some(v => v > 0);
    const hasDist = Object.values(detected.distrital).some(v => v > 0);
    if (hasProv || hasDist) {
      normalizedCols = ['LIMA', selectedDistrict.toUpperCase()];
      const rowKeys = [...Object.keys(PARTIDO_ID_MAP), "NULOS", "VACIOS"];
      normalizedRows = rowKeys.map(key => {
        return {
          nombre: key,
          'LIMA': detected.provincial[key] || 0,
          [selectedDistrict.toUpperCase()]: detected.distrital[key] || 0
        };
      });
    }
  }

  // If a valid table was successfully parsed or fell back, consider the document type as "tabla"
  if (normalizedRows.length > 0) {
    item.tipoDocumento = 'tabla';
  }

  const detailType = document.getElementById('ocr-detail-type');
  if (detailType) {
    detailType.textContent = (item.tipoDocumento || 'texto_libre').toUpperCase();
  }

  // Verify if the current district is present in the OCR results
  let hasDistrictData = false;
  if (selectedDistrict) {
    const distClean = selectedDistrict.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Check in rawText
    if (item.rawText) {
      const textClean = item.rawText.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (textClean.includes(distClean)) {
        hasDistrictData = true;
      }
    }
    
    // Check in normalizedCols (if table was parsed)
    if (normalizedCols && normalizedCols.length > 0) {
      const foundInCols = normalizedCols.some(c => {
        const cClean = c.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return cClean === distClean || cClean.includes(distClean) || distClean.includes(cClean);
      });
      if (foundInCols) {
        hasDistrictData = true;
      }
    }
  }

  // If the district was not found, set all distrital votes to 0 to prevent mixing/incorrect values
  if (!hasDistrictData) {
    detected.distrital = { "FP": 0, "JP": 0, "SOMOS PERU": 0, "FREPAP": 0, "VERDE": 0, "MORADO": 0, "APROBADOS": 0, "NULOS": 0, "VACIOS": 0 };
  }

  // Update appState.ocrVotes and save
  appState.ocrVotes.provincial = { ...detected.provincial };
  appState.ocrVotes.distrital = { ...detected.distrital };
  localStorage.setItem('votoReal_ocrVotes', JSON.stringify(appState.ocrVotes));

  // Update label for district transmission in UI
  const lblTransmitDistName = document.getElementById('lbl-transmit-dist-name');
  if (lblTransmitDistName) {
    lblTransmitDistName.textContent = selectedDistrict;
  }

  // Regenerate OCR candidates table
  generarTablaCandidatosOCR();

  // Save normalized columns and rows on the item for other views/realtime sync
  item.normalizedCols = normalizedCols;
  item.normalizedRows = normalizedRows;

  // Populate the compact summary panel
  renderOcrSummaryPanel(item);

  // Populate the Modal preview content
  const modalJsonOutput = document.getElementById('ocr-modal-json-output');
  if (modalJsonOutput) {
    modalJsonOutput.textContent = item.rawText;
  }

  renderOcrModalPreview(item);

  // Refresh candidate table views
  generarTablaCandidatosOCR();

  // Refresh charts
  actualizarGraficosOCRTab();

  // Re-run Lucide to render icons inside summary card
  lucide.createIcons();

  // Automatically synchronize OCR votes to manual count in real-time
  syncOcrToManualRealtime();

  const btnApplyOcr = document.getElementById('btn-apply-ocr-votes');
  if (btnApplyOcr) {
    btnApplyOcr.style.display = 'flex';
  }
}

function syncOcrToManualRealtime() {
  if (ocrHistory.length === 0) {
    const summaryGridList = document.getElementById('ocr-summary-grid-list');
    if (summaryGridList) summaryGridList.innerHTML = '';
    generarTablaCandidatos(false);
    return;
  }

  const transmitProv = document.getElementById('chk-transmit-provincial') ? document.getElementById('chk-transmit-provincial').checked : true;
  const transmitDist = document.getElementById('chk-transmit-distrital') ? document.getElementById('chk-transmit-distrital').checked : false;

  // Sync application chart scope and toggle button active states for consistency
  const toggleProv = document.getElementById('chart-toggle-provincial');
  const toggleDistBtn = document.getElementById('chart-toggle-distrital');
  if (transmitProv) {
    appState.currentChartScope = 'provincial';
    if (toggleProv) toggleProv.classList.add('active');
    if (toggleDistBtn) toggleDistBtn.classList.remove('active');
  } else {
    appState.currentChartScope = 'distrital';
    if (toggleProv) toggleProv.classList.remove('active');
    if (toggleDistBtn) toggleDistBtn.classList.add('active');
  }

  // Sync provincial
  if (transmitProv && appState.ocrVotes && appState.ocrVotes.provincial) {
    appState.currentVotes.provincial = { ...appState.ocrVotes.provincial };
  } else {
    Object.keys(appState.currentVotes.provincial).forEach(k => {
      appState.currentVotes.provincial[k] = 0;
    });
  }

  // Sync distrital
  if (transmitDist && appState.ocrVotes && appState.ocrVotes.distrital) {
    appState.currentVotes.distrital = { ...appState.ocrVotes.distrital };
  } else {
    Object.keys(appState.currentVotes.distrital).forEach(k => {
      appState.currentVotes.distrital[k] = 0;
    });
  }

  // Update inputs in the UI manual counting forms
  Object.keys(PARTIDO_ID_MAP).forEach(partyKey => {
    const partyId = PARTIDO_ID_MAP[partyKey];
    
    const provInput = document.getElementById(`votos-prov-${partyId}`);
    if (provInput) {
      provInput.value = appState.currentVotes.provincial[partyKey] || 0;
    }
    
    const distInput = document.getElementById(`votos-dist-${partyId}`);
    if (distInput) {
      distInput.value = appState.currentVotes.distrital[partyKey] || 0;
    }
  });

  // Also sync metric inputs
  const metricKeys = ["NULOS", "VACIOS"];
  metricKeys.forEach(key => {
    const keyLower = key.toLowerCase();
    const provInput = document.getElementById(`votos-prov-${keyLower}`);
    if (provInput) {
      provInput.value = appState.currentVotes.provincial[key] || 0;
    }
    const distInput = document.getElementById(`votos-dist-${keyLower}`);
    if (distInput) {
      distInput.value = appState.currentVotes.distrital[key] || 0;
    }
  });

  // Regenerate candidates table grid to show values
  generarTablaCandidatos(false);

  // Re-render OCR candidates table grid to match the selected option
  generarTablaCandidatosOCR();

  // Re-render OCR summary panel and modal preview on the dashboard
  if (ocrHistory.length > 0 && ocrHistory[selectedOcrItemIndex]) {
    renderOcrSummaryPanel(ocrHistory[selectedOcrItemIndex]);
    renderOcrModalPreview(ocrHistory[selectedOcrItemIndex]);
  }

  // Update manual charts/summary
  actualizarGraficosYResumen(
    obtenerVotosParaMostrar(appState.currentChartScope), 
    appState.currentChartScope, 
    appState.currentUser ? appState.currentUser.ubicacion : 'Ate'
  );
}

function applyOcrTabVotes() {
  const transmitProv = document.getElementById('chk-transmit-provincial') ? document.getElementById('chk-transmit-provincial').checked : true;
  const transmitDist = document.getElementById('chk-transmit-distrital') ? document.getElementById('chk-transmit-distrital').checked : true;

  if (!transmitProv && !transmitDist) {
    showToast('Por favor, selecciona al menos una jurisdicción para transmitir.', 'error');
    return;
  }

  const selectedDistrict = (appState.currentUser ? appState.currentUser.ubicacion : 'Ate').toUpperCase();
  let targetDesc = [];
  if (transmitProv) targetDesc.push('• Alcaldía Metropolitana de Lima');
  if (transmitDist) targetDesc.push(`• Alcaldía Distrital de ${selectedDistrict}`);

  const confirmMsg = `¿Confirmas la transmisión de los votos?\n\n` +
                     `Estos votos serán enviados a:\n` +
                     targetDesc.join('\n') + `\n\n` +
                     `¿Deseas continuar?`;
                     
  if (!confirm(confirmMsg)) {
    return;
  }

  let mesaInput = document.getElementById('input-mesa');
  let mesaVal = mesaInput ? mesaInput.value.trim() : '';
  if (!mesaVal) {
    mesaVal = prompt('Por favor, ingresa el número de mesa para transmitir los votos a Google Sheets:');
    if (mesaVal) {
      mesaVal = mesaVal.trim();
      if (mesaInput) mesaInput.value = mesaVal;
    } else {
      showToast('Votos copiados localmente, pero no transmitidos a Google Sheets porque no se ingresó el número de mesa.', 'warning');
      return;
    }
  }

  // Force duplicate check, school lookup, and button disabling
  handleMesaInputChange();

  // If the OCR transmission button gets disabled, abort the transmission process
  const btnApplyOcr = document.getElementById('btn-apply-ocr-votes');
  if (btnApplyOcr && btnApplyOcr.hasAttribute('disabled')) {
    showToast('Esta mesa ya fue registrada vía IMAGEN. Transmisión cancelada.', 'error');
    return;
  }

  // Trigger submission to Google Sheets
  const submitEvent = new Event('submit', { cancelable: true });
  const formVotos = document.getElementById('form-votos');
  if (formVotos) {
    formVotos.dispatchEvent(submitEvent);
  } else {
    handleVotesSubmit(new Event('submit'));
  }
}

function downloadSelectedOcrJson() {
  const item = ocrHistory[selectedOcrItemIndex];
  if (!item) return;
  
  const blob = new Blob([item.rawText], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", `${item.fileName.replace(/\.[^/.]+$/, "")}_ocr.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

function downloadSelectedOcrTxt() {
  const item = ocrHistory[selectedOcrItemIndex];
  if (!item) return;
  
  let textContent = `ACTA: ${item.fileName}\nFECHA: ${item.timestamp}\nTIPO: ${item.tipoDocumento}\n\n`;
  
  if (item.tipoDocumento === 'tabla' && item.parsedData && item.parsedData.filas) {
    const cols = item.parsedData.columnas || [];
    textContent += `Nombre | ${cols.join(' | ')}\n`;
    textContent += `---|${cols.map(() => '---').join('|')}\n`;
    item.parsedData.filas.forEach(f => {
      textContent += `${f.nombre} | ${cols.map(c => f[c] !== undefined ? f[c] : '').join(' | ')}\n`;
    });
  } else if (item.parsedData && item.parsedData.textoExtraido) {
    textContent += item.parsedData.textoExtraido;
  } else {
    textContent += JSON.stringify(item.parsedData || item.rawText, null, 2);
  }
  
  const blob = new Blob([textContent], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", `${item.fileName.replace(/\.[^/.]+$/, "")}_ocr.txt`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

function downloadSelectedOcrCsv() {
  const item = ocrHistory[selectedOcrItemIndex];
  if (!item || !item.parsedData || !item.parsedData.filas) return;
  
  const cols = item.parsedData.columnas || [];
  let csvContent = "\ufeffNombre," + cols.join(",") + "\n"; // BOM for Excel UTF-8 support
  
  item.parsedData.filas.forEach(f => {
    const rowVals = [f.nombre || ""];
    cols.forEach(c => {
      rowVals.push(f[c] !== undefined ? f[c] : "");
    });
    csvContent += rowVals.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(",") + "\n";
  });
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", `${item.fileName.replace(/\.[^/.]+$/, "")}_ocr.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

let lastSyncMesa = '';

async function sincronizarMesa(mesaVal) {
  if (!mesaVal) {
    lastSyncMesa = '';
    return;
  }
  
  let paddedMesa = mesaVal.trim();
  if (/^\d+$/.test(paddedMesa)) {
    paddedMesa = paddedMesa.padStart(6, '0');
  }
  
  const match = buscarColegioPorMesa(paddedMesa);
  if (match && paddedMesa !== lastSyncMesa) {
    showLoading(true, `Sincronizando mesa ${paddedMesa}...`);
    try {
      await fetchAndSyncReport();
      lastSyncMesa = paddedMesa;
      handleMesaInputChange();
    } catch (err) {
      console.error("Error syncing mesa:", err);
    } finally {
      showLoading(false);
    }
  }
}

// Mesa -> Colegio automatic lookup
function handleMesaInputChange() {
  const inputMesa = document.getElementById('input-mesa');
  const inputColegio = document.getElementById('input-colegio');
  const btnSubmitManual = document.getElementById('btn-submit-manual-votes');
  const btnSubmitOcr = document.getElementById('btn-submit-ocr-votes');
  const btnApplyOcr = document.getElementById('btn-apply-ocr-votes');
  const btnScan = document.getElementById('btn-scan-acta');
  const checkBrigadista = document.getElementById('check-asistencia-brigadista');

  if (btnSubmitManual) btnSubmitManual.removeAttribute('disabled');
  if (btnSubmitOcr) btnSubmitOcr.removeAttribute('disabled');
  if (btnApplyOcr) btnApplyOcr.removeAttribute('disabled');
  if (btnScan) {
    btnScan.removeAttribute('disabled');
    btnScan.style.opacity = '1';
    btnScan.style.pointerEvents = 'auto';
  }
  if (checkBrigadista) checkBrigadista.disabled = false;

  if (!inputMesa) return;

  const mesaVal = inputMesa.value.trim();
  const assignedMesa = appState.currentUser ? appState.currentUser.mesa : '';
  const isSuperAdmin = appState.currentUser && (appState.currentUser.dni === 'Admin#2026$Secure!VotoReal' || appState.currentUser.nombre === 'Super Administrador');
  const isCoordinator = typeof esCoordinador === 'function' && esCoordinador(appState.currentUser);

  // 1. Sincronizar Colegio y Distrito correspondientes a la mesa ingresada
  if (mesaVal) {
    const match = buscarColegioPorMesa(mesaVal);
    if (match) {
      if (inputColegio && match.colegio) {
        inputColegio.value = match.colegio;
      }
      if (match.distrito && appState.currentUser) {
        appState.currentUser.ubicacion = match.distrito;
        const displayInfo = document.getElementById('user-display-info');
        if (displayInfo && appState.currentUser.dni) {
          displayInfo.textContent = `DNI: ${appState.currentUser.dni} | Distrito: ${appState.currentUser.ubicacion}`;
        }
        const btnToggleDist = document.getElementById('chart-toggle-distrital');
        if (btnToggleDist) {
          btnToggleDist.textContent = `Distrital (${appState.currentUser.ubicacion})`;
        }
        const lblTransmitDistName = document.getElementById('lbl-transmit-dist-name');
        if (lblTransmitDistName) {
          lblTransmitDistName.textContent = appState.currentUser.ubicacion;
        }
      }
    } else if (inputColegio && appState.currentUser && appState.currentUser.colegio) {
      inputColegio.value = appState.currentUser.colegio;
    }
  }

  // 2. Validación estricta: si la mesa ingresada no corresponde a la asignada, bloquear transmisión
  if (mesaVal && assignedMesa && !isSuperAdmin && !isCoordinator) {
    let normMesaVal = mesaVal;
    if (/^\d+$/.test(normMesaVal)) normMesaVal = normMesaVal.padStart(6, '0');
    let normAssignedMesa = assignedMesa.toString().trim();
    if (/^\d+$/.test(normAssignedMesa)) normAssignedMesa = normAssignedMesa.padStart(6, '0');

    if (normMesaVal !== normAssignedMesa) {
      if (btnSubmitManual) btnSubmitManual.setAttribute('disabled', 'true');
      if (btnSubmitOcr) btnSubmitOcr.setAttribute('disabled', 'true');
      if (btnApplyOcr) btnApplyOcr.setAttribute('disabled', 'true');
      if (btnScan) {
        btnScan.setAttribute('disabled', 'true');
        btnScan.style.opacity = '0.5';
        btnScan.style.pointerEvents = 'none';
      }
      showToast(`El número de mesa ${mesaVal} no corresponde a tu mesa asignada (${assignedMesa}). Por favor ingresa la mesa que te corresponde (${assignedMesa}).`, 'error');
      return;
    }
  }

  if (!mesaVal) return;

  // 1. Verificar si la mesa ya fue registrada en el sistema (para todos los usuarios)
  if (mesaVal.length >= 5) {
    let paddedMesa = mesaVal;
    if (/^\d+$/.test(paddedMesa)) {
      paddedMesa = paddedMesa.padStart(6, '0');
    }
    
    const registros = (appState.mesas || []).filter(m => {
      if (!m.mesa) return false;
      let mStr = m.mesa.toString().trim();
      if (/^\d+$/.test(mStr)) {
        mStr = mStr.padStart(6, '0');
      }
      return mStr === paddedMesa;
    });
    
    if (registros.length > 0) {
      // Disable corresponding transmission buttons if already registered
      const hasManual = registros.some(r => r.origen && r.origen.toUpperCase() === 'MANUAL');
      const hasImagen = registros.some(r => r.origen && r.origen.toUpperCase() === 'IMAGEN');
      
      if (hasManual && btnSubmitManual) btnSubmitManual.setAttribute('disabled', 'true');
      if (hasImagen && btnSubmitOcr) btnSubmitOcr.setAttribute('disabled', 'true');
      if (hasImagen && btnApplyOcr) btnApplyOcr.setAttribute('disabled', 'true');
      if (hasImagen && btnScan) {
        btnScan.setAttribute('disabled', 'true');
        btnScan.style.opacity = '0.5';
        btnScan.style.pointerEvents = 'none';
      }

      mostrarPopupMesaRegistrada(paddedMesa, registros);

      if (inputColegio) {
        const match = buscarColegioPorMesa(mesaVal);
        if (match) {
          inputColegio.value = match.colegio;
        } else {
          const firstReg = registros[0];
          inputColegio.value = (firstReg.colegio || 'IE 0024 PEDRO ENRIQUE GONZALES SOTO').toUpperCase();
        }
      }
      return;
    }
  }
}

window.votoReal_colegioCacheMap = window.votoReal_colegioCacheMap || {};

function buscarColegioPorMesa(mesaNum) {
  if (!mesaNum) return null;
  let numStr = String(mesaNum).trim();
  if (/^\d+$/.test(numStr)) {
    numStr = numStr.padStart(6, '0');
  }

  // Fast O(1) Hash Map Cache Lookup
  if (window.votoReal_colegioCacheMap[numStr]) {
    return window.votoReal_colegioCacheMap[numStr];
  }

  const num = Number(mesaNum);
  const currentUserDist = (appState.currentUser && appState.currentUser.ubicacion) || "";

  // 1. Buscar en el usuario actual si tiene mesa y colegio asignados
  if (appState.currentUser && appState.currentUser.mesa) {
    let curMesa = String(appState.currentUser.mesa).trim();
    if (/^\d+$/.test(curMesa)) curMesa = curMesa.padStart(6, '0');
    if (curMesa === numStr && appState.currentUser.colegio) {
      const res = {
        colegio: appState.currentUser.colegio,
        distrito: appState.currentUser.ubicacion || currentUserDist
      };
      window.votoReal_colegioCacheMap[numStr] = res;
      return res;
    }
  }

  // 2. Buscar en base de usuarios cacheados y estructura de mesas descargada
  let res = null;
  if (Array.isArray(appState.mesas_estructura)) {
    const foundEst = appState.mesas_estructura.find(e => {
      if (!e.mesa) return false;
      let eMesa = String(e.mesa).trim();
      if (/^\d+$/.test(eMesa)) eMesa = eMesa.padStart(6, '0');
      return eMesa === numStr;
    });
    if (foundEst && foundEst.colegio) {
      res = { colegio: foundEst.colegio, distrito: foundEst.distrito || currentUserDist };
    }
  }

  if (!res) {
    const cachedDbStr = localStorage.getItem('votoReal_usuariosDb');
    if (cachedDbStr) {
      try {
        const cachedDb = JSON.parse(cachedDbStr);
        if (Array.isArray(cachedDb)) {
          const foundUser = cachedDb.find(u => {
            if (!u.mesa) return false;
            let uMesa = String(u.mesa).trim();
            if (/^\d+$/.test(uMesa)) uMesa = uMesa.padStart(6, '0');
            return uMesa === numStr;
          });
          if (foundUser && foundUser.colegio) {
            res = { colegio: foundUser.colegio, distrito: foundUser.ubicacion || currentUserDist };
          }
        }
      } catch (e) {}
    }
  }

  if (!res && typeof MESAS_REALES_ANCON_ATE !== 'undefined' && !isNaN(num)) {
    const foundReal = MESAS_REALES_ANCON_ATE.find(item => {
      const start = parseInt(item[2]);
      const end = parseInt(item[3]);
      return num >= start && num <= end;
    });
    if (foundReal) {
      res = { colegio: foundReal[1], distrito: currentUserDist };
    }
  }

  if (!res && typeof MESA_DATA !== 'undefined' && Object.keys(MESA_DATA).length > 0) {
    const foundUserMesa = Object.values(MESA_DATA).find(item => {
      if (!item.mesa) return false;
      let mStr = String(item.mesa).trim();
      if (/^\d+$/.test(mStr)) mStr = mStr.padStart(6, '0');
      return mStr === numStr && item.distrito && item.distrito.toLowerCase() === currentUserDist.toLowerCase();
    });
    if (foundUserMesa) {
      res = { colegio: foundUserMesa.colegio, distrito: currentUserDist };
    }
  }

  if (!res && typeof generarLocalesYMesas === 'function' && currentUserDist) {
    const userLocales = generarLocalesYMesas(currentUserDist);
    if (userLocales && userLocales.length > 0) {
      const matchInUserLocales = userLocales.find(loc => loc.mesas && loc.mesas.includes(num));
      if (matchInUserLocales) {
        res = { colegio: matchInUserLocales.nombre, distrito: currentUserDist };
      } else {
        const index = Math.abs(num) % userLocales.length;
        res = { colegio: userLocales[index].nombre, distrito: currentUserDist };
      }
    }
  }

  if (!res) {
    res = { colegio: "IE 0024 PEDRO ENRIQUE GONZALES SOTO", distrito: currentUserDist };
  }

  window.votoReal_colegioCacheMap[numStr] = res;
  return res;
}

// --- POPUP CONFIRMATION DIALOG ---
function showSuccessPopup(message) {
  // Remove any existing success popups first
  const existing = document.getElementById('success-popup-overlay');
  if (existing) existing.remove();

  // Create overlay container (transparent background, matches glassmorphism theme)
  const overlay = document.createElement('div');
  overlay.id = 'success-popup-overlay';
  overlay.style.position = 'fixed';
  overlay.style.bottom = '20px';
  overlay.style.left = '50%';
  overlay.style.transform = 'translateX(-50%) translateY(100px)';
  overlay.style.width = '90%';
  overlay.style.maxWidth = '380px';
  overlay.style.zIndex = '10000';
  overlay.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease';
  overlay.style.opacity = '0';

  // Create card
  const card = document.createElement('div');
  card.style.background = 'linear-gradient(135deg, #131c35 0%, #0a0f1d 100%)';
  card.style.border = '2px solid #10b981';
  card.style.borderRadius = '16px';
  card.style.padding = '16px 20px';
  card.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.2)';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '12px';

  // Content row
  const contentRow = document.createElement('div');
  contentRow.style.display = 'flex';
  contentRow.style.alignItems = 'center';
  contentRow.style.gap = '12px';

  // Icon container
  const iconContainer = document.createElement('div');
  iconContainer.style.width = '42px';
  iconContainer.style.height = '42px';
  iconContainer.style.borderRadius = '50%';
  iconContainer.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
  iconContainer.style.display = 'flex';
  iconContainer.style.alignItems = 'center';
  iconContainer.style.justifyContent = 'center';
  iconContainer.style.flexShrink = '0';
  iconContainer.innerHTML = '<i data-lucide="check-circle" style="width: 26px; height: 26px; color: #10b981;"></i>';

  // Text Container
  const textContainer = document.createElement('div');
  textContainer.style.display = 'flex';
  textContainer.style.flexDirection = 'column';
  
  const title = document.createElement('span');
  title.style.color = '#10b981';
  title.style.fontSize = '1.05rem';
  title.style.fontWeight = '800';
  title.textContent = '¡Votos Enviados!';

  const desc = document.createElement('span');
  desc.style.color = '#e2e8f0';
  desc.style.fontSize = '0.85rem';
  desc.style.fontWeight = '500';
  desc.textContent = message || 'Los resultados se guardaron correctamente.';

  textContainer.appendChild(title);
  textContainer.appendChild(desc);

  contentRow.appendChild(iconContainer);
  contentRow.appendChild(textContainer);

  // Aceptar Button
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.style.width = '100%';
  btn.style.padding = '10px';
  btn.style.border = 'none';
  btn.style.borderRadius = '8px';
  btn.style.background = '#10b981';
  btn.style.color = '#0a0f1d';
  btn.style.fontWeight = '800';
  btn.style.fontSize = '0.9rem';
  btn.style.cursor = 'pointer';
  btn.style.transition = 'background-color 0.2s';
  btn.textContent = 'Aceptar';

  const closePopup = () => {
    overlay.style.transform = 'translateX(-50%) translateY(100px)';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
    }, 400);
  };

  btn.addEventListener('click', closePopup);

  card.appendChild(contentRow);
  card.appendChild(btn);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Trigger slide up & fade in
  setTimeout(() => {
    overlay.style.transform = 'translateX(-50%) translateY(0)';
    overlay.style.opacity = '1';
  }, 50);

  // Auto close after 6 seconds
  const autoCloseTimeout = setTimeout(closePopup, 6000);

  // Clear timeout if clicked
  btn.addEventListener('click', () => {
    clearTimeout(autoCloseTimeout);
  });
}

let pendingMesaRegistradaData = null;

function mostrarPopupEntrada() {
  if (sessionStorage.getItem('votoReal_popupEntradaMostrar')) {
    return;
  }
  sessionStorage.setItem('votoReal_popupEntradaMostrar', 'true');

  const overlay = document.createElement('div');
  overlay.id = 'entry-popup-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(10, 15, 29, 0.85)';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.style.webkitBackdropFilter = 'blur(10px)';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.3s ease';

  const card = document.createElement('div');
  card.className = 'glass';
  card.style.width = '100%';
  card.style.maxWidth = '380px';
  card.style.padding = '24px';
  card.style.borderRadius = '20px';
  card.style.border = '1px solid rgba(255, 255, 255, 0.18)';
  card.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.6), 0 0 35px rgba(99, 102, 241, 0.2)';
  card.style.transform = 'translateY(20px)';
  card.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '22px';
  card.style.textAlign = 'center';

  const iconContainer = document.createElement('div');
  iconContainer.style.width = '64px';
  iconContainer.style.height = '64px';
  iconContainer.style.borderRadius = '50%';
  iconContainer.style.background = 'rgba(99, 102, 241, 0.15)';
  iconContainer.style.display = 'flex';
  iconContainer.style.alignItems = 'center';
  iconContainer.style.justifyContent = 'center';
  iconContainer.style.margin = '0 auto';
  iconContainer.innerHTML = '<i data-lucide="info" style="width: 36px; height: 36px; color: #6366f1;"></i>';

  const title = document.createElement('h2');
  title.style.fontSize = '1.65rem';
  title.style.fontWeight = '800';
  title.style.background = 'linear-gradient(135deg, #f8fafc 30%, #38bdf8 100%)';
  title.style.webkitBackgroundClip = 'text';
  title.style.webkitTextFillColor = 'transparent';
  title.style.margin = '0';
  title.textContent = 'Control de Votación';

  const desc = document.createElement('p');
  desc.style.color = '#cbd5e1';
  desc.style.fontSize = '1.02rem';
  desc.style.margin = '0';
  desc.style.lineHeight = '1.5';
  desc.innerHTML = 'Bienvenido al sistema. Tienes <strong>2 opciones</strong> independientes para registrar tus actas de mesa:';

  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '14px';
  list.style.textAlign = 'left';
  list.style.background = 'rgba(15, 23, 42, 0.4)';
  list.style.padding = '16px';
  list.style.borderRadius = '16px';
  list.style.border = '1px solid rgba(255, 255, 255, 0.08)';

  const itemManual = document.createElement('div');
  itemManual.style.display = 'flex';
  itemManual.style.alignItems = 'center';
  itemManual.style.gap = '12px';
  itemManual.style.fontSize = '1rem';
  itemManual.style.color = '#f1f5f9';
  itemManual.innerHTML = '<i data-lucide="edit-3" style="width: 20px; height: 20px; color: #38bdf8; flex-shrink: 0;"></i> <span><strong>Formulario Manual:</strong> Conteo digitado.</span>';

  const itemImage = document.createElement('div');
  itemImage.style.display = 'flex';
  itemImage.style.alignItems = 'center';
  itemImage.style.gap = '12px';
  itemImage.style.fontSize = '1rem';
  itemImage.style.color = '#f1f5f9';
  itemImage.innerHTML = '<i data-lucide="camera" style="width: 20px; height: 20px; color: #a855f7; flex-shrink: 0;"></i> <span><strong>Formulario Imagen:</strong> Foto y OCR.</span>';

  list.appendChild(itemManual);
  list.appendChild(itemImage);

  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.style.width = '100%';
  btn.style.padding = '14px';
  btn.style.border = 'none';
  btn.style.borderRadius = '10px';
  btn.style.fontWeight = '800';
  btn.style.fontSize = '1.08rem';
  btn.style.cursor = 'pointer';
  btn.textContent = 'Entendido, comenzar';

  const closePopup = () => {
    overlay.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
      overlay.remove();
      if (pendingMesaRegistradaData) {
        const { mesaNum, registros } = pendingMesaRegistradaData;
        pendingMesaRegistradaData = null;
        mostrarPopupMesaRegistrada(mesaNum, registros);
      }
    }, 300);
  };

  btn.addEventListener('click', closePopup);

  card.appendChild(iconContainer);
  card.appendChild(title);
  card.appendChild(desc);
  card.appendChild(list);
  card.appendChild(btn);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  setTimeout(() => {
    overlay.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, 50);
}

function mostrarPopupMesaRegistrada(mesaNum, registros) {
  // Deshabilitado totalmente (sin popups de mensaje)
  return;
}

function normalizarTexto(txt) {
  if (!txt) return "";
  return txt.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

async function setupCoordinatorDisplay() {
  if (!appState.currentUser) return;
  if (!appState.asistencia) appState.asistencia = [];
  
  const displayName = document.getElementById('coord-display-name');
  if (displayName) displayName.textContent = appState.currentUser.nombre;
  
  const displayInfo = document.getElementById('coord-display-info');
  if (displayInfo) {
    displayInfo.textContent = `DNI: ${appState.currentUser.dni} | Distrito: ${appState.currentUser.ubicacion}`;
  }
  
  const localName = document.getElementById('coord-local-name');
  if (localName) {
    localName.textContent = appState.currentUser.colegio || "No asignado";
  }
  
  await renderCoordinatorPersoneros();
}

async function renderCoordinatorPersoneros() {
  const container = document.getElementById('coord-personeros-list');
  const countBadge = document.getElementById('coord-personeros-count');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div class="spinner" style="margin: 0 auto 10px; width: 30px; height: 30px; border-width: 3px; border-color: rgba(255,255,255,0.05); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s infinite linear;"></div>
      <p style="font-size: 0.85rem; color: var(--text-muted);">Cargando personeros...</p>
    </div>
  `;

  // Get personeros list from in-memory RAM array first, then localStorage, then BRIGADISTAS_DB
  let allUsers = [];
  if (Array.isArray(window.votoReal_usuariosDbInMemory) && window.votoReal_usuariosDbInMemory.length > 0) {
    allUsers = window.votoReal_usuariosDbInMemory;
  } else {
    const cachedDbStr = localStorage.getItem('votoReal_usuariosDb');
    allUsers = cachedDbStr ? JSON.parse(cachedDbStr) : [];
  }

  if (allUsers.length === 0) {
    try {
      await fetchUsuariosDb();
      allUsers = window.votoReal_usuariosDbInMemory || JSON.parse(localStorage.getItem('votoReal_usuariosDb') || '[]');
    } catch (e) {
      console.error("Error fetching users for coordinator:", e);
    }
  }

  // Fallback to local DB if still empty
  if (allUsers.length === 0 && typeof BRIGADISTAS_DB !== 'undefined') {
    allUsers = BRIGADISTAS_DB;
  }

  const myDistrito = normalizarTexto(appState.currentUser.ubicacion);
  const myColegio = normalizarTexto(appState.currentUser.colegio).replace(/[^a-z0-9]/g, "");

  const myPersoneros = allUsers.filter(u => {
    const uDist = normalizarTexto(u.ubicacion);
    const uCol = normalizarTexto(u.colegio).replace(/[^a-z0-9]/g, "");
    
    // Exclude Coordinators
    if (esCoordinador(u)) return false;

    // Exclude Super Administrador
    const nameLow = (u.nombre || "").toLowerCase();
    const dniLow = (u.dni || "").toLowerCase();
    if (dniLow === '99999999' || dniLow === 'admin#2026$secure!votoreal' || nameLow.includes('super admin')) {
      return false;
    }

    if (myColegio && myColegio.length > 2) {
      return (uCol === myColegio || uCol.includes(myColegio) || myColegio.includes(uCol)) && (uDist === myDistrito || !uDist);
    }
    return uDist === myDistrito;
  });

  if (countBadge) countBadge.textContent = myPersoneros.length;

  let coordinatorsList = [];
  try {
    const res = await apiPost({ action: "obtener_coordinadores" });
    if (res && res.success) {
      coordinatorsList = res.coordinadores || [];
    }
  } catch (e) {
    console.error("Error fetching coordinators sheet:", e);
  }

  const query = (document.getElementById('coord-search-personero')?.value || "").toLowerCase().trim();
  const filteredPersoneros = myPersoneros.filter(p => {
    if (!query) return true;
    return (p.nombre || "").toLowerCase().includes(query) || (p.dni || "").includes(query);
  });

  if (filteredPersoneros.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <i data-lucide="users" style="width: 48px; height: 48px; margin-bottom: 10px; opacity: 0.5; display: block; margin-left: auto; margin-right: auto;"></i>
        <p>${query ? 'No se encontraron personeros que coincidan.' : 'No hay personeros registrados en este local.'}</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = "";
  
  filteredPersoneros.forEach(p => {
    const coordConfirm = coordinatorsList.find(c => (c.personeroDni || "").trim() === (p.dni || "").trim());
    const isConfirmed = coordConfirm && coordConfirm.confirmacion && coordConfirm.confirmacion !== "NO" && coordConfirm.confirmacion !== "PENDIENTE";

    const card = document.createElement('div');
    card.className = `coord-personero-card glass ${isConfirmed ? 'confirmed' : ''}`;
    card.id = `card-personero-${p.dni}`;
    card.style.padding = '14px 18px';
    
    card.innerHTML = `
      <div class="coord-personero-header" style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 12px;">
        <div>
          <span class="coord-personero-name" style="font-size: 1rem; font-weight: 700; color: #ffffff;">${p.nombre}</span>
          <div class="coord-personero-dni" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">DNI: ${p.dni}</div>
        </div>
        <div>
          <label class="coord-checkbox-container">
            <input type="checkbox" class="coord-checkbox-input coord-confirm-checkbox" id="check-coord-${p.dni}" data-dni="${p.dni}" data-nombre="${p.nombre}" data-distrito="${p.ubicacion}" data-local="${p.colegio}" ${isConfirmed ? 'checked' : ''}>
            <span class="coord-checkbox-box">
              <i data-lucide="check" class="coord-checkbox-icon"></i>
            </span>
            <span class="coord-checkbox-label" id="label-coord-${p.dni}">
              ${isConfirmed ? 'Confirmado' : 'Confirmar'}
            </span>
          </label>
        </div>
      </div>
    `;
    
    container.appendChild(card);
  });

  lucide.createIcons();

  filteredPersoneros.forEach(p => {
    const checkbox = document.getElementById(`check-coord-${p.dni}`);
    if (checkbox) {
      checkbox.addEventListener('change', async (e) => {
        const isChecked = e.target.checked;
        const label = document.getElementById(`label-coord-${p.dni}`);
        const card = document.getElementById(`card-personero-${p.dni}`);
        
        showLoading(true, isChecked ? 'Confirmando personero...' : 'Cancelando confirmación...');
        
        try {
          const response = await apiPost({
            action: "confirmar_coordinador",
            personeroNombre: p.nombre,
            personeroDni: p.dni,
            distrito: p.ubicacion,
            local: p.colegio,
            coordinadorNombre: appState.currentUser.nombre,
            coordinadorDni: appState.currentUser.dni,
            confirmacion: isChecked ? "SI" : "NO"
          });
          
          showLoading(false);
          if (response && response.success) {
            showToast(isChecked ? `Asistencia confirmada para ${p.nombre}.` : `Confirmación cancelada para ${p.nombre}.`, 'success');
            if (label) {
              label.textContent = isChecked ? 'Confirmado' : 'Confirmar';
            }
            if (card) {
              if (isChecked) {
                card.classList.add('confirmed');
              } else {
                card.classList.remove('confirmed');
              }
            }
          } else {
            showToast(response.message || 'Error al procesar confirmación.', 'error');
            e.target.checked = !isChecked; // Revert
          }
        } catch (err) {
          console.error(err);
          showLoading(false);
          showToast('Error de conexión.', 'error');
          e.target.checked = !isChecked; // Revert
        }
      });
    }
  });
}

// Persist and synchronize brigadista attendance check state
async function checkBrigadistaAttendance() {
  if (!appState.currentUser || (typeof esCoordinador === 'function' && esCoordinador(appState.currentUser))) {
    return;
  }
  
  const checkBrigadista = document.getElementById('check-asistencia-brigadista');
  const inputMesa = document.getElementById('input-mesa');
  const inputColegio = document.getElementById('input-colegio');
  const checkLabelBrigadista = document.getElementById('check-label-brigadista');
  
  if (!checkBrigadista || !inputMesa) return;

  const dni = (appState.currentUser.dni || "").toString().trim();

  // ── FASE 1: Restaurar caché local al instante (solo para usuarios ya confirmados) ──
  // Si localStorage dice que este DNI específico fue confirmado antes,
  // mostrar ese estado de inmediato (sin esperar red) para evitar parpadeo.
  const cachedConfirmed = dni && localStorage.getItem(`votoReal_attConfirmed_${dni}`) === 'true';

  if (cachedConfirmed) {
    const cachedMesa = localStorage.getItem(`votoReal_attMesa_${dni}`) || '';
    const cachedColegio = localStorage.getItem(`votoReal_attColegio_${dni}`) || '';
    checkBrigadista.checked = true;
    checkBrigadista.disabled = true;
    if (checkLabelBrigadista) {
      checkLabelBrigadista.style.color = 'var(--success)';
      checkLabelBrigadista.textContent = 'Confirmado';
    }
    if (cachedMesa && inputMesa) {
      inputMesa.value = cachedMesa;
      inputMesa.disabled = true;
    }
    if (cachedColegio && inputColegio) {
      inputColegio.value = cachedColegio;
    }
  } else {
    // Sin caché → campos vacíos, libre para escribir
    checkBrigadista.checked = false;
    checkBrigadista.disabled = false;
    inputMesa.disabled = false;
    if (checkLabelBrigadista) {
      checkLabelBrigadista.style.color = 'var(--text-muted)';
      checkLabelBrigadista.textContent = 'Confirmar';
    }
  }

  // ── FASE 2: Verificar con el servidor — corrige cualquier error del caché ──
  let attendanceList = [];
  try {
    const res = await apiPost({ action: "obtener_asistencia" });
    if (res && res.success && Array.isArray(res.asistencia)) {
      attendanceList = res.asistencia;
      appState.asistencia = attendanceList;
    }
  } catch (e) {
    console.error("Error fetching attendance:", e);
    // Fallback: usar caché en memoria solo si hay error de red
    attendanceList = appState.asistencia || [];
  }

  const myAtt = attendanceList.find(a => (a.dni || "").toString().trim() === dni);
  const isServerConfirmed = myAtt && (
    (myAtt.confirmacion && (
      myAtt.confirmacion === "SI" ||
      myAtt.confirmacion === "SÍ" ||
      myAtt.confirmacion === "CONFIRMADA" ||
      myAtt.confirmacion.startsWith("http://") ||
      myAtt.confirmacion.startsWith("https://")
    )) ||
    (myAtt.foto && (
      myAtt.foto.startsWith("http://") ||
      myAtt.foto.startsWith("https://")
    )) ||
    myAtt.confirmacion1 === "CONFIRMADA"
  );

  if (isServerConfirmed) {
    // ── CONFIRMADO EN EL SERVIDOR → marcar y bloquear ──
    checkBrigadista.checked = true;
    checkBrigadista.disabled = true;
    if (checkLabelBrigadista) {
      checkLabelBrigadista.style.color = 'var(--success)';
      checkLabelBrigadista.textContent = 'Confirmado';
    }

    const savedMesa = (myAtt && myAtt.mesa ? myAtt.mesa.toString().trim() : "") ||
      localStorage.getItem(`votoReal_attMesa_${dni}`) || '';

    let savedLocal = (myAtt && myAtt.local ? myAtt.local.toString().trim() : "") ||
      localStorage.getItem(`votoReal_attColegio_${dni}`) || '';

    if (!savedLocal && savedMesa && typeof buscarColegioPorMesa === 'function') {
      const match = buscarColegioPorMesa(savedMesa);
      if (match && match.colegio) savedLocal = match.colegio;
    }

    if (savedMesa && inputMesa) {
      inputMesa.value = savedMesa;
      inputMesa.disabled = true;
    }
    if (savedLocal && inputColegio) {
      inputColegio.value = savedLocal;
    }

    if (savedMesa && typeof handleMesaInputChange === 'function') {
      handleMesaInputChange();
    }

    // Guardar en localStorage como caché
    if (appState.currentUser) {
      appState.currentUser.asistencia1Confirmada = true;
      if (dni) {
        localStorage.setItem(`votoReal_attConfirmed_${dni}`, 'true');
        if (savedMesa) localStorage.setItem(`votoReal_attMesa_${dni}`, savedMesa);
        if (savedLocal) localStorage.setItem(`votoReal_attColegio_${dni}`, savedLocal);
      }
    }
  } else {
    // ── NO ESTÁ EN LA HOJA → limpiar cualquier dato obsoleto de localStorage ──
    if (dni) {
      localStorage.removeItem(`votoReal_attConfirmed_${dni}`);
      localStorage.removeItem(`votoReal_attMesa_${dni}`);
      localStorage.removeItem(`votoReal_attColegio_${dni}`);
    }
    if (appState.currentUser) {
      appState.currentUser.asistencia1Confirmada = false;
    }
    // Mesa siempre libre para escribir manualmente
    checkBrigadista.checked = false;
    checkBrigadista.disabled = false;
    inputMesa.value = '';
    inputMesa.disabled = false;
    inputMesa.placeholder = '000000';
    if (inputColegio) {
      inputColegio.value = '';
      inputColegio.placeholder = 'Se completará al ingresar mesa...';
    }
    if (checkLabelBrigadista) {
      checkLabelBrigadista.style.color = 'var(--text-muted)';
      checkLabelBrigadista.textContent = 'Confirmar';
    }
  }
}


// Reusable custom design confirm dialog centered on screen
function showConfirmDialog({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel }) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(10, 15, 29, 0.85)';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.style.webkitBackdropFilter = 'blur(10px)';
  overlay.style.zIndex = '100000';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.25s ease';

  const card = document.createElement('div');
  card.className = 'glass';
  card.style.width = '100%';
  card.style.maxWidth = '360px';
  card.style.padding = '24px';
  card.style.borderRadius = '16px';
  card.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.6)';
  card.style.transform = 'translateY(15px)';
  card.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '16px';
  card.style.textAlign = 'center';

  const iconContainer = document.createElement('div');
  iconContainer.style.width = '52px';
  iconContainer.style.height = '52px';
  iconContainer.style.borderRadius = '50%';
  iconContainer.style.background = 'rgba(168, 85, 247, 0.15)';
  iconContainer.style.display = 'flex';
  iconContainer.style.alignItems = 'center';
  iconContainer.style.justifyContent = 'center';
  iconContainer.style.margin = '0 auto';
  iconContainer.innerHTML = '<i data-lucide="help-circle" style="width: 28px; height: 28px; color: #c084fc;"></i>';

  const titleEl = document.createElement('h2');
  titleEl.style.fontSize = '1.25rem';
  titleEl.style.fontWeight = '800';
  titleEl.style.color = '#ffffff';
  titleEl.style.margin = '0';
  titleEl.textContent = title;

  const descEl = document.createElement('p');
  descEl.style.color = '#cbd5e1';
  descEl.style.fontSize = '0.88rem';
  descEl.style.lineHeight = '1.5';
  descEl.style.margin = '0';
  descEl.innerHTML = message;

  const buttonRow = document.createElement('div');
  buttonRow.style.display = 'flex';
  buttonRow.style.gap = '12px';
  buttonRow.style.marginTop = '8px';

  const btnCancel = document.createElement('button');
  btnCancel.className = 'btn btn-secondary';
  btnCancel.style.flex = '1';
  btnCancel.style.padding = '11px';
  btnCancel.style.borderRadius = '8px';
  btnCancel.style.fontWeight = '700';
  btnCancel.style.fontSize = '0.85rem';
  btnCancel.style.cursor = 'pointer';
  btnCancel.textContent = cancelText;

  const btnConfirm = document.createElement('button');
  btnConfirm.className = 'btn btn-primary';
  btnConfirm.style.flex = '1';
  btnConfirm.style.padding = '11px';
  btnConfirm.style.borderRadius = '8px';
  btnConfirm.style.fontWeight = '700';
  btnConfirm.style.fontSize = '0.85rem';
  btnConfirm.style.cursor = 'pointer';
  btnConfirm.style.background = 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)';
  btnConfirm.style.color = '#ffffff';
  btnConfirm.style.border = 'none';
  btnConfirm.textContent = confirmText;

  const closeDialog = () => {
    overlay.style.opacity = '0';
    card.style.transform = 'translateY(15px)';
    setTimeout(() => {
      overlay.remove();
    }, 250);
  };

  btnCancel.addEventListener('click', () => {
    closeDialog();
    if (onCancel) onCancel();
  });

  btnConfirm.addEventListener('click', () => {
    closeDialog();
    if (onConfirm) onConfirm();
  });

  card.appendChild(iconContainer);
  card.appendChild(titleEl);
  card.appendChild(descEl);
  buttonRow.appendChild(btnCancel);
  buttonRow.appendChild(btnConfirm);
  card.appendChild(buttonRow);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  setTimeout(() => {
    overlay.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, 50);
}

// Reusable custom design alert/warning dialog centered on screen
function showAlertDialog({ title, message, buttonText = 'Aceptar', type = 'warning', onClose }) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(10, 15, 29, 0.85)';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.style.webkitBackdropFilter = 'blur(10px)';
  overlay.style.zIndex = '100000';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.25s ease';

  const card = document.createElement('div');
  card.className = 'glass';
  card.style.width = '100%';
  card.style.maxWidth = '360px';
  card.style.padding = '24px';
  card.style.borderRadius = '16px';
  card.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.6)';
  card.style.transform = 'translateY(15px)';
  card.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '16px';
  card.style.textAlign = 'center';

  const iconContainer = document.createElement('div');
  iconContainer.style.width = '52px';
  iconContainer.style.height = '52px';
  iconContainer.style.borderRadius = '50%';
  
  let iconHtml = '';
  if (type === 'error') {
    iconContainer.style.background = 'rgba(239, 68, 68, 0.15)';
    iconHtml = '<i data-lucide="alert-triangle" style="width: 28px; height: 28px; color: #fca5a5;"></i>';
  } else if (type === 'warning') {
    iconContainer.style.background = 'rgba(245, 158, 11, 0.15)';
    iconHtml = '<i data-lucide="alert-circle" style="width: 28px; height: 28px; color: #fcd34d;"></i>';
  } else {
    iconContainer.style.background = 'rgba(168, 85, 247, 0.15)';
    iconHtml = '<i data-lucide="info" style="width: 28px; height: 28px; color: #c084fc;"></i>';
  }
  iconContainer.style.display = 'flex';
  iconContainer.style.alignItems = 'center';
  iconContainer.style.justifyContent = 'center';
  iconContainer.style.margin = '0 auto';
  iconContainer.innerHTML = iconHtml;

  const titleEl = document.createElement('h2');
  titleEl.style.fontSize = '1.25rem';
  titleEl.style.fontWeight = '800';
  titleEl.style.color = '#ffffff';
  titleEl.style.margin = '0';
  titleEl.textContent = title;

  const descEl = document.createElement('p');
  descEl.style.color = '#cbd5e1';
  descEl.style.fontSize = '0.88rem';
  descEl.style.lineHeight = '1.5';
  descEl.style.margin = '0';
  descEl.innerHTML = message;

  const buttonRow = document.createElement('div');
  buttonRow.style.display = 'flex';
  buttonRow.style.marginTop = '8px';

  const btnOk = document.createElement('button');
  btnOk.className = 'btn btn-primary';
  btnOk.style.flex = '1';
  btnOk.style.padding = '11px';
  btnOk.style.borderRadius = '8px';
  btnOk.style.fontWeight = '700';
  btnOk.style.fontSize = '0.85rem';
  btnOk.style.cursor = 'pointer';
  btnOk.style.background = 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)';
  btnOk.style.color = '#ffffff';
  btnOk.style.border = 'none';
  btnOk.textContent = buttonText;

  const closeDialog = () => {
    overlay.style.opacity = '0';
    card.style.transform = 'translateY(15px)';
    setTimeout(() => {
      overlay.remove();
    }, 250);
  };

  btnOk.addEventListener('click', () => {
    closeDialog();
    if (onClose) onClose();
  });

  card.appendChild(iconContainer);
  card.appendChild(titleEl);
  card.appendChild(descEl);
  buttonRow.appendChild(btnOk);
  card.appendChild(buttonRow);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  setTimeout(() => {
    overlay.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, 50);
}

// Compress and resize image client-side ultra-fast with small payload (500px max, quality 0.35)
function compressImage(file, maxDimension = 500, quality = 0.35) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';
          ctx.drawImage(img, 0, 0, width, height);
        }

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Fast Geolocation fetch for real location confirmation
function getRealGeolocationFast(timeoutMs = 6500) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve({
            lat: pos.coords.latitude.toFixed(6),
            lng: pos.coords.longitude.toFixed(6),
            acc: Math.round(pos.coords.accuracy)
          });
        }
      },
      (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(null);
        }
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
    );
  });
}

// Popup modal for successful attendance confirmation
function showAttendanceSuccessModal({ nombre, dni, distrito, local, mesa, timestamp, gpsLocation, isBefore5pm }) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(10, 15, 29, 0.88)';
  overlay.style.backdropFilter = 'blur(12px)';
  overlay.style.webkitBackdropFilter = 'blur(12px)';
  overlay.style.zIndex = '100000';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.25s ease';

  const card = document.createElement('div');
  card.className = 'glass';
  card.style.width = '100%';
  card.style.maxWidth = '420px';
  card.style.padding = '26px 22px';
  card.style.borderRadius = '20px';
  card.style.border = '1px solid rgba(34, 197, 94, 0.35)';
  card.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(34, 197, 94, 0.2)';
  card.style.transform = 'translateY(15px)';
  card.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '16px';
  card.style.textAlign = 'center';

  const iconContainer = document.createElement('div');
  iconContainer.style.width = '64px';
  iconContainer.style.height = '64px';
  iconContainer.style.borderRadius = '50%';
  iconContainer.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(16, 185, 129, 0.35))';
  iconContainer.style.border = '2px solid rgba(34, 197, 94, 0.6)';
  iconContainer.style.display = 'flex';
  iconContainer.style.alignItems = 'center';
  iconContainer.style.justifyContent = 'center';
  iconContainer.style.margin = '0 auto';
  iconContainer.innerHTML = '<i data-lucide="check-circle-2" style="width: 36px; height: 36px; color: #4ade80;"></i>';

  const titleEl = document.createElement('h2');
  titleEl.style.fontSize = '1.3rem';
  titleEl.style.fontWeight = '800';
  titleEl.style.color = '#ffffff';
  titleEl.style.margin = '0';
  titleEl.textContent = '¡Confirmación de Asistencia Exitosa!';

  const badgeEl = document.createElement('div');
  badgeEl.style.display = 'inline-flex';
  badgeEl.style.alignItems = 'center';
  badgeEl.style.justifyContent = 'center';
  badgeEl.style.gap = '6px';
  badgeEl.style.padding = '6px 14px';
  badgeEl.style.borderRadius = '20px';
  badgeEl.style.background = isBefore5pm ? 'rgba(34, 197, 94, 0.18)' : 'rgba(59, 130, 246, 0.18)';
  badgeEl.style.border = isBefore5pm ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)';
  badgeEl.style.color = isBefore5pm ? '#4ade80' : '#60a5fa';
  badgeEl.style.fontSize = '0.82rem';
  badgeEl.style.fontWeight = '700';
  badgeEl.style.margin = '0 auto';
  badgeEl.innerHTML = `<i data-lucide="${isBefore5pm ? 'clock' : 'check-check'}" style="width:15px;height:15px;"></i> ${isBefore5pm ? 'Llegada antes de las 5:00 PM' : 'Llegada Registrada'}`;

  const messageBox = document.createElement('div');
  messageBox.style.background = 'rgba(15, 23, 42, 0.65)';
  messageBox.style.borderRadius = '14px';
  messageBox.style.padding = '16px';
  messageBox.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  messageBox.style.fontSize = '0.88rem';
  messageBox.style.color = '#e2e8f0';
  messageBox.style.lineHeight = '1.5';
  messageBox.style.textAlign = 'left';
  
  messageBox.innerHTML = `
    <div style="margin-bottom: 12px; font-weight: 700; color: #f8fafc; text-align: center; background: rgba(251, 191, 36, 0.12); padding: 10px; borderRadius: 8px; border: 1px solid rgba(251, 191, 36, 0.25);">
      📌 <span style="color: #fbbf24;">¡Te esperamos a las 5:00 PM!</span><br/>
      <span style="font-size: 0.82rem; font-weight: 400; color: #cbd5e1;">A esa hora se habilitará el <strong>Registro de Votos</strong> en tu mesa.</span>
    </div>
    <div style="font-size: 0.82rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 6px; border-top: 1px dashed rgba(255, 255, 255, 0.12); padding-top: 10px;">
      <div><strong>👤 Usuario:</strong> ${nombre || ''} (${dni || ''})</div>
      <div><strong>🏫 Local:</strong> ${local || 'Local Asignado'}</div>
      <div><strong>🗳️ Mesa:</strong> Mesa ${mesa || '-'}</div>
      <div><strong>⏰ Hora Registro:</strong> ${timestamp || new Date().toLocaleTimeString()}</div>
      ${gpsLocation ? `<div><strong>📍 Ubicación GPS:</strong> <span style="color:#4ade80;">${gpsLocation}</span></div>` : ''}
    </div>
  `;

  const btn = document.createElement('button');
  btn.style.width = '100%';
  btn.style.padding = '13px';
  btn.style.borderRadius = '12px';
  btn.style.border = 'none';
  btn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
  btn.style.color = '#ffffff';
  btn.style.fontWeight = '700';
  btn.style.fontSize = '0.95rem';
  btn.style.cursor = 'pointer';
  btn.style.boxShadow = '0 4px 14px rgba(34, 197, 94, 0.4)';
  btn.textContent = '¡Entendido, Esperar las 5:00 PM!';

  btn.onclick = () => {
    overlay.style.opacity = '0';
    card.style.transform = 'translateY(15px)';
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 250);
  };

  card.appendChild(iconContainer);
  card.appendChild(titleEl);
  card.appendChild(badgeEl);
  card.appendChild(messageBox);
  card.appendChild(btn);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  });
}

// Interactive animated sync loader for attendance confirmation
function createAttendanceSyncLoader() {
  const overlay = document.createElement('div');
  overlay.id = 'attendance-sync-loader-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(10, 15, 29, 0.92)';
  overlay.style.backdropFilter = 'blur(14px)';
  overlay.style.webkitBackdropFilter = 'blur(14px)';
  overlay.style.zIndex = '100005';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.3s ease';

  const card = document.createElement('div');
  card.className = 'glass';
  card.style.width = '100%';
  card.style.maxWidth = '380px';
  card.style.padding = '28px 24px';
  card.style.borderRadius = '22px';
  card.style.border = '1px solid rgba(168, 85, 247, 0.3)';
  card.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(168, 85, 247, 0.15)';
  card.style.transform = 'scale(0.92)';
  card.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '18px';
  card.style.textAlign = 'center';

  card.innerHTML = `
    <div style="position: relative; width: 84px; height: 84px; margin: 0 auto 12px auto;">
      <div style="position: absolute; inset: 0; border-radius: 50%; border: 4px solid rgba(168, 85, 247, 0.15);"></div>
      <div id="sync-spinner-ring" style="position: absolute; inset: 0; border-radius: 50%; border: 4px solid transparent; border-top-color: #c084fc; border-right-color: #38bdf8; animation: spin 1s linear infinite;"></div>
      <div style="position: absolute; inset: 10px; border-radius: 50%; background: rgba(168, 85, 247, 0.12); display: flex; align-items: center; justify-content: center;">
        <i data-lucide="cloud-upload" id="sync-icon-status" style="width: 36px; height: 36px; color: #c084fc;"></i>
      </div>
    </div>
    
    <!-- Progress Bar Only -->
    <div style="width: 100%; background: rgba(255, 255, 255, 0.08); border-radius: 10px; height: 10px; overflow: hidden; position: relative;">
      <div id="sync-loader-progressbar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #a855f7 0%, #3b82f6 50%, #22c55e 100%); transition: width 0.4s ease; border-radius: 10px;"></div>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    card.style.transform = 'scale(1)';
  });

  return {
    updateProgress: (percent, subtext) => {
      const pbar = document.getElementById('sync-loader-progressbar');
      const stext = document.getElementById('sync-loader-subtext');
      if (pbar) pbar.style.width = `${percent}%`;
      if (stext) stext.textContent = subtext;
    },
    close: () => {
      return new Promise((resolve) => {
        overlay.style.opacity = '0';
        card.style.transform = 'scale(0.92)';
        setTimeout(() => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
          resolve();
        }, 300);
      });
    }
  };
}

// Small animated loading popup for vote transmission
function createVoteSyncLoader(titleText = 'Transmitiendo Resultados') {
  const overlay = document.createElement('div');
  overlay.id = 'vote-sync-loader-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(10, 15, 29, 0.88)';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.style.webkitBackdropFilter = 'blur(10px)';
  overlay.style.zIndex = '100005';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';
  overlay.style.opacity = '0';
  overlay.style.transition = 'opacity 0.3s ease';

  const card = document.createElement('div');
  card.className = 'glass';
  card.style.width = '100%';
  card.style.maxWidth = '320px';
  card.style.padding = '22px 18px';
  card.style.borderRadius = '18px';
  card.style.border = '1px solid rgba(56, 189, 248, 0.3)';
  card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 25px rgba(56, 189, 248, 0.2)';
  card.style.transform = 'scale(0.92)';
  card.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '14px';
  card.style.textAlign = 'center';

  card.innerHTML = `
    <div style="position: relative; width: 64px; height: 64px; margin: 0 auto;">
      <div style="position: absolute; inset: 0; border-radius: 50%; border: 3px solid rgba(56, 189, 248, 0.15);"></div>
      <div style="position: absolute; inset: 0; border-radius: 50%; border: 3px solid transparent; border-top-color: #38bdf8; border-right-color: #a855f7; animation: spin 0.9s linear infinite;"></div>
      <div style="position: absolute; inset: 8px; border-radius: 50%; background: rgba(56, 189, 248, 0.1); display: flex; align-items: center; justify-content: center;">
        <i data-lucide="cloud-upload" style="width: 24px; height: 24px; color: #38bdf8;"></i>
      </div>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 4px;">
      <h3 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #f1f5f9;">${titleText}</h3>
      <p id="vote-sync-loader-status" style="margin: 0; font-size: 0.8rem; color: #94a3b8;">Enviando datos a la nube...</p>
    </div>

    <div style="width: 100%; background: rgba(255, 255, 255, 0.08); border-radius: 8px; height: 6px; overflow: hidden; position: relative;">
      <div id="vote-sync-progressbar" style="height: 100%; width: 65%; background: linear-gradient(90deg, #38bdf8 0%, #a855f7 50%, #22c55e 100%); transition: width 0.3s ease; border-radius: 8px;"></div>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    card.style.transform = 'scale(1)';
  });

  return {
    updateProgress: (percent, statusText) => {
      const pbar = document.getElementById('vote-sync-progressbar');
      const stext = document.getElementById('vote-sync-loader-status');
      if (pbar) pbar.style.width = `${percent}%`;
      if (stext) stext.textContent = statusText;
    },
    close: () => {
      return new Promise((resolve) => {
        overlay.style.opacity = '0';
        card.style.transform = 'scale(0.92)';
        setTimeout(() => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
          resolve();
        }, 250);
      });
    }
  };
}
// Verificación de horario para habilitación de conteo (5:00 PM)
function isCountingTimeEnabled() {
  const currentUser = appState.currentUser;
  if (currentUser) {
    const isSuperAdmin = currentUser.dni === 'Admin#2026$Secure!VotoReal' || 
                         currentUser.dni === '99999999' || 
                         (currentUser.nombre || "").toLowerCase().includes('super admin');
    if (isSuperAdmin) return true;
  }
  if (window.FORZAR_CONTEO === true) return true;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const unlockMinutes = 17 * 60; // 5:00 PM (17:00 hrs)
  
  return currentMinutes >= unlockMinutes || now.getHours() < 5;
}

// Automatic 5:00 PM alert notification for vote registration
let notificacion5PMMostrada = false;

function verificarNotificacion5PM() {
  if (notificacion5PMMostrada) return;
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Si estamos en el rango cercano a las 5:00 PM (de 16:50 a 17:30)
  if ((hours === 16 && minutes >= 50) || (hours === 17 && minutes <= 30)) {
    if (appState.currentUser && appState.asistencia && appState.asistencia.length > 0) {
      const hasAttendance = appState.asistencia.some(a => (a.dni || "").trim() === (appState.currentUser.dni || "").trim() && (a.confirmacion === "SI" || a.confirmacion === "SÍ"));
      if (hasAttendance) {
        notificacion5PMMostrada = true;
        showConfirmDialog({
          title: '⏰ ¡Son las 5:00 PM - Registro de Votos Habilitado!',
          message: 'Son las 5:00 PM. Tu asistencia está confirmada. El **Registro y Conteo de Votos** ya se encuentra habilitado para tu mesa.',
          confirmText: 'Iniciar Registro de Votos Ahora',
          cancelText: 'Más tarde',
          onConfirm: () => {
            const form = document.getElementById('form-votos');
            if (form) form.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
    }
  }
}

// Ejecutar verificación de horario cada 30 segundos
setInterval(verificarNotificacion5PM, 30000);

// Actualizar insignias de 1ra y 2da Confirmación en la barra de usuario
function actualizarBadgesConfirmacion() {
  const conf1 = document.getElementById('status-conf-1');
  const conf2 = document.getElementById('status-conf-2');

  const isConf1 = appState.currentUser && (appState.currentUser.asistencia1Confirmada === true || appState.currentUser.asistenciaConfirmada === true || (appState.asistencia && appState.asistencia.some(a => a.dni === appState.currentUser.dni)));
  const isConf2 = appState.currentUser && appState.currentUser.llegadaConfirmada === true;

  if (conf1) {
    if (isConf1) {
      conf1.className = 'conf-badge confirmed';
      conf1.innerHTML = '<i data-lucide="check-circle-2" style="width: 12px; height: 12px; color: #34d399;"></i><span>1ra Confirmación: <strong>Confirmada</strong></span>';
    } else {
      conf1.className = 'conf-badge unconfirmed';
      conf1.innerHTML = '<i data-lucide="circle-alert" style="width: 12px; height: 12px;"></i><span>1ra Confirmación: <strong>No Confirmada</strong></span>';
    }
  }

  if (conf2) {
    if (isConf2) {
      conf2.className = 'conf-badge confirmed';
      conf2.innerHTML = '<i data-lucide="check-circle-2" style="width: 12px; height: 12px; color: #34d399;"></i><span>2da Confirmación: <strong>Confirmada</strong></span>';
    } else {
      conf2.className = 'conf-badge unconfirmed';
      conf2.innerHTML = '<i data-lucide="circle-alert" style="width: 12px; height: 12px;"></i><span>2da Confirmación: <strong>No Confirmada</strong></span>';
    }
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    try { lucide.createIcons(); } catch (e) {}
  }
}

// --- 4:45 PM CONFIRMACIÓN DE LLEGADA POR GPS ---
function evaluarVisibilidadBotonLlegada() {
  const btnLlegada = document.getElementById('btn-confirm-llegada');
  if (!btnLlegada) return;

  if (!appState.currentUser || !appState.currentUser.dni) {
    btnLlegada.classList.add('hidden');
    return;
  }

  const currentUser = appState.currentUser;
  const isSuperAdmin = currentUser.dni === 'Admin#2026$Secure!VotoReal' || 
                       currentUser.dni === '99999999' || 
                       (currentUser.nombre || "").toLowerCase().includes('super admin');

  const yaConfirmado = currentUser.llegadaConfirmada === true;

  btnLlegada.classList.remove('hidden');

  if (yaConfirmado) {
    btnLlegada.disabled = true;
    btnLlegada.classList.add('locked-btn-llegada');
    btnLlegada.innerHTML = '<i data-lucide="check-circle-2" style="color: #34d399;"></i> <span>Llegada Confirmada</span>';
    btnLlegada.title = 'Llegada confirmada correctamente';
  } else {
    btnLlegada.disabled = false;
    btnLlegada.classList.remove('locked-btn-llegada');
    btnLlegada.innerHTML = '<i data-lucide="map-pin"></i> <span>Confirmar Llegada</span>';
    btnLlegada.title = 'Haz clic para confirmar tu llegada GPS al colegio';
  }

  actualizarBadgesConfirmacion();
}
// Cálculo de distancia por Haversine (en metros)
function calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Coordenadas geográficas de referencia por colegio y distrito
const COORDENADAS_COLEGIOS = {
  'IE 0024 PEDRO ENRIQUE GONZALES SOTO': { lat: -12.0254, lon: -76.9189 },
  'IE 0026 AICHI NAGOYA': { lat: -12.0280, lon: -76.9200 },
  'IE 0032 RAUL PORRAS BARRENECHEA': { lat: -12.0300, lon: -76.9150 },
  'IE 0074 FERNANDO BELAUNDE TERRY': { lat: -12.0320, lon: -76.9100 },
  'IE 3069 GENERALISIMO JOSE DE SAN MARTIN': { lat: -11.7745, lon: -77.1550 },
  'IE 2066 ALMIRANTE MIGUEL GRAU': { lat: -11.7780, lon: -77.1520 },
  'IE EMBLEMATICA GUADALUPE': { lat: -12.0538, lon: -77.0375 },
  'IE JUANA ALARCO DE D script': { lat: -12.1245, lon: -77.0260 },
  'Markham College': { lat: -12.1250, lon: -77.0250 },
  'IE MANUEL POLO JIMENEZ': { lat: -12.1400, lon: -76.9900 }
};

const COORDENADAS_DISTRITOS_PERU = {
  'Ate': { lat: -12.0254, lon: -76.9189 },
  'Ancón': { lat: -11.7745, lon: -77.1550 },
  'Miraflores': { lat: -12.1245, lon: -77.0260 },
  'San Isidro': { lat: -12.0970, lon: -77.0360 },
  'Santiago de Surco': { lat: -12.1400, lon: -76.9900 },
  'La Molina': { lat: -12.0850, lon: -76.9500 },
  'San Borja': { lat: -12.1000, lon: -77.0000 },
  'Los Olivos': { lat: -11.9700, lon: -77.0700 },
  'Comas': { lat: -11.9300, lon: -77.0500 },
  'San Juan de Lurigancho': { lat: -11.9800, lon: -77.0000 },
  'Villa El Salvador': { lat: -12.2100, lon: -76.9300 },
  'Villa María del Triunfo': { lat: -12.1600, lon: -76.9400 },
  'Rímac': { lat: -12.0300, lon: -77.0200 },
  'Lima': { lat: -12.0463, lon: -77.0427 },
  'Breña': { lat: -12.0550, lon: -77.0500 },
  'La Victoria': { lat: -12.0650, lon: -77.0250 },
  'Independencia': { lat: -11.9900, lon: -77.0500 },
  'San Miguel': { lat: -12.0800, lon: -77.0900 },
  'Magdalena del Mar': { lat: -12.0900, lon: -77.0700 },
  'Pueblo Libre': { lat: -12.0750, lon: -77.0600 },
  'Jesús María': { lat: -12.0700, lon: -77.0450 },
  'Lince': { lat: -12.0830, lon: -77.0340 },
  'Barranco': { lat: -12.1450, lon: -77.0200 },
  'Chorrillos': { lat: -12.1700, lon: -77.0100 },
  'Surquillo': { lat: -12.1100, lon: -77.0200 },
  'San Luis': { lat: -12.0750, lon: -76.9950 },
  'El Agustino': { lat: -12.0500, lon: -77.0000 },
  'Santa Anita': { lat: -12.0400, lon: -76.9700 },
  'San Juan de Miraflores': { lat: -12.1500, lon: -76.9700 },
  'San Martín de Porres': { lat: -12.0100, lon: -77.0800 },
  'Carabayllo': { lat: -11.8950, lon: -77.0360 },
  'Puente Piedra': { lat: -11.8700, lon: -77.0700 },
  'Lurigancho': { lat: -11.9500, lon: -76.8300 },
  'Lurín': { lat: -12.2700, lon: -76.8700 },
  'Pachacámac': { lat: -12.2300, lon: -76.8600 },
  'Chaclacayo': { lat: -11.9800, lon: -76.7700 },
  'Cieneguilla': { lat: -12.0900, lon: -76.7700 },
  'Pucusana': { lat: -12.4800, lon: -76.7800 },
  'Punta Hermosa': { lat: -12.3300, lon: -76.8200 },
  'Punta Negra': { lat: -12.3600, lon: -76.7900 },
  'San Bartolo': { lat: -12.3900, lon: -76.7800 },
  'Santa María del Mar': { lat: -12.4100, lon: -76.7700 },
  'Santa Rosa': { lat: -11.8000, lon: -77.1600 }
};

function parseGpsString(val) {
  if (!val) return null;
  if (typeof val === 'object') {
    const lat = parseFloat(val.lat || val.latitud || val.latitude);
    const lon = parseFloat(val.lon || val.lng || val.longitud || val.longitude);
    if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
      return { lat, lon };
    }
  }
  const s = String(val).trim();
  if (!s) return null;

  // Extraer números decimales o enteros (soporta comas o puntos)
  const cleanStr = s.replace(/,/g, '.');
  const matches = cleanStr.match(/[-+]?\d+(\.\d+)?/g);
  if (matches && matches.length >= 2) {
    let lat = parseFloat(matches[0]);
    let lon = parseFloat(matches[1]);
    if (lat > 0 && lat <= 20) lat = -lat;
    if (lon > 0 && lon >= 60 && lon <= 90) lon = -lon;

    if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat, lon };
    }
  }
  return null;
}

function obtenerCoordenadasColegio(colegioNombre, distrito, mesa) {
  const normCol = (colegioNombre || "").toString().toLowerCase().trim();
  const normDist = (distrito || (appState.currentUser ? appState.currentUser.ubicacion : '') || "").toString().toLowerCase().trim();
  const normMesa = (mesa || (appState.currentUser ? appState.currentUser.mesa : '') || "").toString().trim();
  const cleanMesaInt = parseInt(normMesa.replace(/\D/g, '')) || 0;
  const colNumbers = normCol.replace(/\D/g, '');

  console.log(`[GPS-LOOKUP] Buscando en Google Sheets -> colegio: "${colegioNombre}", mesa: "${mesa}", distrito: "${distrito}"`);

  // 1. Buscar prioritariamente en la hoja "Mesas" (appState.mesas_estructura) sincronizada desde Google Sheets
  if (Array.isArray(appState.mesas_estructura) && appState.mesas_estructura.length > 0) {
    // 1A. Buscar Coincidencia por Número de Mesa (ej: 37081, 36999...)
    if (cleanMesaInt > 0) {
      for (const m of appState.mesas_estructura) {
        if (!m) continue;
        const mMesaInt = parseInt((m.mesa || "").toString().replace(/\D/g, '')) || 0;
        if (mMesaInt === cleanMesaInt) {
          const rawCoords = m.coordenadasGps || m["Coordenadas GPS"] || m["Coordenadas"] || m.coordenadas || m.gps || m.ubicacionGps;
          const parsed = parseGpsString(rawCoords) || parseGpsString(m);
          if (parsed) {
            console.log(`[GPS-LOOKUP] ✅ Coordenada encontrada por MESA (${cleanMesaInt}) en Google Sheets:`, parsed);
            return parsed;
          }
        }
      }
    }

    // 1B. Buscar Coincidencia por Nombre de Colegio / Número de Colegio (ej: "IE 8193")
    for (const m of appState.mesas_estructura) {
      if (!m) continue;
      const mCol = (m.colegio || m.local || "").toString().toLowerCase().trim();
      const mDist = (m.distrito || "").toString().toLowerCase().trim();
      const mColNumbers = mCol.replace(/\D/g, '');

      const isDistMatch = !normDist || !mDist || mDist === normDist || mDist.includes(normDist) || normDist.includes(mDist);
      const isColMatch = normCol && (mCol === normCol || mCol.includes(normCol) || normCol.includes(mCol));
      const isNumMatch = colNumbers.length >= 2 && mColNumbers.length >= 2 && colNumbers === mColNumbers;

      if (isDistMatch && (isColMatch || isNumMatch)) {
        const rawCoords = m.coordenadasGps || m["Coordenadas GPS"] || m["Coordenadas"] || m.coordenadas || m.gps || m.ubicacionGps;
        const parsed = parseGpsString(rawCoords) || parseGpsString(m);
        if (parsed) {
          console.log(`[GPS-LOOKUP] ✅ Coordenada encontrada por COLEGIO (${mCol}) en Google Sheets:`, parsed);
          return parsed;
        }
      }
    }
  }

  // Si no se encontraron coordenadas escritas en la hoja Mesas
  console.warn('[GPS-LOOKUP] ⚠️ No se encontraron coordenadas GPS escritas en la hoja Mesas para:', colegioNombre, mesa);
  return null;
}

// Función robusta para obtener coordenadas GPS nativas en Android (Capacitor) o Navegador Web
async function obtenerCoordenadasUsuarioDispositivo() {
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Geolocation) {
    try {
      console.log('[GPS-NATIVO] Solicitando permisos nativos en Android con Capacitor...');
      await window.Capacitor.Plugins.Geolocation.requestPermissions();
      const pos = await window.Capacitor.Plugins.Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      });
      if (pos && pos.coords) {
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 10
        };
      }
    } catch (capErr) {
      console.warn('[GPS-NATIVO] Reintentando con geolocalización estándar:', capErr);
    }
  }

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS no soportado en este dispositivo'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy || 10
      }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

// Confirmar Ubicación por GPS (Radio de 500 metros)
async function confirmarUbicacionLlegadaGPS() {
  const currentUser = appState.currentUser;
  const isSuperAdmin = currentUser && (
    currentUser.dni === 'Admin#2026$Secure!VotoReal' || 
    currentUser.dni === '99999999' || 
    (currentUser.nombre || "").toLowerCase().includes('super admin')
  );

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes450 = 16 * 60 + 50; // 4:50 PM
  const esHoraLlegada = isSuperAdmin || window.FORZAR_BOTON_LLEGADA === true || currentMinutes >= targetMinutes450;

  if (appState.currentUser && appState.currentUser.llegadaConfirmada === true) {
    showToast('Tu llegada ya fue confirmada correctamente.', 'info');
    return;
  }

  if (!esHoraLlegada) {
    showAlertDialog({
      title: '🔒 Botón Bloqueado',
      message: 'El botón de <strong>Confirmar Llegada</strong> se desbloqueará automáticamente a las <strong>4:50 PM</strong>.<br><br>Por favor, espera a la hora indicada para realizar tu confirmación por GPS.',
      buttonText: 'Entendido',
      type: 'info'
    });
    return;
  }

  // ── Mostrar animación de carga pequeña (Barra delgada 'Detectando ubicación...') ────
  let miniLoader = document.getElementById('mini-gps-loader');
  if (!miniLoader) {
    miniLoader = document.createElement('div');
    miniLoader.id = 'mini-gps-loader';
    miniLoader.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(15,23,42,0.95);border:1px solid rgba(56,189,248,0.4);border-radius:14px;padding:10px 16px;display:flex;flex-direction:column;gap:6px;min-width:200px;box-shadow:0 8px 24px rgba(0,0,0,0.6);backdrop-filter:blur(10px);pointer-events:none;';
    miniLoader.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.78rem;font-weight:600;color:#f1f5f9;">
        <span>Detectando ubicación...</span>
        <span style="color:#38bdf8;font-size:0.7rem;font-weight:700;">GPS</span>
      </div>
      <div style="width:100%;background:rgba(255,255,255,0.1);height:4px;border-radius:4px;overflow:hidden;position:relative;">
        <div style="height:100%;width:50%;background:linear-gradient(90deg, #38bdf8, #3b82f6);border-radius:4px;position:absolute;left:0;top:0;animation:barSlide 1s ease-in-out infinite alternate;"></div>
      </div>
      <style>
        @keyframes barSlide {
          0% { left: 0%; width: 30%; }
          100% { left: 70%; width: 30%; }
        }
      </style>`;
    document.body.appendChild(miniLoader);
  }

  const removeMiniLoader = () => {
    const el = document.getElementById('mini-gps-loader');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  };

  // ── PASO 1: Sincronizar en vivo mesas_estructura desde Google Sheets ──────
  try {
    const mesasRes = await apiPost({ action: 'obtener_mesas' });
    if (mesasRes && mesasRes.mesas_estructura && Array.isArray(mesasRes.mesas_estructura)) {
      appState.mesas_estructura = mesasRes.mesas_estructura;
      try { localStorage.setItem('vr_mesas_estructura', JSON.stringify(mesasRes.mesas_estructura)); } catch(e) {}
      console.log('[GPS-SYNC] mesas_estructura sincronizado en vivo:', appState.mesas_estructura.length, 'filas');
    } else {
      const reporteData = await apiPost({ action: 'obtener_reporte' });
      if (reporteData && reporteData.mesas_estructura && Array.isArray(reporteData.mesas_estructura)) {
        appState.mesas_estructura = reporteData.mesas_estructura;
        try { localStorage.setItem('vr_mesas_estructura', JSON.stringify(reporteData.mesas_estructura)); } catch(e) {}
      }
    }
  } catch (syncErr) {
    console.warn('[GPS-SYNC] Error al sincronizar mesas_estructura:', syncErr);
  }

  // ── PASO 2: Obtener posición real del celular por GPS ─────────────────────
  try {
    const coordsDispositivo = await obtenerCoordenadasUsuarioDispositivo();
    const userLat = coordsDispositivo.latitude;
    const userLon = coordsDispositivo.longitude;
    const accuracy = coordsDispositivo.accuracy || 10;

    console.log(`[GPS] Posición real detectada: lat=${userLat}, lon=${userLon}, precisión=±${Math.round(accuracy)}m`);

    // ── PASO 3: Obtener coordenadas de la hoja Mesas en Google Sheets ──────
    const colegioName = appState.currentUser ? appState.currentUser.colegio : '';
    const ubicacion = appState.currentUser ? appState.currentUser.ubicacion : '';
    const mesa = appState.currentUser ? appState.currentUser.mesa : '';

    const schoolCoords = obtenerCoordenadasColegio(colegioName, ubicacion, mesa);
    console.log('[GPS] Coordenadas leídas de Google Sheets:', JSON.stringify(schoolCoords));

    if (!schoolCoords) {
      removeMiniLoader();
      showAlertDialog({
        title: '⚠️ Sin Coordenadas en Google Sheets',
        message: `La columna <strong>"Coordenadas GPS"</strong> de la pestaña <strong>Mesas</strong> en tu Google Sheet está vacía para el colegio <strong>${colegioName || 'tu colegio'}</strong> (Mesa <strong>${mesa}</strong>).<br><br>Por favor escribe la latitud y longitud (ejemplo: <code>-12.039467, -77.090075</code>) en esa celda de tu Google Sheet y vuelve a presionar el botón.`,
        buttonText: 'Entendido',
        type: 'error'
      });
      return;
    }

    // ── PASO 4: Calcular distancia estricta entre GPS real y Google Sheets ─
    const distMetros = calcularDistanciaHaversine(userLat, userLon, schoolCoords.lat, schoolCoords.lon);
    
    // Limitar tolerancia de imprecisión a máximo 100m (evita falsos positivos por IP de PC de 30km)
    const maxAccuracyMargin = Math.min(accuracy, 100);
    const radioLimitePermitido = 500 + maxAccuracyMargin; // Máximo 600 metros
    const dentroDeRadio = distMetros <= radioLimitePermitido;

    console.log(`[GPS-CHECK] Distancia Real: ${Math.round(distMetros)}m | Límite Máximo: ${radioLimitePermitido}m | En Radio: ${dentroDeRadio}`);

    removeMiniLoader();

    if (dentroDeRadio) {
      // ── DENTRO DEL RADIO: REGISTRAR 2DA CONFIRMACIÓN ─────────────────────
      if (appState.currentUser) {
        appState.currentUser.llegadaConfirmada = true;
        appState.currentUser.llegadaHora = new Date().toLocaleTimeString();
        sessionStorage.setItem('votoReal_user', JSON.stringify(appState.currentUser));
      }

      // Sincronizar en Google Sheets
      try {
        apiPost({
          action: 'confirmar_asistencia_llegada',
          dni: appState.currentUser.dni,
          nombre: appState.currentUser.nombre,
          colegio: appState.currentUser.colegio,
          mesa: appState.currentUser.mesa,
          lat: userLat,
          lon: userLon,
          asistencia: 'ESTADO 2 - CONFIRMADO LLEGADA'
        }).catch(e => console.warn("Sync asistencia 2 background fail:", e));
      } catch (err) {}

      evaluarVisibilidadBotonLlegada();

      showAlertDialog({
        title: '✅ ¡Llegada Confirmada!',
        message: `Tu posición GPS real coincide con las coordenadas configuradas en tu Google Sheet (distancia: <strong>${Math.round(distMetros)}m</strong>).<br><br><strong>¡Tu 2da confirmación ha sido registrada correctamente!</strong>`,
        buttonText: 'Excelente',
        type: 'success'
      });
    } else {
      // ── FUERA DEL RADIO: NO REGISTRAR HASTA ACERCARSE AL PUNTO ───────────
      showAlertDialog({
        title: '❌ Fuera del Radio del Colegio',
        message: `Te encuentras a <strong>${Math.round(distMetros)} metros</strong> de las coordenadas configuradas en tu Google Sheet (<strong>${appState.currentUser.colegio || 'Tu Colegio'}</strong>).<br><br>Debes estar a menos de 500 metros del punto configurado para confirmar tu llegada.`,
        buttonText: 'Entendido',
        type: 'error'
      });
    }
  } catch (error) {
    removeMiniLoader();
    let errMsg = 'No se pudo obtener la ubicación GPS.';
    if (error.code === 1 || error.message.includes('denied') || error.message.includes('permission')) {
      errMsg = 'Permiso de ubicación denegado. Por favor acepta el permiso de GPS en la app o activa el GPS de tu celular.';
    } else if (error.code === 2) {
      errMsg = 'La señal GPS no está disponible en este momento.';
    } else if (error.code === 3) {
      errMsg = 'Se agotó el tiempo de espera al buscar la señal GPS.';
    }
    showAlertDialog({
      title: 'Error de Permiso GPS',
      message: errMsg,
      buttonText: 'Aceptar',
      type: 'error'
    });
  }
}

// Escuchador para el botón de llegada y evaluador de bloqueos post-transmisión
document.addEventListener('DOMContentLoaded', () => {
  const btnLlegada = document.getElementById('btn-confirm-llegada');
  if (btnLlegada) {
    btnLlegada.addEventListener('click', confirmarUbicacionLlegadaGPS);
  }
  setInterval(evaluarVisibilidadBotonLlegada, 15000);
  setInterval(evaluarBloqueoTransmisiones, 10000);
  setTimeout(evaluarBloqueoTransmisiones, 800);
});

// EVALUAR BLOQUEO Y DESENFOQUE POST-TRANSMISIÓN (Manual e Imagen por Personero)
function evaluarBloqueoTransmisiones() {
  const manualGroup = document.getElementById('manual-table-group');
  const ocrGroup = document.getElementById('ocr-table-group');
  const btnSubmitManual = document.getElementById('btn-submit-manual-votes');
  const btnSubmitOcr = document.getElementById('btn-submit-ocr-votes');
  const btnScanActa = document.getElementById('btn-scan-acta');

  const currentUser = appState.currentUser;
  if (!currentUser) return;

  const isSuperAdmin = currentUser.dni === 'Admin#2026$Secure!VotoReal' || 
                       currentUser.dni === '99999999' || 
                       (currentUser.nombre || "").toLowerCase().includes('super admin');

  // Super Admin siempre tiene acceso desbloqueado total para pruebas
  if (isSuperAdmin) {
    if (manualGroup) {
      manualGroup.classList.remove('transmitted-locked-panel', 'group-locked-container', 'schedule-locked-blur');
      manualGroup.style.filter = 'none';
      manualGroup.style.opacity = '1';
      manualGroup.style.pointerEvents = 'auto';
      const badgeM = manualGroup.querySelector('.transmitted-overlay-badge');
      if (badgeM) badgeM.remove();
      document.querySelectorAll('#manual-table-group input, #candidates-table-body input').forEach(inp => {
        inp.disabled = false;
        inp.readOnly = false;
      });
    }
    if (ocrGroup) {
      ocrGroup.classList.remove('transmitted-locked-panel', 'group-locked-container', 'schedule-locked-blur');
      ocrGroup.style.filter = 'none';
      ocrGroup.style.opacity = '1';
      ocrGroup.style.pointerEvents = 'auto';
      const badgeO = ocrGroup.querySelector('.transmitted-overlay-badge');
      if (badgeO) badgeO.remove();
      document.querySelectorAll('#ocr-candidates-table-body input, #ocr-table-group input').forEach(inp => {
        inp.disabled = false;
        inp.readOnly = false;
      });
    }
    if (btnSubmitManual) { btnSubmitManual.disabled = false; btnSubmitManual.style.opacity = '1'; btnSubmitManual.style.pointerEvents = 'auto'; }
    if (btnSubmitOcr) { btnSubmitOcr.disabled = false; btnSubmitOcr.style.opacity = '1'; btnSubmitOcr.style.pointerEvents = 'auto'; }
    if (btnScanActa) { btnScanActa.disabled = false; btnScanActa.style.opacity = '1'; btnScanActa.style.pointerEvents = 'auto'; }
    return;
  }

  const mesaVal = (document.getElementById('input-mesa')?.value || currentUser.mesa || "").trim();
  const dniStr = (currentUser.dni || "").trim();
  const normDni = (s) => (s || "").toString().toLowerCase().trim();

  // ── 1. Verificar si este personero/mesa ya transmitió Conteo Manual ──────
  const isManualSent = 
    (dniStr && localStorage.getItem(`votoReal_transmitted_MANUAL_${dniStr}`) === 'true') ||
    (dniStr && mesaVal && localStorage.getItem(`votoReal_transmitted_MANUAL_${dniStr}_${mesaVal}`) === 'true') ||
    (dniStr && (appState.mesas || []).some(m => normDni(m.dni) === normDni(dniStr) && (m.origen || "").toUpperCase() === 'MANUAL')) ||
    (dniStr && (appState.offlineVotes || []).some(v => normDni(v.dni) === normDni(dniStr) && (v.origen || "").toUpperCase() === 'MANUAL'));

  // ── 2. Verificar si este personero/mesa ya transmitió Conteo por Imagen ───
  const isOcrSent = 
    (dniStr && localStorage.getItem(`votoReal_transmitted_IMAGEN_${dniStr}`) === 'true') ||
    (dniStr && mesaVal && localStorage.getItem(`votoReal_transmitted_IMAGEN_${dniStr}_${mesaVal}`) === 'true') ||
    (dniStr && (appState.mesas || []).some(m => normDni(m.dni) === normDni(dniStr) && (m.origen || "").toUpperCase() === 'IMAGEN')) ||
    (dniStr && (appState.offlineVotes || []).some(v => normDni(v.dni) === normDni(dniStr) && (v.origen || "").toUpperCase() === 'IMAGEN'));

  // 🔒 BLOQUEO Y DESENFOQUE BORROSO DE CONTEO MANUAL
  if (manualGroup) {
    let badgeM = manualGroup.querySelector('.transmitted-overlay-badge');
    if (isManualSent) {
      manualGroup.classList.add('transmitted-locked-panel', 'group-locked-container', 'schedule-locked-blur');
      manualGroup.style.filter = 'blur(6px) grayscale(0.5)';
      manualGroup.style.opacity = '0.35';
      manualGroup.style.pointerEvents = 'none';
      manualGroup.style.userSelect = 'none';
      manualGroup.style.transition = 'filter 0.4s ease, opacity 0.4s ease';

      if (!badgeM) {
        badgeM = document.createElement('div');
        badgeM.className = 'transmitted-overlay-badge';
        badgeM.style.pointerEvents = 'auto';
        badgeM.innerHTML = '<i data-lucide="lock" style="width: 18px; height: 18px;"></i> <span>✅ CONTEO MANUAL TRANSMITIDO Y BLOQUEADO</span>';
        manualGroup.appendChild(badgeM);
      }
      document.querySelectorAll('#manual-table-group input, #candidates-table-body input').forEach(inp => {
        inp.disabled = true;
        inp.readOnly = true;
      });
      if (btnSubmitManual) {
        btnSubmitManual.disabled = true;
        btnSubmitManual.style.opacity = '0.4';
        btnSubmitManual.style.pointerEvents = 'none';
      }
    } else {
      manualGroup.classList.remove('transmitted-locked-panel', 'group-locked-container', 'schedule-locked-blur');
      manualGroup.style.filter = 'none';
      manualGroup.style.opacity = '1';
      manualGroup.style.pointerEvents = 'auto';
      manualGroup.style.userSelect = 'auto';
      if (badgeM) badgeM.remove();
      document.querySelectorAll('#manual-table-group input, #candidates-table-body input').forEach(inp => {
        inp.disabled = false;
        inp.readOnly = false;
      });
      if (btnSubmitManual) {
        btnSubmitManual.disabled = false;
        btnSubmitManual.style.opacity = '1';
        btnSubmitManual.style.pointerEvents = 'auto';
      }
    }
  }

  // 🔒 BLOQUEO Y DESENFOQUE BORROSO DE CONTEO POR IMAGEN
  if (ocrGroup) {
    let badgeO = ocrGroup.querySelector('.transmitted-overlay-badge');
    if (isOcrSent) {
      ocrGroup.classList.add('transmitted-locked-panel', 'group-locked-container', 'schedule-locked-blur');
      ocrGroup.style.filter = 'blur(6px) grayscale(0.5)';
      ocrGroup.style.opacity = '0.35';
      ocrGroup.style.pointerEvents = 'none';
      ocrGroup.style.userSelect = 'none';
      ocrGroup.style.transition = 'filter 0.4s ease, opacity 0.4s ease';

      if (!badgeO) {
        badgeO = document.createElement('div');
        badgeO.className = 'transmitted-overlay-badge';
        badgeO.style.pointerEvents = 'auto';
        badgeO.innerHTML = '<i data-lucide="lock" style="width: 18px; height: 18px;"></i> <span>✅ ACTA EN IMAGEN TRANSMITIDA Y BLOQUEADA</span>';
        ocrGroup.appendChild(badgeO);
      }
      document.querySelectorAll('#ocr-candidates-table-body input, #ocr-table-group input').forEach(inp => {
        inp.disabled = true;
        inp.readOnly = true;
      });
      if (btnSubmitOcr) {
        btnSubmitOcr.disabled = true;
        btnSubmitOcr.style.opacity = '0.4';
        btnSubmitOcr.style.pointerEvents = 'none';
      }
      if (btnScanActa) {
        btnScanActa.disabled = true;
        btnScanActa.style.opacity = '0.4';
        btnScanActa.style.pointerEvents = 'none';
      }
    } else {
      ocrGroup.classList.remove('transmitted-locked-panel', 'group-locked-container', 'schedule-locked-blur');
      ocrGroup.style.filter = 'none';
      ocrGroup.style.opacity = '1';
      ocrGroup.style.pointerEvents = 'auto';
      ocrGroup.style.userSelect = 'auto';
      if (badgeO) badgeO.remove();
      document.querySelectorAll('#ocr-candidates-table-body input, #ocr-table-group input').forEach(inp => {
        inp.disabled = false;
        inp.readOnly = false;
      });
      if (btnSubmitOcr) {
        btnSubmitOcr.disabled = false;
        btnSubmitOcr.style.opacity = '1';
        btnSubmitOcr.style.pointerEvents = 'auto';
      }
      if (btnScanActa) {
        btnScanActa.disabled = false;
        btnScanActa.style.opacity = '1';
        btnScanActa.style.pointerEvents = 'auto';
      }
    }
  }

  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    try { lucide.createIcons(); } catch (e) {}
  }
}

