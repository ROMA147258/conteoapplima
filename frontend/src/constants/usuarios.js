// --- BASE DE DATOS DE BRIGADISTAS (RPERSONEROS Y RCOORDINADORES) ---
export const BRIGADISTAS_DB = [
  { dni: "Admin#2026$Secure!VotoReal", nombre: "Super Administrador", ubicacion: "", rol: "Admin", credenciales: "Confirmado", preguntas: "Aprobado", origenHoja: "Rpersoneros" },
  { dni: "25869378", nombre: "Diego Salas", ubicacion: "Los Olivos", colegio: "IE 2025 INMACULADA CONCEPCION", mesa: "578858", rol: "Personero", credenciales: "Confirmado", preguntas: "Aprobado", origenHoja: "Rpersoneros" },
  { dni: "77889900", nombre: "Juan Perez Prueba", ubicacion: "Surco", colegio: "Colegio San Jose", mesa: "123456", rol: "Personero", credenciales: "Confirmado", preguntas: "Aprobado", origenHoja: "Rpersoneros" }
];

export function buscarBrigadista(dni, nombre, cachedUsers = null) {
  const normStr = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const cleanDigits = (s) => (s || "").toString().replace(/\D/g, "");

  const rawDni = (dni || "").toString().trim();
  const rawNombre = (nombre || "").toString().trim();

  const targetDigits = cleanDigits(rawDni);
  const targetNombre = rawNombre ? normStr(rawNombre) : null;

  const matchesUser = (u) => {
    if (!u) return false;

    // Verificar si el registro tiene estado de credenciales y preguntas (ambos deben estar válidos)
    if (
      u.origenHoja === 'Rpersoneros' ||
      u.origenHoja === 'rpersoneros' ||
      u.origenHoja === 'Rcoordinadores' ||
      u.origenHoja === 'rcoordinadores' ||
      u.Credenciales !== undefined ||
      u.credenciales !== undefined ||
      u.Preguntas !== undefined ||
      u.preguntas !== undefined
    ) {
      const cred = (u.Credenciales || u.credenciales || '').toString().trim().toLowerCase();
      const preg = (u.Preguntas || u.preguntas || '').toString().trim().toLowerCase();

      const isConfirmed = Boolean(cred && (cred.includes('confirmad') || cred === 'si' || cred === '1' || cred === 'aprobado'));
      const isAprobado = preg ? Boolean(preg.includes('aprobad') || preg === 'si' || preg === '1') : true;

      if (!isConfirmed || !isAprobado) return false;
    }

    const uDniDigits = cleanDigits(u.dni || u.DNI);
    const uNameNorm = normStr(u.nombre || u.Nombres_y_Apellidos);

    if (targetDigits.length > 0) {
      const targetPadded = targetDigits.padStart(8, '0');
      const uPadded = uDniDigits.padStart(8, '0');
      if (uDniDigits !== targetDigits && uPadded !== targetPadded) {
        return false;
      }
    }

    if (targetNombre) {
      const typedWords = targetNombre.split(/\s+/).filter(w => w.length >= 2);
      if (typedWords.length > 0) {
        const allWordsMatch = typedWords.every(word => uNameNorm.includes(word));
        if (!allWordsMatch) return false;
      }
    }

    return true;
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
  const nombre = (user.nombre || user.Nombres_y_Apellidos || "").toString().toLowerCase().trim();
  const dni = (user.dni || user.DNI || "").toString().toLowerCase().trim();
  const origenHoja = (user.origenHoja || "").toString().toLowerCase().trim();
  const rol = (user.rol || "").toString().toLowerCase().trim();

  if (origenHoja === "usuarios1" || origenHoja === "rcoordinadores" || rol === "coordinador" || rol.includes("coordinador")) {
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
