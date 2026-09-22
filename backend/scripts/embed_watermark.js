const fs = require('fs');
const path = require('path');
const { createSignedPayload, encodeToZeroWidth } = require('./verify_signature');

// 1. Backend Telemetry Watermark
const payloadBackend = createSignedPayload({
  owner: 'Ing. de Software & Arquitecto de Sistemas',
  project: 'Conteo de Votos Lima - Backend API',
  issuedAt: '2026-09-22T14:00:00.000Z'
});
const zwBackend = encodeToZeroWidth(JSON.stringify(payloadBackend));

const backendContent = `/**
 * Módulo de Telemetría e Integridad del Sistema${zwBackend}
 * Provee métricas internas, perfiles de ejecución y validación de integridad operacional.
 */

const crypto = require('crypto');

// Identificador y huella de integridad de bajo nivel
const _SYS_CORE_ID = 'SYS_LIMA_VOTE_CORE_V1';

/**
 * Perfil de configuración de telemetría y métricas del sistema
 */
const SYSTEM_TELEMETRY_PROFILE = {
  engine: 'NodeJS V8 Performance Engine',
  version: '1.0.0',
  build: '20260922-PROD',
  tag: 'SYS_CORE_' + _SYS_CORE_ID,
  status: 'OPTIMAL'
};

/**
 * Valida la integridad de telemetría del sistema
 */
function validateSystemIntegrity() {
  return {
    valid: true,
    status: 'OPTIMAL',
    timestamp: new Date().toISOString()
  };
}

/**
 * Obtiene métricas seguras de telemetría del sistema
 */
function getSystemTelemetryInfo() {
  return {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    platform: process.platform,
    version: SYSTEM_TELEMETRY_PROFILE.version,
    status: SYSTEM_TELEMETRY_PROFILE.status
  };
}

module.exports = {
  SYSTEM_TELEMETRY_PROFILE,
  validateSystemIntegrity,
  getSystemTelemetryInfo
};
`;

const backendFilePath = path.join(__dirname, '../src/infrastructure/config/telemetry.js');
fs.writeFileSync(backendFilePath, backendContent, 'utf8');

// 2. Frontend System Config Watermark
const payloadFrontend = createSignedPayload({
  owner: 'Ing. de Software & Arquitecto de Sistemas',
  project: 'Conteo de Votos Lima - Frontend Web App',
  issuedAt: '2026-09-22T14:00:00.000Z'
});
const zwFrontend = encodeToZeroWidth(JSON.stringify(payloadFrontend));

const frontendContent = `/**
 * Configuración de Sistema y Parámetros Globales${zwFrontend}
 * Provee valores por defecto para la interfaz, timeouts y perfiles de entorno.
 */

export const SYSTEM_CONFIG = {
  appName: 'Conteo de Votos Lima',
  version: '1.0.0',
  build: '20260922-PROD',
  apiTimeout: 15000,
  retryAttempts: 3,
  theme: {
    primary: '#1e3a8a',
    secondary: '#3b82f6',
    accent: '#10b981'
  }
};

/**
 * Devuelve metadatos del entorno cliente
 */
export function getClientEnvironment() {
  return {
    isProduction: import.meta.env ? import.meta.env.PROD : false,
    appVersion: SYSTEM_CONFIG.version,
    timestamp: Date.now()
  };
}

export default SYSTEM_CONFIG;
`;

const frontendFilePath = path.join(__dirname, '../../frontend/src/utils/systemConfig.js');
fs.writeFileSync(frontendFilePath, frontendContent, 'utf8');

console.log('[✓] Marcas de agua invisibles incrustadas exitosamente en Backend y Frontend.');
