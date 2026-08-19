const sqlConfigRepo = require('../../../infrastructure/repositories/SqlConfigRepository');

class SaveConfigUseCase {
  constructor(configRepo = sqlConfigRepo) {
    this.configRepo = configRepo;
  }

  execute(data) {
    return this.configRepo.saveConfig(data);
  }
}

module.exports = new SaveConfigUseCase();
