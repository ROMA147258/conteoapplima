const getReportUseCase = require('../../application/use-cases/reports/GetReportUseCase');

class ReportController {
  async getReport(req, res) {
    try {
      const result = await getReportUseCase.execute();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ReportController();
