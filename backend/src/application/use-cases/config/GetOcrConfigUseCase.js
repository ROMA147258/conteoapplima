const sqlConfigRepo = require('../../../infrastructure/repositories/SqlConfigRepository');
const env = require('../../../config/env');

class GetOcrConfigUseCase {
  constructor(configRepo = sqlConfigRepo) {
    this.configRepo = configRepo;
  }

  execute() {
    const cfg = this.configRepo.getConfig();
    return {
      success: true,
      ocrProvider: env.OCR_PROVIDER || 'gemini',
      geminiModel: 'gemini-2.5-flash',
      configured: true
    };
  }
}

module.exports = new GetOcrConfigUseCase();
