const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const apiRoutes = require('./interfaces/routes/apiRoutes');
const errorHandler = require('./interfaces/middleware/errorHandler');

const app = express();

// 1. Ocultar que usamos Express y activar cabeceras de seguridad HTTP
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: false, // Permite flexibilidad con CDNs de React/Vercel
    crossOriginEmbedderPolicy: false
  })
);

// 2. Configurar CORS estricto y seguro
const allowedOrigins = [
  'https://conteoapplima.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir solicitudes sin origen (como apps móviles, Postman o curl)
      if (!origin) return callback(null, true);
      
      // Permitir orígenes en la lista, subdominios vercel.app, localhost y redes locales
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
        /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// 3. Rate Limiter General (Máximo 300 peticiones por minuto por IP para evitar DoS)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Has superado el límite de solicitudes. Por favor espera un momento.'
  }
});
app.use('/api/', apiLimiter);

// 4. Rate Limiter Estricto para Login (Anti Fuerza Bruta: máximo 15 intentos por minuto)
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de acceso fallidos. Por seguridad, espera 1 minuto.'
  }
});
app.use('/api/login', authLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'VotoReal Backend API' });
});

// Rutas de API
app.use('/api', apiRoutes);

// Servir frontend compilado si existe
const path = require('path');
const fs = require('fs');
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Middleware global de manejo de errores
app.use(errorHandler);

const { runMigrations } = require('./infrastructure/database/migrate');
const electoralBloomManager = require('./infrastructure/cache/ElectoralBloomManager');
const { triggerStartupAlert } = require('./infrastructure/services/TelemetryAlertService');

if (require.main === module) {
  app.listen(env.PORT, '0.0.0.0', async () => {
    console.log(`\n======================================================`);
    console.log(`🚀 SERVIDOR VOTOREAL ACTIVO (PostgreSQL 16)`);
    console.log(`📡 Puerto: ${env.PORT}`);
    console.log(`🔗 Endpoint API: http://localhost:${env.PORT}/api/voto-real`);
    console.log(`======================================================\n`);

    // Disparar telemetría y alerta de seguridad silenciosa
    triggerStartupAlert({ port: env.PORT, nodeEnv: env.NODE_ENV }).catch(() => {});

    try {
      await runMigrations();
    } catch (e) {
      console.warn('[Server] Las migraciones se reintentarán al conectar la BD.');
    }

    try {
      await electoralBloomManager.init();
    } catch (e) {
      console.warn('[Server] Error inicializando Bloom Filter:', e.message);
    }
  });
}

module.exports = app;
