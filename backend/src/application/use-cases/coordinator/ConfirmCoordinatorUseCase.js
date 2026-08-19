const sqlCoordinatorRepo = require('../../../infrastructure/repositories/SqlCoordinatorRepository');

class ConfirmCoordinatorUseCase {
  constructor(coordinatorRepo = sqlCoordinatorRepo) {
    this.coordinatorRepo = coordinatorRepo;
  }

  async execute(payload) {
    return await this.coordinatorRepo.saveCoordinatorVerification(payload);
  }
}

module.exports = new ConfirmCoordinatorUseCase();
