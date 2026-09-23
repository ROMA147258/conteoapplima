// --- BASE DE DATOS DE BRIGADISTAS (RPERSONEROS Y RCOORDINADORES) ---
export const BRIGADISTAS_DB = [
  { dni: "Admin#2026$Secure!VotoReal", nombre: "Super Administrador", ubicacion: "", rol: "Admin", credenciales: "Confirmado", preguntas: "Aprobado", origenHoja: "Rpersoneros" },
  { dni: "43310677", clave_acceso: "SP7845", nombre: "Yolanda Estacio Cangahuala", ubicacion: "Villa María del Triunfo", colegio: "No aplica", mesa: "", rol: "Coordinador de Distritos", tipo_interfaz: "coordinador_distrital", credenciales: "Confirmado", preguntas: "Aprobado", origenHoja: "rcoordinadoresd" },
  { dni: "43599476", clave_acceso: "ZN5019", nombre: "Esteban Tito Cirineo Condor", ubicacion: "Villa María del Triunfo", colegio: "IE 7054 VILLA MARIA DEL TRIUNFO", mesa: "", rol: "Coordinador Zonal", tipo_interfaz: "coordinador_zonal", credenciales: "Confirmado", preguntas: "Aprobado", origenHoja: "rcoordinadoresz" },
  { dni: "45804148", clave_acceso: "ZN7942", nombre: "Carmen Patricia Arias Baldeon", ubicacion: "Villa María del Triunfo", colegio: "IE 6093 JUAN VALER SANDOVAL", colegios: "IE 6093 JUAN VALER SANDOVAL, IE EMBLEMATICA JUAN GUERRERO QUIMPER, IE 6015 SANTISIMO SAGRADO CORAZON DE JESUS", mesa: "", rol: "Coordinador Zonal", tipo_interfaz: "coordinador_zonal", credenciales: "Confirmado", preguntas: "Aprobado", origenHoja: "rcoordinadoresz" },
  { dni: "41542273", nombre: "SANCHEZ CORRALES LUCERO", ubicacion: "Villa María del Triunfo", colegio: "IE 7054 VILLA MARIA DEL TRIUNFO", mesa: "", rol: "Coordinador de Local", tipo_interfaz: "coordinador_local", credenciales: "Confirmado", preguntas: "Aprobado", origenHoja: "rcoordinadores" },
  { dni: "10091491", nombre: "Rosabel García Fernández", ubicacion: "Villa María del Triunfo", colegio: "IE 7054 VILLA MARIA DEL TRIUNFO", mesa: "901234", rol: "Personero", tipo_interfaz: "personero_asistencia", credenciales: "Confirmado", preguntas: "Aprobado", origenHoja: "rpersoneros" },
  { dni: "10229164", nombre: "ANTONIA ROMERO LINARES", ubicacion: "Villa María del Triunfo", colegio: "IE 6093 JUAN VALER SANDOVAL", mesa: "", rol: "Coordinador de Local", tipo_interfaz: "coordinador_local", credenciales: "Confirmado", preguntas: "Aprobado", origenHoja: "rcoordinadores" },
  { dni: "20902097", nombre: "SILVIA PAULINA PORTILLO VICTORIO", ubicacion: "Villa María del Triunfo", colegio: "IE 6093 JUAN VALER SANDOVAL", mesa: "No aplica", rol: "Personero", tipo_interfaz: "personero_asistencia", credenciales: "Confirmado", preguntas: "Aprobado", origenHoja: "rpersoneros" },
  { dni: "25869378", nombre: "Diego Salas", ubicacion: "Los Olivos", colegio: "IE 2025 INMACULADA CONCEPCION", mesa: "578858", rol: "Personero", credenciales: "Confirmado", preguntas: "Aprobado", origenHoja: "Rpersoneros" },
  { dni: "77889900", nombre: "Juan Perez Prueba", ubicacion: "Surco", colegio: "Colegio San Jose", mesa: "123456", rol: "Personero", credenciales: "Confirmado", preguntas: "Aprobado", origenHoja: "Rpersoneros" }
];

export function buscarBrigadista(dni, nombre, cachedUsers = null) {
  const normStr = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const cleanDigits = (s) => (s || "").toString().replace(/\D/g, "");

  const rawDni = (dni || "").toString().trim();
  const rawNombre = (nombre || "").toString().trim();

  const targetDigits = cleanDigits(rawDni) || cleanDigits(rawNombre);
  const targetNombre = rawNombre ? normStr(rawNombre) : (rawDni ? normStr(rawDni) : null);
  const searchKey = normStr(rawDni) || normStr(rawNombre);

  const matchesUser = (u) => {
    if (!u) return false;

    // Validar estado de credenciales y preguntas (solo aprobados/confirmados)
    const cred = (u.credenciales || u.Credenciales || '').toString().trim().toLowerCase();
    const preg = (u.preguntas || u.Preguntas || '').toString().trim().toLowerCase();
    if (cred || preg) {
      const isConfirmed = Boolean(cred && (cred.includes('confirmad') || cred.includes('aprobad') || cred === 'si' || cred === '1'));
      const isAprobado = preg ? Boolean(preg.includes('aprobad') || preg === 'si' || preg === '1') : true;
      if (!isConfirmed || !isAprobado) return false;
    }

    // Match por Clave de Acceso (ej: ZN7942 o ZN5019 o SP7845)
    const uClave = normStr(u.clave_acceso || u.clave || '');
    if (uClave && searchKey && (uClave === searchKey || searchKey.includes(uClave))) {
      return true;
    }

    const uDniDigits = cleanDigits(u.dni || u.DNI);
    const uNameNorm = normStr(u.nombre || u.Nombres_y_Apellidos);

    if (targetDigits.length >= 6 && uDniDigits.length >= 6) {
      const targetPadded = targetDigits.padStart(8, '0');
      const uPadded = uDniDigits.padStart(8, '0');
      if (uDniDigits === targetDigits || uPadded === targetPadded) {
        return true;
      }
    }

    if (targetNombre) {
      const typedWords = targetNombre.split(/\s+/).filter(w => w.length >= 2);
      if (typedWords.length > 0) {
        const allWordsMatch = typedWords.every(word => uNameNorm.includes(word));
        if (allWordsMatch) return true;
      }
    }

    return false;
  };

  // 1. Memoria / Caché provisto
  if (Array.isArray(cachedUsers) && cachedUsers.length > 0) {
    const foundMem = cachedUsers.find(matchesUser);
    if (foundMem) return foundMem;
  }

  // 2. localStorage
  try {
    const cachedDbStr = localStorage.getItem('votoReal_usuariosDb');
    if (cachedDbStr) {
      const cachedDb = JSON.parse(cachedDbStr);
      if (Array.isArray(cachedDb)) {
        const found = cachedDb.find(matchesUser);
        if (found) return found;
      }
    }
  } catch (e) {}

  // 3. BRIGADISTAS_DB
  const foundLocal = BRIGADISTAS_DB.find(matchesUser);
  if (foundLocal) return foundLocal;

  return null;
}

export function buscarBrigadistaPorDni(dni, cachedUsers = null) {
  return buscarBrigadista(dni, null, cachedUsers);
}

export function esCoordinador(user) {
  if (!user) return false;

  const rol = (user.rol || user.Rol_a_Desempenar || "").toString().toLowerCase().trim();
  const tipoInterfaz = (user.tipo_interfaz || "").toString().toLowerCase().trim();
  const nombre = (user.nombre || user.Nombres_y_Apellidos || "").toString().toLowerCase().trim();
  const dni = (user.dni || user.DNI || "").toString().toLowerCase().trim();
  const origenHoja = (user.origenHoja || user.tabla_origen || "").toString().toLowerCase().trim();

  // Coordinador(a) Distrital va a la interfaz de coordinación en todos los distritos
  if (
    rol.includes("distrital") ||
    tipoInterfaz === "coordinador_distrital" ||
    origenHoja.includes("rcoordinadoresd")
  ) {
    return true;
  }

  // Coordinadores Locales y Zonales
  if (
    origenHoja.includes("coordinador") ||
    origenHoja.includes("rcoordinadoresz") ||
    origenHoja.includes("rcoordinadores") ||
    origenHoja === "usuarios1" ||
    rol.includes("coordinador") ||
    tipoInterfaz === "coordinador_lista" ||
    tipoInterfaz === "coordinador_local" ||
    tipoInterfaz === "coordinador_zonal"
  ) {
    return true;
  }
  
  if (/^2000\d{4}$/.test(dni) || /^c\d+$/i.test(dni) || dni.startsWith("c_") || dni.startsWith("coord") || dni.startsWith("coor")) {
    return true;
  }
  
  if (nombre.startsWith("c_") || nombre.startsWith("coord") || nombre.startsWith("coor")) {
    return true;
  }

  return false;
}

