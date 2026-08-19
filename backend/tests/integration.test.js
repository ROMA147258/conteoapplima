const assert = require('assert');
const authController = require('../src/interfaces/controllers/AuthController');
const voteController = require('../src/interfaces/controllers/VoteController');
const attendanceController = require('../src/interfaces/controllers/AttendanceController');
const coordinatorController = require('../src/interfaces/controllers/CoordinatorController');
const userController = require('../src/interfaces/controllers/UserController');
const mesaController = require('../src/interfaces/controllers/MesaController');
const reportController = require('../src/interfaces/controllers/ReportController');
const configController = require('../src/interfaces/controllers/ConfigController');

const loginUseCase = require('../src/application/use-cases/auth/LoginUseCase');
const registerVotesUseCase = require('../src/application/use-cases/votes/RegisterVotesUseCase');
const registerAttendanceUseCase = require('../src/application/use-cases/attendance/RegisterAttendanceUseCase');
const confirmArrivalUseCase = require('../src/application/use-cases/attendance/ConfirmArrivalUseCase');
const confirmCoordinatorUseCase = require('../src/application/use-cases/coordinator/ConfirmCoordinatorUseCase');
const getPersonerosUseCase = require('../src/application/use-cases/coordinator/GetPersonerosUseCase');
const getUsersUseCase = require('../src/application/use-cases/users/GetUsersUseCase');
const getMesasUseCase = require('../src/application/use-cases/mesas/GetMesasUseCase');
const getReportUseCase = require('../src/application/use-cases/reports/GetReportUseCase');
const getOcrConfigUseCase = require('../src/application/use-cases/config/GetOcrConfigUseCase');

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 EJECUTANDO SUITE DE PRUEBAS DE INTEGRACIÓN (VotoReal)');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASSED] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAILED] ${name}:`, err.message);
      failed++;
    }
  }

  // 1. Config
  await test('Get OCR Config', async () => {
    const res = getOcrConfigUseCase.execute();
    assert.strictEqual(res.success, true);
    assert.ok(res.hasOwnProperty('apiKey'));
  });

  // 2. Login Personero
  await test('Login Personero (71000001)', async () => {
    const res = await loginUseCase.execute({ dni: '71000001' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.usuario.dni, '71000001');
    assert.strictEqual(res.usuario.rol, 'Personero');
  });

  // 3. Login Coordinador
  await test('Login Coordinador (20000001)', async () => {
    const res = await loginUseCase.execute({ dni: '20000001' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.usuario.dni, '20000001');
    assert.strictEqual(res.usuario.rol, 'Coordinador');
  });

  // 4. Login Usuario Inexistente
  await test('Login Usuario Inexistente debe fallar', async () => {
    const res = await loginUseCase.execute({ dni: '00000000' });
    assert.strictEqual(res.success, false);
  });

  // 5. Registrar Asistencia
  await test('Registrar Asistencia Personero', async () => {
    const res = await registerAttendanceUseCase.execute({
      nombre: 'Juan Carlos Quispe Palomino',
      dni: '71000001',
      distrito: 'Ate',
      local: 'IE 0024 PEDRO ENRIQUE GONZALES SOTO',
      mesa: '037163',
      confirmacion: 'SI',
      fotoBase64: 'data:image/jpeg;base64,samplephoto',
      ubicacionGps: 'Lat: -12.0254, Lng: -76.9189'
    });
    assert.strictEqual(res.success, true);
  });

  // 6. Confirmar Llegada GPS
  await test('Confirmar Llegada GPS 50m', async () => {
    const res = await confirmArrivalUseCase.execute({
      nombre: 'Juan Carlos Quispe Palomino',
      dni: '71000001',
      distrito: 'Ate',
      colegio: 'IE 0024 PEDRO ENRIQUE GONZALES SOTO',
      mesa: '037163',
      lat: '-12.0254',
      lon: '-76.9189',
      distancia_metros: 12.5
    });
    assert.strictEqual(res.success, true);
  });

  // 7. Registrar Votos Manuales
  await test('Registrar Votos Manuales', async () => {
    const res = await registerVotesUseCase.execute({
      brigadista: 'Juan Carlos Quispe Palomino',
      dni: '71000001',
      departamento: 'Lima',
      provincia: 'Lima',
      ubicacion: 'Ate',
      colegio: 'IE 0024 PEDRO ENRIQUE GONZALES SOTO',
      mesa: '037163',
      origen: 'MANUAL',
      votos: {
        provincial: { "FP": 45, "JP": 30, "SOMOS PERU": 50, "FREPAP": 20, "VERDE": 10, "MORADO": 15 },
        distrital: { "FP": 40, "JP": 25, "SOMOS PERU": 60, "FREPAP": 15, "VERDE": 8, "MORADO": 12 }
      },
      votos_nulos: 5,
      votos_vacios: 2,
      votos_dist_nulos: 3,
      votos_dist_vacios: 1
    });
    assert.strictEqual(res.success, true);
  });

  // 8. Registrar Votos por Imagen (OCR)
  await test('Registrar Votos por Imagen (OCR)', async () => {
    const res = await registerVotesUseCase.execute({
      brigadista: 'Juan Carlos Quispe Palomino',
      dni: '71000001',
      departamento: 'Lima',
      provincia: 'Lima',
      ubicacion: 'Ate',
      colegio: 'IE 0024 PEDRO ENRIQUE GONZALES SOTO',
      mesa: '037163',
      origen: 'IMAGEN',
      votos: {
        provincial: { "FP": 45, "JP": 30, "SOMOS PERU": 50, "FREPAP": 20, "VERDE": 10, "MORADO": 15 },
        distrital: { "FP": 40, "JP": 25, "SOMOS PERU": 60, "FREPAP": 15, "VERDE": 8, "MORADO": 12 }
      },
      votos_nulos: 5,
      votos_vacios: 2,
      votos_dist_nulos: 3,
      votos_dist_vacios: 1
    });
    assert.strictEqual(res.success, true);
  });

  // 9. Confirmación de Coordinador
  await test('Confirmación de Personero por Coordinador', async () => {
    const res = await confirmCoordinatorUseCase.execute({
      personeroNombre: 'Juan Carlos Quispe Palomino',
      personeroDni: '71000001',
      distrito: 'Ate',
      local: 'IE 0024 PEDRO ENRIQUE GONZALES SOTO',
      coordinadorNombre: 'Coord. Juan Quispe',
      coordinadorDni: '20000001',
      confirmacion: 'SI',
      fotoBase64: 'data:image/jpeg;base64,coordphoto'
    });
    assert.strictEqual(res.success, true);
  });

  // 10. Obtener Personeros por Colegio
  await test('Obtener Personeros por Colegio', async () => {
    const res = await getPersonerosUseCase.execute({
      colegio: 'IE 0024 PEDRO ENRIQUE GONZALES SOTO',
      distrito: 'Ate',
      origenHoja: 'Usuarios1'
    });
    assert.strictEqual(res.success, true);
    assert.ok(Array.isArray(res.personeros));
  });

  // 11. Obtener Todos los Usuarios
  await test('Obtener Usuarios', async () => {
    const res = await getUsersUseCase.execute();
    assert.strictEqual(res.success, true);
    assert.ok(res.usuarios.length > 0);
  });

  // 12. Obtener Mesas
  await test('Obtener Mesas', async () => {
    const res = await getMesasUseCase.execute();
    assert.strictEqual(res.success, true);
    assert.ok(Array.isArray(res.mesas));
    assert.ok(Array.isArray(res.mesas_estructura));
  });

  // 13. Obtener Reporte Electoral
  await test('Obtener Reporte Electoral', async () => {
    const res = await getReportUseCase.execute();
    assert.strictEqual(res.success, true);
    assert.ok(res.totales_provincial);
    assert.ok(res.totales_distrital);
  });

  // 14. Controladores Desacoplados
  await test('UserController & AuthController', async () => {
    assert.ok(typeof userController.getUsers === 'function');
    assert.ok(typeof authController.login === 'function');
    assert.ok(typeof voteController.registerVotes === 'function');
    assert.ok(typeof attendanceController.registerAttendance === 'function');
    assert.ok(typeof coordinatorController.confirmCoordinator === 'function');
    assert.ok(typeof mesaController.getMesas === 'function');
    assert.ok(typeof reportController.getReport === 'function');
    assert.ok(typeof configController.getConfig === 'function');
  });

  console.log('\n======================================================');
  console.log(`📊 RESUMEN: ${passed} PASARON | ${failed} FALLARON`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Error fatal en pruebas:', err);
  process.exit(1);
});
