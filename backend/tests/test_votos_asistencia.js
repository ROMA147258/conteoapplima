const assert = require('assert');
const postgresRepo = require('../src/infrastructure/repositories/PostgresRepository');
const { query, getPool } = require('../src/infrastructure/database/connection');

async function testLiveDb() {
  console.log('\n======================================================');
  console.log('🧪 VALIDANDO REGISTRO DE VOTOS, ASISTENCIA Y BLOQUEO EN NEON POSTGRESQL');
  console.log('======================================================\n');

  const testMesa = '999888';
  const testDni = '99887766';

  try {
    // 1. Probar registro de votos con dígitos
    const payloadManual = {
      action: 'registrar_votos',
      brigadista: 'Personero Test',
      dni: testDni,
      departamento: 'Lima',
      provincia: 'Lima',
      ubicacion: 'Miraflores',
      colegio: 'Colegio Test',
      mesa: testMesa,
      origen: 'MANUAL',
      votos: {
        provincial: {
          FP: 15,
          JP: 22,
          'SOMOS PERU': 30,
          FREPAP: 5,
          VERDE: 2,
          MORADO: 8
        },
        distrital: {
          FP: 10,
          JP: 18,
          'SOMOS PERU': 40,
          FREPAP: 3,
          VERDE: 1,
          MORADO: 6
        }
      },
      votos_nulos: 4,
      votos_blancos: 1,
      votos_impugnados: 3,
      votos_dist_nulos: 2,
      votos_dist_blancos: 0,
      votos_dist_impugnados: 1
    };

    const resVotos = await postgresRepo.registrarVotos(payloadManual);
    assert.strictEqual(resVotos.success, true);

    // Consultar votos_detalle en la BD
    const checkVotos = await query('SELECT * FROM votos_detalle WHERE numero_mesa = $1 AND origen = $2', [testMesa, 'MANUAL']);
    assert.strictEqual(checkVotos.rows.length, 1);
    const row = checkVotos.rows[0];

    assert.strictEqual(row.p_fp_votos, 15, 'p_fp_votos debe ser 15');
    assert.strictEqual(row.p_jp_votos, 22, 'p_jp_votos debe ser 22');
    assert.strictEqual(row.p_sp_votos, 30, 'p_sp_votos debe ser 30');
    assert.strictEqual(row.p_frepap_votos, 5, 'p_frepap_votos debe ser 5');
    assert.strictEqual(row.p_verde_votos, 2, 'p_verde_votos debe ser 2');
    assert.strictEqual(row.p_morado_votos, 8, 'p_morado_votos debe ser 8');
    assert.strictEqual(row.p_nulos, 4, 'p_nulos debe ser 4');
    assert.strictEqual(row.p_blanco, 1, 'p_blanco debe ser 1');
    assert.strictEqual(row.p_impugnados, 3, 'p_impugnados debe ser 3');
    assert.strictEqual(row.p_total_votos, 90, 'p_total_votos debe ser 90');

    assert.strictEqual(row.d_fp_votos, 10, 'd_fp_votos debe ser 10');
    assert.strictEqual(row.d_jp_votos, 18, 'd_jp_votos debe ser 18');
    assert.strictEqual(row.d_sp_votos, 40, 'd_sp_votos debe ser 40');
    assert.strictEqual(row.d_frepap_votos, 3, 'd_frepap_votos debe ser 3');
    assert.strictEqual(row.d_verde_votos, 1, 'd_verde_votos debe ser 1');
    assert.strictEqual(row.d_morado_votos, 6, 'd_morado_votos debe ser 6');
    assert.strictEqual(row.d_nulos, 2, 'd_nulos debe ser 2');
    assert.strictEqual(row.d_blanco, 0, 'd_blanco debe ser 0');
    assert.strictEqual(row.d_impugnados, 1, 'd_impugnados debe ser 1');
    assert.strictEqual(row.d_total_votos, 81, 'd_total_votos debe ser 81');

    console.log('✅ [PASSED] Votos manuales registrados en la tabla votos_detalle con dígitos exactos y totales correctos (incluyendo BLANCOS e IMPUGNADOS).');

    // 2. Probar registro de asistencia con foto
    const sampleFoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBD...';
    const payloadAsistencia = {
      action: 'registrar_asistencia',
      nombre: 'Personero Test Asistencia',
      dni: testDni,
      distrito: 'Miraflores',
      local: 'Colegio Test',
      mesa: testMesa,
      confirmacion: 'SI',
      fotoBase64: sampleFoto,
      ubicacion_gps: 'Lat: -12.1234, Lng: -77.0123'
    };

    const resAsistencia = await postgresRepo.registrarAsistencia(payloadAsistencia);
    assert.strictEqual(resAsistencia.success, true);

    const checkAsis = await query('SELECT * FROM asistencia WHERE dni = $1 ORDER BY id DESC LIMIT 1', [testDni]);
    assert.strictEqual(checkAsis.rows.length, 1);
    const asisRow = checkAsis.rows[0];

    assert.strictEqual(asisRow.foto_url, sampleFoto, 'foto_url en asistencia debe coincidir con la foto enviada');
    assert.strictEqual(asisRow.dni, testDni);
    assert.strictEqual(asisRow.mesa, testMesa);
    console.log('✅ [PASSED] Asistencia registrada en la tabla asistencia con foto_url guardada exitosamente.');

    // 3. Probar reporte con agrupación por distrito
    const reporte = await postgresRepo.obtenerReporte();
    assert.strictEqual(reporte.success, true);
    assert.ok(reporte.reporte_por_distrito['MIRAFLORES'], 'Debe existir reporte agrupado para MIRAFLORES');
    console.log('✅ [PASSED] Reporte electoral agrupado por distrito y candidatos generado exitosamente.');

    // Limpiar datos de prueba
    await query('DELETE FROM votos_detalle WHERE numero_mesa = $1', [testMesa]);
    await query('DELETE FROM asistencia WHERE dni = $1', [testDni]);
    console.log('🧹 [CLEANUP] Datos temporales de prueba eliminados.');

    console.log('\n======================================================');
    console.log('🎉 TODAS LAS PRUEBAS EN BASE DE DATOS FUERON EXITOSAS');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Error en prueba live DB:', err);
    process.exit(1);
  } finally {
    const pool = getPool();
    if (pool) await pool.end();
  }
}

testLiveDb();
