// --- AUTENTICACIÓN Y SINCRONIZACIÓN DE USUARIOS ---
// URL centralizada en config.js como DEFAULT_API_URL
// Login valida contra Google Sheets (Usuarios + Usuarios1).

let isFetchingUsers = false;
let userDbFetchedThisSession = false;
let activeUserFetchPromise = null;
let gasWarmupDone = false;
window.votoReal_usuariosDbInMemory = window.votoReal_usuariosDbInMemory || null;

// ─────────────────────────────────────────────────────────
// CALENTAMIENTO DE GAS (warm-up)
// Envía un ping liviano al script para despertarlo ANTES
// de que el usuario haga clic en "Ingresar".
// ─────────────────────────────────────────────────────────
function warmUpGAS() {
  if (gasWarmupDone) return;
  const apiUrl = (typeof appState !== 'undefined' && appState.apiUrl)
    ? appState.apiUrl
    : (typeof DEFAULT_API_URL !== 'undefined' ? DEFAULT_API_URL : '');
  if (!apiUrl) return;

  console.log('[Auth] Calentando GAS en segundo plano...');
  fetch(`${apiUrl}?action=login&dni=__warmup__`, { method: 'GET' })
    .then(() => {
      gasWarmupDone = true;
      console.log('[Auth] GAS calentado ✓');
    })
    .catch(() => {});
}

function fetchAsistenciaDb() {
  const apiUrl = (typeof appState !== 'undefined' && appState.apiUrl)
    ? appState.apiUrl
    : (typeof DEFAULT_API_URL !== 'undefined' ? DEFAULT_API_URL : '');
  if (!apiUrl) return Promise.resolve();

  return fetch(`${apiUrl}?action=obtener_asistencia`, { mode: 'cors', redirect: 'follow' })
    .then(res => res.json())
    .then(data => {
      if (data && data.success && Array.isArray(data.asistencia)) {
        window.votoReal_asistenciaDbInMemory = data.asistencia;
        try {
          localStorage.setItem('votoReal_asistenciaDb', JSON.stringify(data.asistencia));
        } catch (e) {}
        console.log(`[Auth] Asistencia pre-cargada: ${data.asistencia.length} registros.`);
      }
    })
    .catch(err => console.warn('[Auth] No se pudo pre-cargar asistencia:', err.message));
}

// ─────────────────────────────────────────────────────────
// PRE-CARGA SILENCIOSA DE LA BASE DE USUARIOS EN CACHÉ
// ─────────────────────────────────────────────────────────
function fetchUsuariosDb(forceRefresh = false) {
  if (activeUserFetchPromise && !forceRefresh) return activeUserFetchPromise;

  const apiUrl = (typeof appState !== 'undefined' && appState.apiUrl)
    ? appState.apiUrl
    : (typeof DEFAULT_API_URL !== 'undefined' ? DEFAULT_API_URL : '');

  if (!apiUrl) return Promise.resolve();

  activeUserFetchPromise = (async () => {
    isFetchingUsers = true;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(`${apiUrl}?action=obtener_usuarios`, { 
        signal: controller.signal,
        mode: 'cors',
        redirect: 'follow'
      });
      clearTimeout(timer);

      if (response.ok) {
        const res = await response.json();
        if (res && res.success && res.usuarios) {
          window.votoReal_usuariosDbInMemory = res.usuarios;
          try {
            localStorage.setItem('votoReal_usuariosDb', JSON.stringify(res.usuarios));
          } catch (e) {
            console.warn('[Auth] localStorage lleno, caché sólo en memoria.');
          }
          console.log(`[Auth] Base de usuarios sincronizada: ${res.usuarios.length} usuarios.`);
          userDbFetchedThisSession = true;
          gasWarmupDone = true;
        }
      }
    } catch (err) {
      console.warn('[Auth] No se pudo pre-cargar usuarios:', err.message);
    } finally {
      isFetchingUsers = false;
      activeUserFetchPromise = null;
    }
  })();

  fetchAsistenciaDb();

  return activeUserFetchPromise;
}

// ─────────────────────────────────────────────────────────
// AUTOCOMPLETE AL TIPEAR DNI / NOMBRE
// ─────────────────────────────────────────────────────────
function handleLoginInputLookup() {
  const dniField = document.getElementById('login-dni');
  const nameField = document.getElementById('login-nombre');
  const dni = dniField ? dniField.value.trim() : '';
  const nombre = nameField ? nameField.value.trim() : '';

  if ((dni.length > 0 || nombre.length > 0) && !userDbFetchedThisSession) {
    fetchUsuariosDb();
  }

  if (dni.length >= 4 || nombre.length >= 4) {
    const user = buscarBrigadista(
      dni.length >= 4 ? dni : null,
      nombre.length >= 4 ? nombre : null
    );
    if (user) _autocompletarDistrito(user);
    else poblarUbicaciones();
  } else {
    poblarUbicaciones();
  }
}

function _autocompletarDistrito(user) {
  const locationField = document.getElementById('login-ubicacion');
  if (!locationField) return;
  const isSuperAdmin = user.dni === '99999999' || user.nombre === 'Super Administrador';
  if (isSuperAdmin || !user.ubicacion) {
    poblarUbicaciones();
  } else {
    locationField.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = user.ubicacion;
    opt.textContent = user.ubicacion;
    opt.selected = true;
    locationField.appendChild(opt);
  }
}

// ─────────────────────────────────────────────────────────
// POBLAR DROPDOWN DE UBICACIONES
// ─────────────────────────────────────────────────────────
function poblarUbicaciones() {
  const selectElement = document.getElementById('login-ubicacion');
  if (!selectElement) return;
  selectElement.innerHTML = '<option value="" disabled selected>Selecciona tu ubicación...</option>';
  (typeof DISTRITOS_LIMA !== 'undefined' ? DISTRITOS_LIMA : []).forEach(distrito => {
    const option = document.createElement('option');
    option.value = distrito;
    option.textContent = distrito;
    selectElement.appendChild(option);
  });
}

// ─────────────────────────────────────────────────────────
// POPUP DE ERROR — simple, sin overlay de espera
// ─────────────────────────────────────────────────────────
function showLoginErrorPopup(message) {
  const existing = document.getElementById('login-error-popup-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'login-error-popup-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
    background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(16px)',
    webkitBackdropFilter: 'blur(16px)', zIndex: '9999999',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: '0', transition: 'opacity 0.3s ease'
  });

  overlay.innerHTML = `
    <div style="background:linear-gradient(135deg,#1e1b2e,#0f172a);border:2px solid #ef4444;border-radius:24px;padding:32px 36px;box-shadow:0 25px 60px rgba(239,68,68,0.3);display:flex;flex-direction:column;align-items:center;gap:16px;max-width:360px;width:90%;text-align:center;">
      <div style="width:60px;height:60px;background:rgba(239,68,68,0.15);border:2px solid #ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;">⚠️</div>
      <div>
        <h3 style="margin:0 0 8px;font-size:1.2rem;font-weight:700;color:#f87171;">Acceso Denegado</h3>
        <p style="margin:0;font-size:0.95rem;color:#cbd5e1;line-height:1.4;">${message}</p>
      </div>
      <button id="btn-close-login-error" style="width:100%;padding:12px;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border:none;border-radius:12px;font-weight:700;font-size:0.95rem;cursor:pointer;">
        Reintentar
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });

  overlay.querySelector('#btn-close-login-error').addEventListener('click', () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  });
}

// ─────────────────────────────────────────────────────────
// ANIMACIÓN DEL BOTÓN DE LOGIN
// ─────────────────────────────────────────────────────────
function setLoginButtonLoading(isLoading) {
  const btn = document.getElementById('btn-login-submit');
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.dataset.originalContent = btn.innerHTML;
    btn.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;">
        <div style="width:18px;height:18px;border:2.5px solid rgba(255,255,255,0.3);border-top:2.5px solid #fff;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
        <span>Verificando...</span>
      </div>
    `;
  } else {
    btn.disabled = false;
    if (btn.dataset.originalContent) {
      btn.innerHTML = btn.dataset.originalContent;
    } else {
      btn.innerHTML = `<span>Ingresar al Sistema</span><i data-lucide="arrow-right"></i>`;
    }
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
}

// ─────────────────────────────────────────────────────────
// LLAMAR A GAS CON TIMEOUT Y REINTENTO
// 25s timeout × 2 intentos = máximo 50 segundos de espera
// ─────────────────────────────────────────────────────────
async function llamarLoginGAS(apiUrl, dniInput, nombreInput) {
  const MAX_INTENTOS = 2;
  const TIMEOUT_MS = 25000; // 25 segundos por intento

  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const params = new URLSearchParams({ action: 'login', dni: dniInput, nombre: nombreInput });
      const resp = await fetch(`${apiUrl}?${params.toString()}`, { 
        signal: controller.signal,
        mode: 'cors',
        redirect: 'follow'
      });
      clearTimeout(abortTimer);
      gasWarmupDone = true;

      if (!resp.ok) {
        console.warn(`[Auth] GAS respondió con error HTTP ${resp.status}`);
        return null;
      }

      const data = await resp.json();

      if (data && data.success && data.user) {
        console.log(`[Auth] Login exitoso (intento ${intento}):`, data.user.nombre);
        // Guardar en caché para próximos logins instantáneos
        if (!Array.isArray(window.votoReal_usuariosDbInMemory)) {
          window.votoReal_usuariosDbInMemory = [];
        }
        const existe = window.votoReal_usuariosDbInMemory.find(u => u.dni === data.user.dni);
        if (!existe) window.votoReal_usuariosDbInMemory.push(data.user);
        return data.user;
      }

      // GAS respondió OK pero usuario no encontrado
      return null;

    } catch (err) {
      clearTimeout(abortTimer);

      if (err.name === 'AbortError') {
        console.warn(`[Auth] Intento ${intento}/${MAX_INTENTOS} agotó ${TIMEOUT_MS / 1000}s`);
        if (intento < MAX_INTENTOS) {
          await new Promise(r => setTimeout(r, 1000)); // pausa 1s antes de reintentar
          continue;
        }
        return 'TIMEOUT';
      }

      console.error('[Auth] Error de red:', err);
      return 'NETWORK_ERROR';
    }
  }

  return 'TIMEOUT';
}

// ─────────────────────────────────────────────────────────
// MANEJADOR PRINCIPAL DE LOGIN
// ─────────────────────────────────────────────────────────
async function handleAccessSubmit(e) {
  if (e) e.preventDefault();

  const nombreInput = (document.getElementById('login-nombre')?.value || '').trim();
  const dniInput = (document.getElementById('login-dni')?.value || '').trim();

  if (!nombreInput && !dniInput) {
    showLoginErrorPopup('Por favor ingresa tu DNI o tu nombre para iniciar sesión.');
    return;
  }

  setLoginButtonLoading(true);

  try {
    // ── PASO 1: Super Admin — sin llamar a GAS ────────────────────────────
    const allInputs = (nombreInput + ' ' + dniInput).toLowerCase();
    if (
      allInputs.includes('admin#2026$secure!votoreal') ||
      dniInput === '99999999' ||
      nombreInput.toLowerCase() === 'admin'
    ) {
      proceedLogin(
        { nombre: 'Super Administrador', dni: '99999999', ubicacion: 'LIMA', colegio: 'CENTRAL', mesa: '', origenHoja: '' },
        'Super Administrador', 'LIMA'
      );
      return;
    }

    // ── PASO 2: Buscar en caché local (memoria / localStorage) — instantáneo
    let user = null;
    let localUser = buscarBrigadista(
      /^\d+$/.test(dniInput) ? dniInput : null,
      nombreInput || null
    );
    if (localUser) {
      console.log('[Auth] Usuario encontrado en caché local:', localUser.nombre);
      user = localUser;
    }

    // ── PASO 3: Si hay una descarga en segundo plano en curso → ESPERAR descarga ──
    if (!user && activeUserFetchPromise) {
      console.log('[Auth] Esperando sincronización de usuarios en curso...');
      await activeUserFetchPromise;
      localUser = buscarBrigadista(
        /^\d+$/.test(dniInput) ? dniInput : null,
        nombreInput || null
      );
      if (localUser) {
        console.log('[Auth] Usuario encontrado tras completar sincronización:', localUser.nombre);
        user = localUser;
      }
    }

    // ── PASO 4: Si aún no está en caché → consultar directamente a Google Sheets ──
    if (!user) {
      const apiUrl = (typeof appState !== 'undefined' && appState.apiUrl)
        ? appState.apiUrl
        : (typeof DEFAULT_API_URL !== 'undefined' ? DEFAULT_API_URL : '');

      if (!apiUrl) {
        showLoginErrorPopup('No hay conexión configurada con el servidor. Contacta al administrador.');
        return;
      }

      const resultado = await llamarLoginGAS(apiUrl, dniInput, nombreInput);

      if (resultado === 'TIMEOUT') {
        showLoginErrorPopup(
          'El servidor tardó demasiado en responder.\n\n' +
          'Espera unos segundos y vuelve a intentarlo.'
        );
        return;
      }

      if (resultado === 'NETWORK_ERROR') {
        showLoginErrorPopup('No se pudo conectar. Verifica tu conexión a internet.');
        return;
      }

      user = resultado; // null si no fue encontrado en Sheets
    }

    // ── PASO 4: No encontrado en ningún lado ──────────────────────────────
    if (!user) {
      showLoginErrorPopup(
        'DNI o nombre no encontrado en el sistema.\n\n' +
        'Verifica que coincida exactamente con los datos en las hojas Usuarios o Usuarios1.'
      );
      return;
    }

    // ── PASO 5: Login exitoso — navegar a la vista ────────────────────────
    proceedLogin(user, user.nombre || nombreInput, user.ubicacion || '');

  } catch (err) {
    console.error('[Auth] Error inesperado en login:', err);
    showLoginErrorPopup('Ocurrió un error inesperado. Inténtalo nuevamente.');
  } finally {
    setLoginButtonLoading(false);
  }
}

// ─────────────────────────────────────────────────────────
// PROCESAR LOGIN EXITOSO — navegar a la vista correspondiente
// NOTA: Esta función es síncrona intencionalmente para evitar
//       que el popup de espera bloquee la navegación.
// ─────────────────────────────────────────────────────────
function proceedLogin(user, nombreInput, ubicacionInput) {
  const dbNombre = (user && user.nombre) ? user.nombre : (nombreInput || 'Personero');
  const dbUbicacion = (user && user.ubicacion) ? user.ubicacion : (ubicacionInput || '');
  const dbDni = (user && user.dni) ? user.dni : '';
  const isSuperAdmin = dbDni === '99999999' || dbNombre === 'Super Administrador';
  const finalUbicacion = dbUbicacion || ubicacionInput || '';

  // Guardar sesión
  appState.currentUser = {
    nombre: dbNombre,
    dni: dbDni,
    ubicacion: finalUbicacion,
    colegio: (user && user.colegio) ? user.colegio : '',
    mesa: (user && user.mesa) ? user.mesa : '',
    origenHoja: (user && user.origenHoja) ? user.origenHoja : ''
  };
  sessionStorage.setItem('votoReal_user', JSON.stringify(appState.currentUser));
  actualizarVisibilidadConfig();

  // ── Vista de Coordinador (viene de hoja Usuarios1) ────────────────────
  if (typeof esCoordinador === 'function' && esCoordinador(appState.currentUser)) {
    try {
      if (typeof setupCoordinatorDisplay === 'function') setupCoordinatorDisplay();
    } catch (e) {
      console.error('[Auth] Error en setupCoordinatorDisplay:', e);
    }
    showView('view-coordinator');
    showToast(`Bienvenido Coordinador, ${dbNombre}.`, 'success');
    const formLog = document.getElementById('form-login');
    if (formLog) formLog.reset();
    poblarUbicaciones();
    return;
  }

  // ── Vista de Personero (viene de hoja Usuarios) ───────────────────────
  try { setupUserDisplay(); } catch (e) { console.error('[Auth] setupUserDisplay:', e); }
  try { if (typeof checkBrigadistaAttendance === 'function') checkBrigadistaAttendance(); } catch (e) {}
  try { generarTablaCandidatos(true); } catch (e) { console.error('[Auth] generarTablaCandidatos:', e); }
  try { generarTablaCandidatosOCR(); } catch (e) { console.error('[Auth] generarTablaCandidatosOCR:', e); }

  let storedFilter = localStorage.getItem('votoReal_activeViewFilter') || 'manual';
  if (storedFilter === 'all') storedFilter = 'manual';
  try { applyViewFilter(storedFilter); } catch (e) { console.error('[Auth] applyViewFilter:', e); }
  try { inicializarGraficos(); } catch (e) { console.error('[Auth] inicializarGraficos:', e); }
  try { if (typeof clearScannerState === 'function') clearScannerState(); } catch (e) {}

  // ── Navegar — esto SIEMPRE debe ejecutarse ────────────────────────────
  showView('view-counting');

  try { fetchAndSyncReport(); } catch (e) {}
  try { if (typeof evaluarBloqueoTransmisiones === 'function') evaluarBloqueoTransmisiones(); } catch (e) {}

  showToast(
    isSuperAdmin
      ? `Bienvenido, ${dbNombre}. Acceso total concedido.`
      : `Bienvenido, ${dbNombre}.`,
    'success'
  );

  const formLog = document.getElementById('form-login');
  if (formLog) formLog.reset();
  poblarUbicaciones();
}

// ─────────────────────────────────────────────────────────
// VISTA / NAVEGACIÓN
// ─────────────────────────────────────────────────────────
function showView(viewId) {
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
    view.style.display = 'none';
  });
  const activeView = document.getElementById(viewId);
  if (activeView) {
    activeView.classList.add('active');
    activeView.style.display = 'block';
  }
  if (viewId === 'view-counting') {
    setTimeout(() => {
      if (typeof mostrarPopupEntrada === 'function') mostrarPopupEntrada();
    }, 600);
  }
}

// ─────────────────────────────────────────────────────────
// DISPLAY DEL USUARIO LOGUEADO
// ─────────────────────────────────────────────────────────
function setupUserDisplay() {
  if (!appState.currentUser) return;

  const isSuperAdmin = appState.currentUser.dni === '99999999' || appState.currentUser.nombre === 'Super Administrador';

  const displayName = document.getElementById('user-display-name');
  if (displayName) displayName.textContent = appState.currentUser.nombre;

  const displayInfo = document.getElementById('user-display-info');
  if (displayInfo) {
    displayInfo.textContent = appState.currentUser.dni
      ? `DNI: ${appState.currentUser.dni} | Distrito: ${appState.currentUser.ubicacion}`
      : `Modo Consulta | Ubicación: ${appState.currentUser.ubicacion}`;
  }

  // Mesa y colegio siempre vacíos al entrar — checkBrigadistaAttendance (servidor)
  // se encarga de rellenar y bloquear SOLO si el usuario está en la hoja Asistencia.
  const inputMesa = document.getElementById('input-mesa');
  const inputColegio = document.getElementById('input-colegio');
  if (inputMesa) {
    inputMesa.value = '';
    inputMesa.disabled = false;
    inputMesa.placeholder = '000000';
  }
  if (inputColegio) {
    inputColegio.value = '';
    inputColegio.placeholder = 'Se completará al ingresar mesa...';
  }

  if (typeof autoCompletarColegio === 'function') autoCompletarColegio();

  const btnToggleDist = document.getElementById('chart-toggle-distrital');
  if (btnToggleDist) btnToggleDist.textContent = `Distrital (${appState.currentUser.ubicacion})`;

  const lblTransmitDistName = document.getElementById('lbl-transmit-dist-name');
  if (lblTransmitDistName) lblTransmitDistName.textContent = appState.currentUser.ubicacion;

  const distSelectorContainer = document.getElementById('district-selector-container');
  const districtSelect = document.getElementById('app-district-select');
  if (distSelectorContainer && districtSelect) {
    if (isSuperAdmin) {
      distSelectorContainer.classList.remove('hidden');
      distSelectorContainer.style.display = 'flex';
      districtSelect.innerHTML = '';
      (typeof DISTRITOS_LIMA !== 'undefined' ? DISTRITOS_LIMA : []).forEach(dist => {
        const opt = document.createElement('option');
        opt.value = dist;
        opt.textContent = dist;
        if (dist === appState.currentUser.ubicacion) opt.selected = true;
        districtSelect.appendChild(opt);
      });
    } else {
      distSelectorContainer.classList.add('hidden');
      distSelectorContainer.style.display = 'none';
    }
  }

  if (typeof evaluarVisibilidadBotonLlegada === 'function') evaluarVisibilidadBotonLlegada();
  if (typeof actualizarBadgesConfirmacion === 'function') actualizarBadgesConfirmacion();
}

// ─────────────────────────────────────────────────────────
// INICIALIZACIÓN AL CARGAR LA PÁGINA
// ─────────────────────────────────────────────────────────
if (typeof document !== 'undefined') {
  const _init = () => {
    // Cargar caché desde localStorage sin red (instantáneo)
    try {
      const cached = localStorage.getItem('votoReal_usuariosDb');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          window.votoReal_usuariosDbInMemory = parsed;
          console.log(`[Auth] Caché local: ${parsed.length} usuarios disponibles.`);
        }
      }
    } catch (e) { /* ignorar */ }

    // Pre-cargar usuarios y calentar servidor INMEDIATAMENTE al cargar la página
    fetchUsuariosDb();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }
}
