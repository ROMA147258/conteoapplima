const pg = require('pg');
const pool = new pg.Pool({
  host: 'ep-super-silence-axywhu8v-pooler.c-4.us-east-2.aws.neon.tech',
  user: 'neondb_owner',
  password: 'npg_b5gvlBUs0NSe',
  database: 'neondb',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const [pRes, clRes, czRes, colRes] = await Promise.all([
    pool.query('SELECT * FROM rpersoneros LIMIT 5'),
    pool.query('SELECT * FROM rcoordinadores LIMIT 5'),
    pool.query('SELECT * FROM rcoordinadoresz'),
    pool.query('SELECT * FROM colegios WHERE distrito ILIKE $1 LIMIT 10', ['%villa maria del triunfo%'])
  ]);

  console.log('Personeros sample count:', pRes.rows.length);
  console.log('Coordinadores locales count:', clRes.rows.length);
  console.log('Coordinadores zonales count:', czRes.rows.length);
  console.log('Colegios sample count:', colRes.rows.length);

  // Check how Esteban's schools match
  const esteban = czRes.rows.find(r => r.dni === '43599476');
  console.log('Esteban colegios raw:', esteban.local_de_votacion_asignado);
  const escuelasEsteban = (esteban.local_de_votacion_asignado || '').split(',').map(s => s.trim());
  console.log('Escuelas separadas de Esteban:', escuelasEsteban);

  await pool.end();
}
run();
