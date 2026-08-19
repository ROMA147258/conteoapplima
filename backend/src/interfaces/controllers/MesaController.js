const getMesasUseCase = require('../../application/use-cases/mesas/GetMesasUseCase');
const getSchoolCoordinatesUseCase = require('../../application/use-cases/mesas/GetSchoolCoordinatesUseCase');

class MesaController {
  async getMesas(req, res) {
    try {
      const result = await getMesasUseCase.execute();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getSchoolCoordinates(req, res) {
    try {
      const payload = req.body || req.query || {};
      const result = await getSchoolCoordinatesUseCase.execute(payload);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new MesaController();
