const { Pool } = require('pg');
const env = require('../../config/env');

const pgConfig = env.DATABASE_URL
  ? { connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      host: env.DB_SERVER,
      port: env.DB_PORT,
      database: env.DB_NAME,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: { rejectUnauthorized: false }
    };

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool(pgConfig);

    pool.on('error', (err) => {
      console.warn('[PostgreSQL Pool Error]:', err.message);
    });

    pool.connect()
      .then(client => {
        console.log('\n======================================================');
        console.log(`✅ [PostgreSQL 16] Conectado exitosamente a la BD "${env.DB_NAME}".`);
        console.log('======================================================\n');
        client.release();
      })
      .catch(err => {
        console.warn('\n======================================================');
        console.warn(`⚠️ [PostgreSQL 16] No se pudo conectar a la BD "${env.DB_NAME}":`);
        console.warn('   ' + err.message);
        console.warn('======================================================\n');
      });
  }
  return pool;
}

async function query(text, params = []) {
  const p = getPool();
  return p.query(text, params);
}

async function withUserContext(context = {}, callback) {
  const p = getPool();
  const client = await p.connect();
  try {
    const { dni = '', rol = '', distrito = '', colegio = '' } = context;
    if (dni || rol) {
      await client.query('SELECT set_app_user_context($1, $2, $3, $4)', [
        (dni || '').toString(),
        (rol || '').toString(),
        (distrito || '').toString(),
        (colegio || '').toString()
      ]);
    }
    const result = await callback(client);
    return result;
  } finally {
    try {
      await client.query('SELECT clear_app_user_context()');
    } catch (_) {}
    client.release();
  }
}

module.exports = {
  getPool,
  query,
  withUserContext,
  pgConfig
};

