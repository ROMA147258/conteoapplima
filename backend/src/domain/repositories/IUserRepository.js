class IUserRepository {
  async findByDniOrName(dni, nombre) {
    throw new Error('Method findByDniOrName() must be implemented.');
  }

  async getAllUsers() {
    throw new Error('Method getAllUsers() must be implemented.');
  }
}

module.exports = IUserRepository;
