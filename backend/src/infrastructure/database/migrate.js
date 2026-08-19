const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const env = require('../../config/env');

async function runMigrations() {
  console.log('\n======================================================');
  console.log('🔄 SISTEMA DE MIGRACIONES POSTGRESQL 16 (VotoReal)');
  console.log('======================================================\n');

  const pool = new Pool({
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    host: env.DB_SERVER,
    port: env.DB_PORT,
    database: env.DB_NAME,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log(`✅ Conectado a la base de datos PostgreSQL "${env.DB_NAME}".`);

    // 1. Crear tabla de control de versiones de esquema si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS schemamigrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Ejecutar SCRIPT_COMPLETO_POSTGRES.sql primero si no está ejecutado
    const migrationsDir = path.resolve(__dirname, '../../../migrations');
    const masterScriptPath = path.join(migrationsDir, 'SCRIPT_COMPLETO_POSTGRES.sql');

    if (fs.existsSync(masterScriptPath)) {
      const checkMaster = await client.query(
        'SELECT 1 FROM schemamigrations WHERE migration_name = $1',
        ['SCRIPT_COMPLETO_POSTGRES.sql']
      );

      if (checkMaster.rows.length === 0) {
        console.log('⏳ [Ejecutando script maestro PostgreSQL]: SCRIPT_COMPLETO_POSTGRES.sql...');
        const sqlContent = fs.readFileSync(masterScriptPath, 'utf8');
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO schemamigrations (migration_name) VALUES ($1)',
          ['SCRIPT_COMPLETO_POSTGRES.sql']
        );
        console.log('   ✓ SCRIPT_COMPLETO_POSTGRES.sql ejecutado y registrado con éxito.');
      } else {
        console.log('   ⏭️  [Omitida - Ya ejecutada]: SCRIPT_COMPLETO_POSTGRES.sql');
      }
    }

    const countRes = await client.query('SELECT COUNT(*) AS total_mesas FROM mesas');
    console.log(`📊 Mesas verificadas en base de datos: ${countRes.rows[0]?.total_mesas || 0}`);

    console.log('\n======================================================');
    console.log('🎉 MIGRACIONES POSTGRESQL FINALIZADAS CON ÉXITO.');
    console.log('======================================================\n');

    client.release();
    await pool.end();
    if (require.main === module) process.exit(0);
    return true;
  } catch (err) {
    console.error('\n❌ ERROR EN MIGRACIONES POSTGRESQL:', err.message);
    await pool.end();
    if (require.main === module) process.exit(1);
    throw err;
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
