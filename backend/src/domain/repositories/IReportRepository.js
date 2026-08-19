class IReportRepository {
  async getReportData() {
    throw new Error('Method getReportData() must be implemented.');
  }
}

module.exports = IReportRepository;
