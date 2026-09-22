const { query } = require('./infrastructure/database/connection');

async function updateKeys() {
  try {
    const res = await query('SELECT id, dni, nombres_y_apellidos FROM rcoordinadoresz ORDER BY id ASC');
    const usedDigits = new Set();

    function getRandomDigits() {
      let d;
      do {
        d = Math.floor(1000 + Math.random() * 9000).toString();
      } while (usedDigits.has(d));
      usedDigits.add(d);
      return d;
    }

    const updates = [];
    for (const row of res.rows) {
      const newKey = 'ZN' + getRandomDigits();
      await query('UPDATE rcoordinadoresz SET clave_acceso = $1 WHERE id = $2', [newKey, row.id]);
      updates.push({
        id: row.id,
        dni: row.dni,
        nombre: row.nombres_y_apellidos,
        clave_acceso: newKey
      });
    }

    console.log('=== UPDATED COORDINADORES ZONALES ===');
    console.table(updates);
    process.exit(0);
  } catch (err) {
    console.error('Error updating keys:', err);
    process.exit(1);
  }
}

updateKeys();
