const electoralBloomManager = require('../src/infrastructure/cache/ElectoralBloomManager');
const postgresRepo = require('../src/infrastructure/repositories/PostgresRepository');

async function testSystem() {
  console.log('\n======================================================');
  console.log('🧪 TEST DE INTEGRACIÓN: BLOOM FILTER + REPOSITORIO');
  console.log('======================================================\n');

  try {
    // 1. Inicializar Filtro de Bloom
    console.log('⏳ Inicializando Bloom Manager...');
    await electoralBloomManager.init();
    console.log(`   - Bloom Filter listo con ${electoralBloomManager.dniFilter.itemCount} DNIs y ${electoralBloomManager.mesaFilter.itemCount} mesas.`);

    // 2. Test Login con DNI inexistente (debe ser descartado al instante por Bloom)
    const nonExistentDni = '00000001';
    console.log(`\n⏳ Probando login con DNI inexistente: ${nonExistentDni}...`);
    const t0 = performance.now();
    const loginFail = await postgresRepo.login({ dni: nonExistentDni });
    const elapsedFail = (performance.now() - t0).toFixed(3);
    console.log(`✅ Respuesta en ${elapsedFail}ms:`, loginFail);

    // 3. Test Login con DNI de prueba
    console.log('\n⏳ Probando login con warmup...');
    const tWarmup = performance.now();
    const loginWarm = await postgresRepo.login({ dni: '__warmup__' });
    const elapsedWarm = (performance.now() - tWarmup).toFixed(3);
    console.log(`✅ Respuesta warmup en ${elapsedWarm}ms:`, loginWarm);

    console.log('\n======================================================');
    console.log('🎉 TESTS DE INTEGRACIÓN EJECUTADOS CON ÉXITO');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en test de integración:', err.message);
    process.exit(1);
  }
}

testSystem();
