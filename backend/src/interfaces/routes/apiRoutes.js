const express = require('express');
const router = express.Router();

const postgresRepo = require('../../infrastructure/repositories/PostgresRepository');
const configController = require('../controllers/ConfigController');

// 1. Configuración de API y OCR
router.get('/config', (req, res) => configController.getConfig(req, res));
router.post('/save-config', (req, res) => configController.saveConfig(req, res));
router.get('/config-ocr', (req, res) => configController.getOcrConfig(req, res));
router.post('/ocr/process', (req, res) => configController.processOcr(req, res));

// 2. Endpoints REST específicos (PostgreSQL 16)
router.post('/login', async (req, res) => {
  try {
    const result = await postgresRepo.login(req.body || {});
    return res.status(result.success ? 200 : 401).json(result);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/registrar-votos', async (req, res) => {
  try {
    const result = await postgresRepo.registrarVotos(req.body || {});
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/registrar-asistencia', async (req, res) => {
  try {
    const result = await postgresRepo.registrarAsistencia(req.body || {});
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/confirmar-llegada', async (req, res) => {
  try {
    const result = await postgresRepo.confirmarAsistenciaLlegada(req.body || {});
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/confirmar-coordinador', async (req, res) => {
  try {
    const result = await postgresRepo.confirmarCoordinador(req.body || {});
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/usuarios', async (req, res) => {
  try {
    const result = await postgresRepo.obtenerUsuarios();
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/mesas', async (req, res) => {
  try {
    const result = await postgresRepo.obtenerMesas();
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/reporte', async (req, res) => {
  try {
    const result = await postgresRepo.obtenerReporte();
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// 3. Router de compatibilidad 100% con VotoReal (/api/voto-real)
router.all('/voto-real', async (req, res) => {
  const payload = { ...(req.query || {}), ...(req.body || {}) };
  const action = payload.action;

  try {
    switch (action) {
      case 'login':
        return res.json(await postgresRepo.login(payload));
      case 'registrar_votos':
        return res.json(await postgresRepo.registrarVotos(payload));
      case 'registrar_asistencia':
        return res.json(await postgresRepo.registrarAsistencia(payload));
      case 'confirmar_asistencia_llegada':
        return res.json(await postgresRepo.confirmarAsistenciaLlegada(payload));
      case 'confirmar_coordinador':
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
        return res.json(await postgresRepo.obtenerConfirmacionesPorColegio(payload.colegio || payload.local));
      case 'obtener_mesas':
        return res.json(await postgresRepo.obtenerMesas());
      case 'obtener_coordenadas_colegio':
        return res.json(await postgresRepo.obtenerCoordenadasColegio(payload));
      case 'obtener_reporte':
      case 'read_reporte':
        return res.json(await postgresRepo.obtenerReporte());
      case 'obtener_config_ocr':
        return res.json(await postgresRepo.obtenerConfigOcr());
      case 'procesar_acta_ocr':
        return configController.processOcr(req, res);
      default:
        return res.status(400).json({ success: false, message: `Acción '${action}' no reconocida` });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Compatibilidad adicional
router.get('/obtener_reporte', async (req, res) => {
  try {
    return res.json(await postgresRepo.obtenerReporte());
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/read_reporte', async (req, res) => {
  try {
    return res.json(await postgresRepo.obtenerReporte());
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
