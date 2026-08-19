const sqlMesaRepo = require('../../../infrastructure/repositories/SqlMesaRepository');

class GetSchoolCoordinatesUseCase {
  constructor(mesaRepo = sqlMesaRepo) {
    this.mesaRepo = mesaRepo;
  }

  async execute(payload) {
    const coords = await this.mesaRepo.getSchoolCoordinates(payload);
    if (coords) {
      return {
        success: true,
        ...coords
      };
    }
    return {
      success: false,
      message: 'Coordenadas no encontradas para este colegio'
    };
  }
}

module.exports = new GetSchoolCoordinatesUseCase();
