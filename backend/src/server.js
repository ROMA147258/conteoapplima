const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./interfaces/routes/apiRoutes');
const errorHandler = require('./interfaces/middleware/errorHandler');

const app = express();

app.use(cors());
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

if (require.main === module) {
  app.listen(env.PORT, '0.0.0.0', async () => {
    console.log(`\n======================================================`);
    console.log(`🚀 SERVIDOR VOTOREAL ACTIVO (PostgreSQL 16)`);
    console.log(`📡 Puerto: ${env.PORT}`);
    console.log(`🔗 Endpoint API: http://localhost:${env.PORT}/api/voto-real`);
    console.log(`======================================================\n`);

    try {
      await runMigrations();
    } catch (e) {
      console.warn('[Server] Las migraciones se reintentarán al conectar la BD.');
    }
  });
}

module.exports = app;
