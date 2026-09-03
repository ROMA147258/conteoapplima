const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('\n======================================================');
console.log('🔍 AUDITORÍA DE ESTRUCTURA LIMPIA Y CERO DUPLICADOS');
console.log('======================================================\n');

let checksPassed = 0;
let checksFailed = 0;

function audit(name, condition, details = '') {
  if (condition) {
    console.log(`  ✅ [AUDIT OK] ${name}`);
    checksPassed++;
  } else {
    console.error(`  ❌ [AUDIT FAIL] ${name} ${details}`);
    checksFailed++;
  }
}

// 1. Verificar Estructura Raíz
const rootDir = path.resolve(__dirname, '../../');
audit('Existe carpeta _backup_original/', fs.existsSync(path.join(rootDir, '_backup_original')));
audit('Existe carpeta _referencias/', fs.existsSync(path.join(rootDir, '_referencias')));
audit('Existe carpeta backend/', fs.existsSync(path.join(rootDir, 'backend')));
audit('Existe carpeta frontend/', fs.existsSync(path.join(rootDir, 'frontend')));
audit('Existe docker-compose.yml', fs.existsSync(path.join(rootDir, 'docker-compose.yml')));
audit('Existe .gitignore en la raíz', fs.existsSync(path.join(rootDir, '.gitignore')));
audit('Existe README.md en la raíz', fs.existsSync(path.join(rootDir, 'README.md')));

// 2. Verificar Regla de Único public/
audit('Existe frontend/public/', fs.existsSync(path.join(rootDir, 'frontend/public')));
audit('NO existe /public en la raíz', !fs.existsSync(path.join(rootDir, 'public')));
audit('NO existe backend/public/', !fs.existsSync(path.join(rootDir, 'backend/public')));
audit('NO existe frontend/src/public', !fs.existsSync(path.join(rootDir, 'frontend/src/public')));
audit('frontend/public/ contiene favicon.svg', fs.existsSync(path.join(rootDir, 'frontend/public/favicon.svg')));
audit('NO existe duplicado de imágenes en frontend/public/img', !fs.existsSync(path.join(rootDir, 'frontend/public/img')));

// 3. Verificar que _referencias/ contiene las 5 imágenes de referencia
const refImages = [
  '01-mesa-incorrecta.png',
  '02-conteo-imagen.png',
  '03-conteo-manual.png',
  '04-control-votacion.png',
  '05-mesa-requerida.png'
];
refImages.forEach(img => {
  audit(`Existe imagen de referencia: _referencias/${img}`, fs.existsSync(path.join(rootDir, '_referencias', img)));
});

// 4. Verificar Entidades de Dominio Individuales
const entitiesDir = path.join(rootDir, 'backend/src/domain/entities');
const expectedEntities = ['User.js', 'Vote.js', 'Attendance.js', 'Arrival.js'];
expectedEntities.forEach(ent => {
  audit(`Existe entidad individual: domain/entities/${ent}`, fs.existsSync(path.join(entitiesDir, ent)));
});
audit('NO existe archivo monolítico Entities.js', !fs.existsSync(path.join(entitiesDir, 'Entities.js')));

// 5. Verificar Interfaces de Repositorios Individuales
const reposDir = path.join(rootDir, 'backend/src/domain/repositories');
const expectedRepos = [
  'IUserRepository.js',
  'IVoteRepository.js',
  'IAttendanceRepository.js',
  'ICoordinatorRepository.js',
  'IMesaRepository.js',
  'IReportRepository.js',
  'IConfigRepository.js'
];
expectedRepos.forEach(repo => {
  audit(`Existe contrato de repositorio: domain/repositories/${repo}`, fs.existsSync(path.join(reposDir, repo)));
});
audit('NO existe archivo monolítico IRepositories.js', !fs.existsSync(path.join(reposDir, 'IRepositories.js')));

// 6. Verificar Controladores Desacoplados
const controllersDir = path.join(rootDir, 'backend/src/interfaces/controllers');
const expectedControllers = [
  'AuthController.js',
  'VoteController.js',
  'AttendanceController.js',
  'CoordinatorController.js',
  'UserController.js',
  'MesaController.js',
  'ReportController.js',
  'ConfigController.js'
];
expectedControllers.forEach(ctrl => {
  audit(`Existe controlador individual: interfaces/controllers/${ctrl}`, fs.existsSync(path.join(controllersDir, ctrl)));
});
audit('NO existe MainRouterController.js monolítico', !fs.existsSync(path.join(controllersDir, 'MainRouterController.js')));

// 7. Verificar Vistas Modulares del Frontend
const frontendSrc = path.join(rootDir, 'frontend/src');
const expectedViews = [
  'views/Login/LoginView.jsx',
  'views/Counting/CountingView.jsx',
  'views/Counting/components/UserInfoBar.jsx',
  'views/Counting/components/MesaCard.jsx',
  'views/Counting/components/CountingTabs.jsx',
  'views/Counting/Manual/ManualCounting.jsx',
  'views/Counting/Manual/ProvincialTable.jsx',
  'views/Counting/Manual/DistrictTable.jsx',
  'views/Counting/OCR/OcrCounting.jsx',
  'views/Counting/OCR/OcrCandidatesTable.jsx',
  'views/Coordinator/CoordinatorView.jsx'
];
expectedViews.forEach(v => {
  audit(`Existe vista/componente React: ${v}`, fs.existsSync(path.join(frontendSrc, v)));
});
audit('NO existen vistas planas redundantes en views/', (
  !fs.existsSync(path.join(frontendSrc, 'views/CountingView.jsx')) &&
  !fs.existsSync(path.join(frontendSrc, 'views/LoginView.jsx')) &&
  !fs.existsSync(path.join(frontendSrc, 'views/CoordinatorView.jsx'))
));

// 8. Verificar Modales y Servicios
const expectedModals = [
  'components/common/AlertDialog.jsx',
  'components/modals/WelcomeModal.jsx',
  'components/modals/ConfigModal.jsx',
  'components/modals/ScannerModal.jsx',
  'components/modals/OcrDetailModal.jsx',
  'components/modals/AttendanceSyncLoader.jsx'
];
expectedModals.forEach(m => {
  audit(`Existe modal React: ${m}`, fs.existsSync(path.join(frontendSrc, m)));
});

const expectedServices = [
  'services/api/apiClient.js',
  'services/gps/geolocationService.js',
  'services/sync/offlineQueue.js',
  'services/sync/syncService.js',
  'services/sync/syncManager.js',
  'services/ocr/opencvService.js',
  'services/ocr/tesseractService.js',
  'services/ocr/ollamaService.js',
  'services/ocr/ocrPipeline.js'
];
expectedServices.forEach(s => {
  audit(`Existe servicio desacoplado: ${s}`, fs.existsSync(path.join(frontendSrc, s)));
});

// 9. Verificar Dockerfiles e Ignorados
audit('Existe backend/Dockerfile', fs.existsSync(path.join(rootDir, 'backend/Dockerfile')));
audit('Existe frontend/Dockerfile', fs.existsSync(path.join(rootDir, 'frontend/Dockerfile')));
audit('Existe .dockerignore en raíz', fs.existsSync(path.join(rootDir, '.dockerignore')));

console.log('\n======================================================');
console.log(`📊 AUDITORÍA: ${checksPassed} VERIFICACIONES EXITOSAS | ${checksFailed} FALLOS`);
console.log('======================================================\n');

if (checksFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
