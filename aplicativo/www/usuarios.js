// --- BASE DE DATOS DE BRIGADISTAS (USUARIOS) ---
// Cada usuario está predefinido con su DNI único, Nombre completo distinto y Colegio/Mesa asignada
const BRIGADISTAS_DB = [
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

/**
 * Searches for a brigadista in the database by their DNI or Name.
 * Strict exact DNI matching and strict user verification.
 */
function buscarBrigadista(dni, nombre) {
  const normStr = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const cleanDigits = (s) => (s || "").toString().replace(/\D/g, "");

  const rawDni = (dni || "").toString().trim();
  const rawNombre = (nombre || "").toString().trim();

  const targetDigits = cleanDigits(rawDni);
  const targetNombre = rawNombre ? normStr(rawNombre) : null;

  const matchesUser = (u) => {
    if (!u) return false;
    const uDniDigits = cleanDigits(u.dni);
    const uNameNorm = normStr(u.nombre);

    // If DNI is provided, compare numeric digits directly or normalized strings
    if (targetDigits.length > 0) {
      const targetPadded = targetDigits.padStart(8, '0');
      const uPadded = uDniDigits.padStart(8, '0');
      if (uDniDigits !== targetDigits && uPadded !== targetPadded) {
        return false;
      }
    }

    // If Nombre is provided, check if words match
    if (targetNombre) {
      const typedWords = targetNombre.split(/\s+/).filter(w => w.length >= 2);
      if (typedWords.length > 0) {
        const allWordsMatch = typedWords.every(word => uNameNorm.includes(word));
        if (!allWordsMatch) return false;
      }
    }

    return true;
  };

  // 1. Query in-memory Google Sheets user database array (instant access & immune to quota limits)
  if (Array.isArray(window.votoReal_usuariosDbInMemory) && window.votoReal_usuariosDbInMemory.length > 0) {
    const foundMem = window.votoReal_usuariosDbInMemory.find(matchesUser);
    if (foundMem) return foundMem;
  }

  // 2. Query localStorage user database cache
  try {
    const cachedDbStr = localStorage.getItem('votoReal_usuariosDb');
    if (cachedDbStr) {
      const cachedDb = JSON.parse(cachedDbStr);
      if (Array.isArray(cachedDb)) {
        window.votoReal_usuariosDbInMemory = cachedDb;
        const found = cachedDb.find(matchesUser);
        if (found) return found;
      }
    }
  } catch (e) {
    console.warn("Could not query cached users database:", e);
  }

  // 3. Query attendance database cache (Asistencia sheet)
  try {
    let attList = window.votoReal_asistenciaDbInMemory;
    if (!Array.isArray(attList) || attList.length === 0) {
      const cachedAttStr = localStorage.getItem('votoReal_asistenciaDb');
      if (cachedAttStr) attList = JSON.parse(cachedAttStr);
    }
    if (Array.isArray(attList)) {
      const foundAtt = attList.find(matchesUser);
      if (foundAtt) {
        return {
          id: foundAtt.id || foundAtt.dni,
          nombre: foundAtt.nombre,
          dni: foundAtt.dni,
          ubicacion: foundAtt.distrito || foundAtt.ubicacion || '',
          colegio: foundAtt.local || foundAtt.colegio || '',
          mesa: foundAtt.mesa || '',
          origenHoja: 'Asistencia'
        };
      }
    }
  } catch (e) {
    console.warn("Could not query attendance cache:", e);
  }

  // 4. Query local fallback database (BRIGADISTAS_DB)
  const foundLocal = BRIGADISTAS_DB.find(matchesUser);
  if (foundLocal) return foundLocal;

  // Strict Security: Return null if not found in database (No dummy fallbacks)
  return null;
}

function buscarBrigadistaPorDni(dni) {
  return buscarBrigadista(dni, null);
}

function esCoordinador(user) {
  if (!user) return false;
  const nombre = (user.nombre || "").toString().toLowerCase().trim();
  const dni = (user.dni || "").toString().toLowerCase().trim();
  const origenHoja = (user.origenHoja || "").toString().toLowerCase().trim();

  // Si proviene de la pestaña Usuarios1 es un coordinador
  if (origenHoja === "usuarios1") {
    return true;
  }
  
  // DNI de coordinador (20000001, 20000002, c1, coord...)
  if (/^2000\d{4}$/.test(dni) || /^c\d+$/i.test(dni) || dni.startsWith("c_") || dni.startsWith("coord")) {
    return true;
  }
  
  // Nombre tipo C_... o Coord...
  if (nombre.startsWith("c_") || nombre.startsWith("coord")) {
    return true;
  }

  return false;
}
