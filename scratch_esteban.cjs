const pg = require('pg');
const pool = new pg.Pool({
  host: 'ep-super-silence-axywhu8v-pooler.c-4.us-east-2.aws.neon.tech',
  user: 'neondb_owner',
  password: 'npg_b5gvlBUs0NSe',
  database: 'neondb',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

function normalizeText(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

async function findUserInDatabase(inputNombre, inputDni) {
  const rawDni = (inputDni || '').toString().trim();
  const rawNombre = (inputNombre || '').toString().trim();

  const digitsDni = rawDni.replace(/\D/g, '');
  const digitsNombre = rawNombre.replace(/\D/g, '');
  const targetDniNumber = digitsDni.length >= 6 ? digitsDni : (digitsNombre.length >= 6 ? digitsNombre : '');

  const extractClave = (s) => {
    const m = (s || '').match(/\b(ZN\d+|[A-Z0-9]{5,10})\b/i);
    return m ? m[1].toUpperCase() : '';
  };
  const targetClave = extractClave(rawDni) || extractClave(rawNombre);

  const cleanNameText = (rawNombre && !/^\d+$/.test(rawNombre) && !/^ZN\d+/i.test(rawNombre)) 
    ? rawNombre 
    : (rawDni && !/^\d+$/.test(rawDni) && !/^ZN\d+/i.test(rawDni) ? rawDni : '');
  
  const normName = normalizeText(cleanNameText);
  const words = normName.split(/\s+/).filter(w => w.length >= 2);

  const tables = ['rcoordinadoresz', 'rcoordinadores', 'rpersoneros'];

  for (const t of tables) {
    let rows = [];

    // 1. Búsqueda por DNI numérico exacto
    if (targetDniNumber) {
      const q = `SELECT * FROM ${t} WHERE TRIM(dni) = $1 OR TRIM(dni) = $2 LIMIT 1`;
      const res = await pool.query(q, [targetDniNumber, targetDniNumber.padStart(8, '0')]);
      if (res.rows.length > 0) rows = res.rows;
    }

    // 2. Búsqueda por Clave de Acceso o Token (ej: ZN5019)
    if (rows.length === 0 && targetClave) {
      const q = `SELECT * FROM ${t} WHERE TRIM(clave_acceso) ILIKE $1 OR TRIM(token_verificacion) ILIKE $1 LIMIT 1`;
      const res = await pool.query(q, [targetClave]);
      if (res.rows.length > 0) rows = res.rows;
    }

    // 3. Búsqueda por coincidencia de palabras del Nombre (Primer Nombre + Primer Apellido, ignorando acentos)
    if (rows.length === 0 && words.length > 0) {
      const conditions = words.map((_, i) => `TRANSLATE(LOWER(nombres_y_apellidos), 'áéíóúÁÉÍÓÚñÑüÜ', 'aeiouaeiounnuu') ILIKE $${i + 1}`);
      const params = words.map(w => `%${w}%`);
      const q = `SELECT * FROM ${t} WHERE ${conditions.join(' AND ')} LIMIT 1`;
      const res = await pool.query(q, params);
      if (res.rows.length > 0) rows = res.rows;
    }

    if (rows.length > 0) {
      const u = rows[0];
      return {
        table: t,
        nombre: u.nombres_y_apellidos,
        dni: u.dni,
        clave: u.clave_acceso,
        rol: u.rol_a_desempenar || (t === 'rcoordinadoresz' ? 'Coordinador Zonal' : t === 'rcoordinadores' ? 'Coordinador de Local' : 'Personero')
      };
    }
  }

  return null;
}

async function run() {
  const tests = [
    { nombre: 'Esteban Tito', dni: 'ZN5019' },
    { nombre: 'Esteban Tito', dni: '43599476' },
    { nombre: 'Esteban Tito', dni: '' },
    { nombre: 'Lucero Sanchez', dni: '41542273' },
    { nombre: 'Lucero Sanchez', dni: '' },
    { nombre: 'Rosabel Garcia', dni: '10091491' },
    { nombre: 'Rosabel Garcia', dni: '' },
    { nombre: 'Rosabel García', dni: '' },
    { nombre: 'Carmen Arias', dni: 'ZN7942' },
    { nombre: 'Carmen Arias', dni: '45804148' },
    { nombre: 'Carmen Arias', dni: '' },
    { nombre: '', dni: '43599476' },
    { nombre: '', dni: 'ZN5019' }
  ];

  for (const tc of tests) {
    const res = await findUserInDatabase(tc.nombre, tc.dni);
    console.log(`Input: [nombre="${tc.nombre}", dni="${tc.dni}"] => Found:`, res ? `${res.nombre} (${res.rol}) DNI:${res.dni} Clave:${res.clave}` : 'NOT FOUND ❌');
  }

  await pool.end();
}
run();
