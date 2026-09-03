const sqlConfigRepo = require('../../../infrastructure/repositories/SqlConfigRepository');

class GetOcrConfigUseCase {
  constructor(configRepo = sqlConfigRepo) {
    this.configRepo = configRepo;
  }

  execute() {
    const cfg = this.configRepo.getConfig();
    return {
      success: true,
      ollamaHost: cfg.ollamaHost,
      ollamaModel: cfg.ollamaModel,
      apiKey: cfg.apiKey || '',
      configured: true
    };
  }
}

module.exports = new GetOcrConfigUseCase();
