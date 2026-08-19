const sqlUserRepo = require('../../../infrastructure/repositories/SqlUserRepository');

class GetUsersUseCase {
  constructor(userRepo = sqlUserRepo) {
    this.userRepo = userRepo;
  }

  async execute() {
    const list = await this.userRepo.getAllUsers();
    return {
      success: true,
      usuarios: list,
      data: list
    };
  }
}

module.exports = new GetUsersUseCase();
