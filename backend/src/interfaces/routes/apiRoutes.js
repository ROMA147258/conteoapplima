const express = require('express');
const router = express.Router();

const postgresRepo = require('../../infrastructure/repositories/PostgresRepository');
const configController = require('../controllers/ConfigController');
const tokenService = require('../../infrastructure/services/tokenService');
const { optionalAuthMiddleware } = require('../middleware/authMiddleware');

// 1. Configuración de API y OCR
router.get('/config', (req, res) => configController.getConfig(req, res));
router.post('/save-config', (req, res) => configController.saveConfig(req, res));
router.get('/config-ocr', (req, res) => configController.getOcrConfig(req, res));
router.post('/ocr/process', (req, res) => configController.processOcr(req, res));

// 2. Autenticación y Cierre de Sesión en Servidor
router.post('/login', async (req, res) => {
  try {
    const { dni, nombre } = req.body || {};
    if (dni && typeof dni !== 'string' && typeof dni !== 'number') {
      return res.status(400).json({ success: false, message: 'Formato de DNI inválido' });
    }
    const result = await postgresRepo.login(req.body || {});
    if (result.success && result.usuario) {
      // Emitir token JWT firmado por el servidor
      const token = tokenService.generateToken(result.usuario);
      result.token = token;
    }
    return res.status(result.success ? 200 : 401).json(result);
  } catch (e) {
    console.error('[API Security Error - Login]:', e);
    return res.status(500).json({ success: false, message: 'Error interno en el servidor al autenticar' });
  }
});

router.post('/logout', optionalAuthMiddleware, (req, res) => {
  try {
    if (req.token) {
      tokenService.invalidateToken(req.token);
    }
    return res.status(200).json({ success: true, message: 'Sesión invalidada exitosamente en el servidor' });
  } catch (e) {
    return res.status(200).json({ success: true, message: 'Sesión cerrada' });
  }
});

// 3. Endpoints Específicos
router.post('/registrar-votos', optionalAuthMiddleware, async (req, res) => {
  try {
    const payload = req.body || {};
    // Si viene autenticado con token, prevalece la identidad verificada del servidor
    if (req.user && req.user.sub) {
      payload.authenticatedDni = req.user.sub;
      payload.authenticatedRol = req.user.rol;
    }
    const result = await postgresRepo.registrarVotos(payload);
    return res.status(200).json(result);
  } catch (e) {
    console.error('[API Security Error - Registrar Votos]:', e);
    return res.status(500).json({ success: false, message: 'Error al registrar votos en el servidor' });
  }
});

router.post('/registrar-asistencia', optionalAuthMiddleware, async (req, res) => {
  try {
    const payload = req.body || {};
    if (req.user && req.user.sub) {
      payload.authenticatedDni = req.user.sub;
    }
    const result = await postgresRepo.registrarAsistencia(payload);
    return res.status(200).json(result);
  } catch (e) {
    console.error('[API Security Error - Asistencia]:', e);
    return res.status(500).json({ success: false, message: 'Error al registrar asistencia en el servidor' });
  }
});

router.post('/confirmar-llegada', optionalAuthMiddleware, async (req, res) => {
  try {
    const result = await postgresRepo.confirmarAsistenciaLlegada(req.body || {});
    return res.status(200).json(result);
  } catch (e) {
    console.error('[API Security Error - Confirmar Llegada]:', e);
    return res.status(500).json({ success: false, message: 'Error al confirmar llegada en el servidor' });
  }
});

router.post('/confirmar-coordinador', optionalAuthMiddleware, async (req, res) => {
  try {
    const result = await postgresRepo.confirmarCoordinador(req.body || {});
    return res.status(200).json(result);
  } catch (e) {
    console.error('[API Security Error - Confirmar Coord]:', e);
    return res.status(500).json({ success: false, message: 'Error al confirmar coordinador en el servidor' });
  }
});

router.get('/usuarios', async (req, res) => {
  try {
    const result = await postgresRepo.obtenerUsuarios();
    return res.status(200).json(result);
  } catch (e) {
    console.error('[API Error - Usuarios]:', e);
    return res.status(500).json({ success: false, message: 'Error al consultar usuarios' });
  }
});

router.get('/mesas', async (req, res) => {
  try {
    const result = await postgresRepo.obtenerMesas();
    return res.status(200).json(result);
  } catch (e) {
    console.error('[API Error - Mesas]:', e);
    return res.status(500).json({ success: false, message: 'Error al consultar mesas' });
  }
});

router.get('/reporte', async (req, res) => {
  try {
    const result = await postgresRepo.obtenerReporte();
    return res.status(200).json(result);
  } catch (e) {
    console.error('[API Error - Reporte]:', e);
    return res.status(500).json({ success: false, message: 'Error al generar reporte' });
  }
});

// 4. Router de compatibilidad 100% con VotoReal (/api/voto-real)
router.all('/voto-real', optionalAuthMiddleware, async (req, res) => {
  const payload = { ...(req.query || {}), ...(req.body || {}) };
  const action = payload.action;

  try {
    switch (action) {
      case 'login': {
        const result = await postgresRepo.login(payload);
        if (result.success && result.usuario) {
          result.token = tokenService.generateToken(result.usuario);
        }
        return res.json(result);
      }
      case 'logout': {
        if (req.token) tokenService.invalidateToken(req.token);
        return res.json({ success: true, message: 'Sesión invalidada' });
      }
      case 'registrar_votos':
        return res.json(await postgresRepo.registrarVotos(payload));
      case 'registrar_asistencia':
        return res.json(await postgresRepo.registrarAsistencia(payload));
      case 'confirmar_asistencia_llegada':
        return res.json(await postgresRepo.confirmarAsistenciaLlegada(payload));
      case 'confirmar_coordinador':
      case 'confirmar_asistencia_coordinador':
        return res.json(await postgresRepo.confirmarCoordinador(payload));
      case 'obtener_usuarios':
      case 'read':
        return res.json(await postgresRepo.obtenerUsuarios());
      case 'obtener_asistencia':
        return res.json(await postgresRepo.obtenerAsistencia());
      case 'obtener_asistencia_por_dni':
        return res.json(await postgresRepo.obtenerAsistenciaPorDni(payload.dni));
      case 'obtener_coordinadores':
        return res.json(await postgresRepo.obtenerCoordinadores());
      case 'obtener_personeros_por_colegio':
        return res.json(await postgresRepo.obtenerPersonerosPorColegio(payload));
      case 'obtener_confirmaciones_por_colegio':
        return res.json(await postgresRepo.obtenerConfirmacionesPorColegio(payload.colegio || payload.local, payload.distrito || payload.ubicacion));
      case 'obtener_mesas':
        return res.json(await postgresRepo.obtenerMesas());
      case 'obtener_coordenadas_colegio':
        return res.json(await postgresRepo.obtenerCoordenadasColegio(payload));
      case 'obtener_reporte':
      case 'read_reporte':
        return res.json(await postgresRepo.obtenerReporte());
      case 'obtener_config_ocr':
        return configController.getOcrConfig(req, res);
      case 'procesar_acta_ocr':
        return configController.processOcr(req, res);
      default:
        return res.status(400).json({ success: false, message: `Acción '${action}' no reconocida` });
    }
  } catch (err) {
    console.error(`[API VotoReal Error - ${action}]:`, err);
    return res.status(500).json({ success: false, message: 'Error interno en la operación solicitada' });
  }
});

module.exports = router;
