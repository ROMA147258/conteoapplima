// --- BASE DE DATOS DE BRIGADISTAS (USUARIOS) ---
export const BRIGADISTAS_DB = [
  { dni: "Admin#2026$Secure!VotoReal", nombre: "Super Administrador", ubicacion: "" },
  // Coordinadores de Local (DNI de 8 dígitos)
  { dni: "20000001", nombre: "Coord. Juan Quispe", ubicacion: "Ate", colegio: "IE 0024 PEDRO ENRIQUE GONZALES SOTO" },
  { dni: "20000002", nombre: "Coord. María Flores", ubicacion: "Ate", colegio: "IE 0026 AICHI NAGOYA" },
  { dni: "20000003", nombre: "Coord. Carlos Sánchez", ubicacion: "Ancón", colegio: "IE 3069 GENERALISIMO JOSE DE SAN MARTIN" },
  { dni: "c1", nombre: "Coord. Juan Quispe", ubicacion: "Ate", colegio: "IE 0024 PEDRO ENRIQUE GONZALES SOTO" },

  // Personeros de Mesa
  { dni: "10026769", nombre: "Fernando Arias Navarro", ubicacion: "Ate", colegio: "IE 0024 PEDRO ENRIQUE GONZALES SOTO", mesa: "63769" },
  { dni: "71000001", nombre: "Juan Carlos Quispe Palomino", ubicacion: "Ate", colegio: "IE 0024 PEDRO ENRIQUE GONZALES SOTO", mesa: "037163" },
  { dni: "71000002", nombre: "María Elena Flores Dávila", ubicacion: "Ate", colegio: "IE 0026 AICHI NAGOYA", mesa: "037175" },
  { dni: "71000003", nombre: "Carlos Alberto Rodríguez Bustamante", ubicacion: "Ate", colegio: "IE 0032 RAUL PORRAS BARRENECHEA", mesa: "037187" },
  { dni: "71000004", nombre: "Ana Lucía Rojas Cárdenas", ubicacion: "Ate", colegio: "IE 0074 FERNANDO BELAUNDE TERRY", mesa: "037207" },
  { dni: "71000005", nombre: "Luis Fernando Chávez Paredes", ubicacion: "Ancón", colegio: "IE 3069 GENERALISIMO JOSE DE SAN MARTIN", mesa: "036999" },
  { dni: "71000006", nombre: "Carmen Rosa Gonzales Córdova", ubicacion: "Ancón", colegio: "IE 2066 ALMIRANTE MIGUEL GRAU", mesa: "037020" },
  { dni: "71000007", nombre: "José Antonio Pérez Vilca", ubicacion: "Lima", colegio: "IE EMBLEMATICA GUADALUPE", mesa: "010001" },
  { dni: "71000008", nombre: "Sofia Isabel Ramírez Salas", ubicacion: "Miraflores", colegio: "IE JUANA ALARCO DE D script", mesa: "020001" },
  { dni: "71000009", nombre: "Jorge Luis Mendoza Ccama", ubicacion: "Surco", colegio: "IE MANUEL POLO JIMENEZ", mesa: "030001" }
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

    // Verificar si el registro tiene estado de credenciales y rechazar si está bloqueado o no confirmado
    if (u.Credenciales || u.credenciales) {
      const cred = (u.Credenciales || u.credenciales || '').toString().trim().toLowerCase();
      const isConfirmed = cred.includes('confirmad') || cred === 'si' || cred === '1' || cred === 'aprobado';
      if (!isConfirmed) return false;
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
