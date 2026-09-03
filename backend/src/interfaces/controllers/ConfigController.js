const getOcrConfigUseCase = require('../../application/use-cases/config/GetOcrConfigUseCase');
const saveConfigUseCase = require('../../application/use-cases/config/SaveConfigUseCase');
const processOcrUseCase = require('../../application/use-cases/config/ProcessOcrUseCase');
const sqlConfigRepo = require('../../infrastructure/repositories/SqlConfigRepository');
const env = require('../../config/env');

class ConfigController {
  getConfig(req, res) {
    try {
      const cfg = sqlConfigRepo.getConfig();
      const sanitized = {
        apiUrl: cfg.apiUrl,
        ollamaHost: cfg.ollamaHost || env.OLLAMA_HOST || 'http://127.0.0.1:11434',
        ollamaModel: cfg.ollamaModel || env.OLLAMA_MODEL || 'moondream:latest'
      };
      return res.status(200).json(sanitized);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  getOcrConfig(req, res) {
    try {
      const result = getOcrConfigUseCase.execute();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  saveConfig(req, res) {
    try {
      const result = saveConfigUseCase.execute(req.body || {});
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async processOcr(req, res) {
    try {
      const payload = req.body || req.query || {};
      const result = await processOcrUseCase.execute(payload);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getOllamaModels(req, res) {
    try {
      const host = (req.query.host || req.body?.host || env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${host}/api/tags`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const models = (data.models || []).map(m => {
          const hasVision = (m.capabilities && m.capabilities.includes('vision')) ||
            m.name.includes('vision') ||
            m.name.includes('moondream') ||
            m.name.includes('llava') ||
            m.name.includes('minicpm') ||
            m.name.includes('bakllava');
          return {
            name: m.name,
            size: m.size,
            hasVision,
            details: m.details
          };
        });

        return res.status(200).json({
          success: true,
          host,
          models
        });
      } else {
        return res.status(response.status).json({
          success: false,
          message: `Ollama respondió con código ${response.status}`
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: `No se pudo conectar a Ollama: ${err.message}`
      });
    }
  }

  async testOllama(req, res) {
    try {
      const host = (req.query.host || req.body?.host || env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
      const startTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(`${host}/api/tags`, { signal: controller.signal });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const models = (data.models || []).map(m => m.name);
        const visionModels = (data.models || []).filter(m => 
          (m.capabilities && m.capabilities.includes('vision')) ||
          m.name.includes('vision') ||
          m.name.includes('moondream') ||
          m.name.includes('llava')
        ).map(m => m.name);

        return res.status(200).json({
          success: true,
          host,
          latencyMs,
          models,
          visionModels,
          hasVision: visionModels.length > 0,
          message: `Conexión exitosa (${latencyMs}ms). ${models.length} modelos encontrados (${visionModels.length} de visión).`
        });
      } else {
        return res.status(response.status).json({
          success: false,
          message: `Ollama respondió con estado HTTP ${response.status}`
        });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: `Error al conectar con Ollama (${err.message}). Asegúrate de que Ollama esté en ejecución.`
      });
    }
  }
}

module.exports = new ConfigController();
