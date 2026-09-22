const { query } = require('./infrastructure/database/connection');

async function check() {
  try {
    const tables = ['rcoordinadoresz', 'rcoordinadores', 'rpersoneros'];
    for (const t of tables) {
      const res = await query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${t}'`);
      console.log(`=== Columns of ${t} ===`);
      console.log(res.rows.map(r => r.column_name));
    }

    const sampleZ = await query(`SELECT dni, token_verificacion, nombres_y_apellidos, rol_a_desempenar, distrito_asignado FROM rcoordinadoresz LIMIT 5`);
    console.log('\n=== Sample rcoordinadoresz ===');
    console.log(sampleZ.rows);

    const sampleC = await query(`SELECT dni, token_verificacion, nombres_y_apellidos, rol_a_desempenar, distrito_asignado FROM rcoordinadores LIMIT 5`);
    console.log('\n=== Sample rcoordinadores ===');
    console.log(sampleC.rows);

    // Let's check all tables in DB
    const allTables = await query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log('\n=== All Tables ===');
    console.log(allTables.rows.map(r => r.table_name));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
