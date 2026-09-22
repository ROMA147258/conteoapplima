const postgresRepo = require('../src/infrastructure/repositories/PostgresRepository');
const electoralBloomManager = require('../src/infrastructure/cache/ElectoralBloomManager');
const { query } = require('../src/infrastructure/database/connection');

async function testZonalAuth() {
  console.log('--- Iniciando Prueba de Autenticación de Coordinadores Zonales ---');

  // 1. Inicializar BloomFilter
  await electoralBloomManager.init();

  // 2. Obtener lista de coordinadores zonales
  const zonales = await query('SELECT id, dni, nombres_y_apellidos, clave_acceso, distrito_asignado FROM rcoordinadoresz ORDER BY id ASC');
  console.log(`\nVerificando ${zonales.rows.length} coordinadores zonales en base de datos:`);

  let allPassed = true;

  for (const z of zonales.rows) {
    console.log(`\n--- Probando: ${z.nombres_y_apellidos} (DNI: ${z.dni}, Clave: ${z.clave_acceso}) ---`);

    // A. Probar con clave_acceso exacta (ej. ZN....)
    const loginClave = await postgresRepo.login({ dni: z.clave_acceso });
    if (loginClave.success && loginClave.usuario && loginClave.usuario.tipo_interfaz === 'coordinador_zonal') {
      console.log(`✅ [OK] Login con clave ${z.clave_acceso} exitoso -> Rol: ${loginClave.usuario.rol}, Interfaz: ${loginClave.usuario.tipo_interfaz}`);
    } else if (z.distrito_asignado !== 'Villa María del Triunfo') {
      console.log(`ℹ️ [Distrito no VMT]: ${loginClave.message}`);
    } else {
      console.error(`❌ [FALLO] Login con clave ${z.clave_acceso}:`, loginClave);
      allPassed = false;
    }

    // B. Probar con clave en minúsculas (ej. zn....)
    const loginClaveLower = await postgresRepo.login({ dni: z.clave_acceso.toLowerCase() });
    if (loginClaveLower.success && loginClaveLower.usuario && loginClaveLower.usuario.tipo_interfaz === 'coordinador_zonal') {
      console.log(`✅ [OK] Login con clave minúscula ${z.clave_acceso.toLowerCase()} exitoso`);
    } else if (z.distrito_asignado !== 'Villa María del Triunfo') {
      console.log(`ℹ️ [Distrito no VMT]: ${loginClaveLower.message}`);
    } else {
      console.error(`❌ [FALLO] Login con minúsculas ${z.clave_acceso.toLowerCase()}:`, loginClaveLower);
      allPassed = false;
    }

    // C. Probar con DNI directo -> Debe ser rechazado
    const loginDni = await postgresRepo.login({ dni: z.dni });
    if (!loginDni.success) {
      console.log(`✅ [OK] Intento con DNI directo ${z.dni} denegado correctamente: "${loginDni.message}"`);
    } else {
      console.error(`❌ [FALLO] El login con DNI directo ${z.dni} NO debió permitirse:`, loginDni);
      allPassed = false;
    }
  }

  console.log('\n========================================');
  if (allPassed) {
    console.log('🎉 TODAS LAS PRUEBAS PASARON SATISFACTORIAMENTE');
  } else {
    console.log('⚠️ HUBO ERRORES EN LAS PRUEBAS');
  }
  console.log('========================================\n');

  process.exit(allPassed ? 0 : 1);
}

testZonalAuth().catch(e => {
  console.error('Error durante test:', e);
  process.exit(1);
});
