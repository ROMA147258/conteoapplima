const sqlCoordinatorRepo = require('../../../infrastructure/repositories/SqlCoordinatorRepository');

class GetConfirmationsUseCase {
  constructor(coordinatorRepo = sqlCoordinatorRepo) {
    this.coordinatorRepo = coordinatorRepo;
  }

  async execute(colegio) {
    const list = await this.coordinatorRepo.getConfirmationsBySchool(colegio);
    return {
      success: true,
      confirmaciones: list
    };
  }
}

module.exports = new GetConfirmationsUseCase();
