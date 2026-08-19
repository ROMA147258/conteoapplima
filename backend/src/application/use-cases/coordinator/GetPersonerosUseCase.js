const sqlCoordinatorRepo = require('../../../infrastructure/repositories/SqlCoordinatorRepository');

class GetPersonerosUseCase {
  constructor(coordinatorRepo = sqlCoordinatorRepo) {
    this.coordinatorRepo = coordinatorRepo;
  }

  async execute(payload) {
    const list = await this.coordinatorRepo.getPersonerosBySchool(payload);
    return {
      success: true,
      personeros: list
    };
  }
}

module.exports = new GetPersonerosUseCase();
