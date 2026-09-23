const { query } = require('./backend/src/infrastructure/database/connection');

async function checkEsteban() {
  const tables = ['rcoordinadoresz', 'rcoordinadores', 'rpersoneros', 'rcoordinadoresd'];
  for (const t of tables) {
    try {
      const res = await query(`SELECT * FROM ${t} WHERE nombres_y_apellidos ILIKE '%Esteban Tito%' OR dni ILIKE '%43599476%'`);
      if (res.rows.length > 0) {
        console.log(`--- ENCONTRADO EN ${t} ---`);
        console.log(JSON.stringify(res.rows, null, 2));
      }
    } catch(e) {
      console.error(t, e.message);
    }
  }
  process.exit(0);
}
checkEsteban();
