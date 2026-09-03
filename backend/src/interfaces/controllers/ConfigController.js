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
        ocrProvider: env.OCR_PROVIDER || 'gemini',
        geminiModel: 'gemini-2.5-flash'
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
}

module.exports = new ConfigController();
