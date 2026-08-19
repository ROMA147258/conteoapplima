class IMesaRepository {
  async getAllMesas() {
    throw new Error('Method getAllMesas() must be implemented.');
  }

  async getSchoolCoordinates(searchData) {
    throw new Error('Method getSchoolCoordinates() must be implemented.');
  }
}

module.exports = IMesaRepository;
