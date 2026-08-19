const sqlReportRepo = require('../../../infrastructure/repositories/SqlReportRepository');

class GetReportUseCase {
  constructor(reportRepo = sqlReportRepo) {
    this.reportRepo = reportRepo;
  }

  async execute() {
    const data = await this.reportRepo.getReportData();
    return {
      success: true,
      ...data
    };
  }
}

module.exports = new GetReportUseCase();
