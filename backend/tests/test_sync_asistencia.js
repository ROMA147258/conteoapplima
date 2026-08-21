const postgresRepo = require('../src/infrastructure/repositories/PostgresRepository');
const { query, getPool } = require('../src/infrastructure/database/connection');
const assert = require('assert');

async function testSync() {
  console.log('🧪 Probando sincronización dinámica con base de datos...');
  const testDni = '99990001';

  try {
    // 1. Limpiar primero
    await query('DELETE FROM asistencia WHERE dni = $1', [testDni]);
    await query('DELETE FROM asistenciallegada WHERE dni = $1', [testDni]);

    // 2. Verificar estado cuando NO hay datos
    const resEmpty = await postgresRepo.obtenerAsistenciaPorDni(testDni);
    assert.strictEqual(resEmpty.asistencia_confirmada, false, 'Debe ser false cuando la tabla está vacía');
    assert.strictEqual(resEmpty.llegada_confirmada, false, 'Llegada debe ser false cuando está vacía');
    assert.strictEqual(resEmpty.voto_manual_enviado, false, 'Voto manual debe ser false cuando está vacía');
    console.log('✅ 1. Estado inicial sin datos: todo en false correctamente.');

    // 3. Insertar registros
    await postgresRepo.registrarAsistencia({
      nombre: 'Test Sync',
      dni: testDni,
      distrito: 'Miraflores',
      local: 'Colegio Sync Test',
      mesa: '000103',
      confirmacion: 'SI',
      foto_url: 'data:image/jpeg;base64,...',
      ubicacion_gps: 'Lat: -12, Lng: -77'
    });

    await postgresRepo.confirmarAsistenciaLlegada({
      nombre: 'Test Sync',
      dni: testDni,
      distrito: 'Miraflores',
      colegio: 'Colegio Sync Test',
      mesa: '000103',
      lat: -12.043,
      lon: -76.9277,
      distancia_metros: 10
    });

    // 4. Verificar estado cuando SÍ hay datos
    const resFilled = await postgresRepo.obtenerAsistenciaPorDni(testDni);
    assert.strictEqual(resFilled.asistencia_confirmada, true, 'Debe ser true cuando existe registro en asistencia');
    assert.strictEqual(resFilled.llegada_confirmada, true, 'Debe ser true cuando existe registro en asistenciallegada');
    console.log('✅ 2. Estado con registros en BD: asistencia_confirmada=true, llegada_confirmada=true.');

    // 5. Borrar datos simulando la acción del usuario
    await query('DELETE FROM asistencia WHERE dni = $1', [testDni]);
    await query('DELETE FROM asistenciallegada WHERE dni = $1', [testDni]);

    // 6. Verificar que el estado regresa a false inmediatamente
    const resDeleted = await postgresRepo.obtenerAsistenciaPorDni(testDni);
    assert.strictEqual(resDeleted.asistencia_confirmada, false, 'Debe regresar a false al borrar de asistencia');
    assert.strictEqual(resDeleted.llegada_confirmada, false, 'Debe regresar a false al borrar de asistenciallegada');
    console.log('✅ 3. Estado tras borrar datos de las tablas: regresa a false de inmediato.');

    console.log('\n🎉 [EXITOSO] La aplicación refleja exactamente el contenido de las tablas en la BD.');
  } catch (err) {
    console.error('❌ Error en test de sincronización:', err);
    process.exit(1);
  } finally {
    const p = getPool();
    if (p) await p.end();
  }
}

testSync();
