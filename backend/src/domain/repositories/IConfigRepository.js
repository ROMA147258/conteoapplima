class IConfigRepository {
  getConfig() {
    throw new Error('Method getConfig() must be implemented.');
  }

  saveConfig(data) {
    throw new Error('Method saveConfig() must be implemented.');
  }
}

module.exports = IConfigRepository;
