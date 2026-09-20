const assert = require('assert');
const postgresRepo = require('../src/infrastructure/repositories/PostgresRepository');
const { query } = require('../src/infrastructure/database/connection');

async function testMultiPersonero() {
  console.log('\n======================================================');
  console.log('🧪 VALIDANDO INDEPENDENCIA TOTAL DE PERSONEROS (MANUAL + IMAGEN)');
  console.log('======================================================\n');

  const p1 = { dni: 'TEST_P1_DNI', nombre: 'REYNA PACAYA', mesa: '123456' };
  const p2 = { dni: 'TEST_P2_DNI', nombre: 'LILIANA CORI', mesa: '123456' };

  try {
    // 1. Limpiar previos
    await query("DELETE FROM votos_detalle WHERE dni IN ($1, $2)", [p1.dni, p2.dni]);

    // 2. Personero 1 envía MANUAL
    await postgresRepo.registrarVotos({
      brigadista: p1.nombre,
      dni: p1.dni,
      mesa: p1.mesa,
      origen: 'MANUAL',
      votos: { provincial: { FP: 10 }, distrital: { FP: 5 } }
    });

    // 3. Personero 1 envía IMAGEN
    await postgresRepo.registrarVotos({
      brigadista: p1.nombre,
      dni: p1.dni,
      mesa: p1.mesa,
      origen: 'IMAGEN',
      votos: { provincial: { FP: 12 }, distrital: { FP: 6 } }
    });

    // 4. Personero 2 envía MANUAL en la MISMA MESA
    await postgresRepo.registrarVotos({
      brigadista: p2.nombre,
      dni: p2.dni,
      mesa: p2.mesa,
      origen: 'MANUAL',
      votos: { provincial: { JP: 20 }, distrital: { JP: 15 } }
    });

    // 5. Personero 2 envía IMAGEN en la MISMA MESA
    await postgresRepo.registrarVotos({
      brigadista: p2.nombre,
      dni: p2.dni,
      mesa: p2.mesa,
      origen: 'IMAGEN',
      votos: { provincial: { JP: 25 }, distrital: { JP: 18 } }
    });

    // 6. Consultar los registros existentes
    const res = await query("SELECT id, dni, personero, origen, numero_mesa FROM votos_detalle WHERE dni IN ($1, $2) ORDER BY id ASC", [p1.dni, p2.dni]);

    console.log(`Filas registradas en votos_detalle: ${res.rows.length}`);
    res.rows.forEach(r => {
      console.log(`  - ID: ${r.id} | DNI: ${r.dni} | Personero: ${r.personero} | Origen: ${r.origen} | Mesa: ${r.numero_mesa}`);
    });

    assert.strictEqual(res.rows.length, 4, 'Deben existir exactamente 4 filas independientes (2 de P1 y 2 de P2)');

    // 7. Personero 1 actualiza su MANUAL (reintento / corrección)
    await postgresRepo.registrarVotos({
      brigadista: p1.nombre,
      dni: p1.dni,
      mesa: p1.mesa,
      origen: 'MANUAL',
      votos: { provincial: { FP: 15 }, distrital: { FP: 8 } }
    });

    const resAfterUpdate = await query("SELECT id, dni, personero, origen, p_fp_votos FROM votos_detalle WHERE dni IN ($1, $2) ORDER BY id ASC", [p1.dni, p2.dni]);
    assert.strictEqual(resAfterUpdate.rows.length, 4, 'Siguen siendo 4 filas: la actualización de P1 no creó ni sobrescribió filas de P2');

    const p1ManualRow = resAfterUpdate.rows.find(r => r.dni === p1.dni && r.origen === 'MANUAL');
    assert.strictEqual(p1ManualRow.personero, 'REYNA PACAYA');
    assert.strictEqual(p1ManualRow.p_fp_votos, 15);

    const p2ManualRow = resAfterUpdate.rows.find(r => r.dni === p2.dni && r.origen === 'MANUAL');
    assert.strictEqual(p2ManualRow.personero, 'LILIANA CORI');

    console.log('\n✅ [PASSED] Cada personero tiene sus filas independientes (1 MANUAL y 1 IMAGEN) y jamás se sobrescriben.');

    // Cleanup
    await query("DELETE FROM votos_detalle WHERE dni IN ($1, $2)", [p1.dni, p2.dni]);
    console.log('🧹 [CLEANUP] Registros de prueba eliminados correctamente.\n');
  } catch (err) {
    console.error('❌ [FAILED] Error en la prueba:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

testMultiPersonero();
