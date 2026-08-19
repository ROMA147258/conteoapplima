const votingUseCases = require('../../application/use-cases/VotingUseCases');
const env = require('../../config/env');
const path = require('path');
const fs = require('fs');

class ApiController {
  // Manejador genérico para /api/voto-real (GET y POST)
  async handleVotoReal(req, res) {
    try {
      let payload = {};

      if (req.method === 'GET') {
        payload = { ...req.query };
      } else if (req.method === 'POST') {
        if (req.body && typeof req.body === 'object') {
          payload = req.body;
        } else if (typeof req.body === 'string' && req.body.trim()) {
          try {
            payload = JSON.parse(req.body);
          } catch (e) {
            payload = { ...req.query };
          }
        } else {
          payload = { ...req.query };
        }
      }

      const result = await votingUseCases.handleAction(payload);
      return res.status(200).json(result);
    } catch (err) {
      console.error('[API Controller Error]', err);
      return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Error interno: ' + err.message
      });
    }
  }

  // GET /api/config
  getConfig(req, res) {
    const configPath = path.resolve(__dirname, '../../../config.json');
    let cfg = {
      apiUrl: `http://localhost:${env.PORT}/api/voto-real`,
      geminiApiKey: env.GEMINI_API_KEY
    };

    if (fs.existsSync(configPath)) {
      try {
        const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        cfg = { ...cfg, ...saved };
      } catch (e) {}
    }

    return res.status(200).json(cfg);
  }

  // POST /api/save-config
  saveConfig(req, res) {
    try {
      const configData = req.body || {};
      const configPath = path.resolve(__dirname, '../../../config.json');
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
      return res.status(200).json({ success: true, message: 'Configuración guardada' });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }

  // Compatibilidad con GET reportes directos
  async getReport(req, res) {
    try {
      const result = await votingUseCases.handleAction({ action: 'obtener_reporte' });
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ApiController();
