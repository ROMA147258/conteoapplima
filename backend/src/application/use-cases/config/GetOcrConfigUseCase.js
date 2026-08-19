const sqlConfigRepo = require('../../../infrastructure/repositories/SqlConfigRepository');

class GetOcrConfigUseCase {
  constructor(configRepo = sqlConfigRepo) {
    this.configRepo = configRepo;
  }

  execute() {
    const cfg = this.configRepo.getConfig();
    return {
      success: true,
      apiKey: cfg.geminiApiKey,
      geminiApiKey: cfg.geminiApiKey
    };
  }
}

module.exports = new GetOcrConfigUseCase();
