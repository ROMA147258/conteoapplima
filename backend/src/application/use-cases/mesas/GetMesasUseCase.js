const sqlMesaRepo = require('../../../infrastructure/repositories/SqlMesaRepository');

class GetMesasUseCase {
  constructor(mesaRepo = sqlMesaRepo) {
    this.mesaRepo = mesaRepo;
  }

  async execute() {
    const result = await this.mesaRepo.getAllMesas();
    return {
      success: true,
      mesas: result.mesas,
      mesas_estructura: result.mesas_estructura
    };
  }
}

module.exports = new GetMesasUseCase();
