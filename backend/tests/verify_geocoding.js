const mssql = require('mssql');
const env = require('../src/config/env');

async function verifyGeocoding() {
  console.log('\n======================================================');
  console.log('📍 AUDITORÍA Y VERIFICACIÓN DE GEOCODIFICACIÓN (VotoReal)');
  console.log('======================================================\n');

  const pool = await mssql.connect({
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    server: env.DB_SERVER,
    database: env.DB_NAME,
    options: {
      encrypt: env.DB_ENCRYPT,
      trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE,
      enableArithAbort: true
    }
  });

  // 1. Resumen por distrito
  const resDistritos = await pool.request().query(`
    SELECT 
      distrito,
      COUNT(DISTINCT colegio) AS total_colegios,
      COUNT(*) AS total_mesas,
      SUM(CASE WHEN latitud IS NOT NULL AND longitud IS NOT NULL THEN 1 ELSE 0 END) AS mesas_geocodificadas
    FROM dbo.Mesas
    GROUP BY distrito
    ORDER BY total_mesas DESC;
  `);

  console.log('📊 Resumen de Mesas y Locales por Distrito:');
  console.table(resDistritos.recordset);

  // 2. Colegios de Ate
  const resAte = await pool.request().query(`
    SELECT 
      colegio,
      COUNT(*) AS cantidad_mesas,
      MAX(direccion) AS direccion,
      MAX(coordenadas_gps) AS coordenadas_gps
    FROM dbo.Mesas
    WHERE UPPER(distrito) = 'ATE'
    GROUP BY colegio
    ORDER BY colegio;
  `);

  console.log(`\n🏫 Total Colegios en Ate: ${resAte.recordset.length}`);
  console.log('Muestra de los primeros 5 colegios en Ate:');
  console.table(resAte.recordset.slice(0, 5));

  // 3. Verificación de duplicados
  const resDupes = await pool.request().query(`
    SELECT numero_mesa, COUNT(*) AS repetidos
    FROM dbo.Mesas
    GROUP BY numero_mesa
    HAVING COUNT(*) > 1;
  `);

  if (resDupes.recordset.length === 0) {
    console.log('\n✅ CERO DUPLICADOS: Todas las mesas son únicas en dbo.Mesas.');
  } else {
    console.warn(`\n⚠️ Alerta: Se detectaron ${resDupes.recordset.length} mesas duplicadas.`);
  }

  await pool.close();
  console.log('\n======================================================');
  console.log('🎉 Auditoría de geocodificación finalizada con éxito.');
  console.log('======================================================\n');
}

if (require.main === module) {
  verifyGeocoding().catch(err => {
    console.error('❌ Error en verificación:', err);
    process.exit(1);
  });
}

module.exports = verifyGeocoding;
