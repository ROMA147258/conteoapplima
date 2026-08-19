class ICoordinatorRepository {
  async saveCoordinatorVerification(verificationData) {
    throw new Error('Method saveCoordinatorVerification() must be implemented.');
  }

  async getAllCoordinators() {
    throw new Error('Method getAllCoordinators() must be implemented.');
  }

  async getConfirmationsBySchool(colegio) {
    throw new Error('Method getConfirmationsBySchool() must be implemented.');
  }

  async getPersonerosBySchool(filterData) {
    throw new Error('Method getPersonerosBySchool() must be implemented.');
  }
}

module.exports = ICoordinatorRepository;
