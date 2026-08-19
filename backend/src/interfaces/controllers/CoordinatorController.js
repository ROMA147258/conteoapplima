const confirmCoordinatorUseCase = require('../../application/use-cases/coordinator/ConfirmCoordinatorUseCase');
const getPersonerosUseCase = require('../../application/use-cases/coordinator/GetPersonerosUseCase');
const getConfirmationsUseCase = require('../../application/use-cases/coordinator/GetConfirmationsUseCase');
const sqlCoordinatorRepo = require('../../infrastructure/repositories/SqlCoordinatorRepository');

class CoordinatorController {
  async confirmCoordinator(req, res) {
    try {
      const payload = { ...(req.query || {}), ...(req.body || {}) };
      const result = await confirmCoordinatorUseCase.execute(payload);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getPersonerosBySchool(req, res) {
    try {
      const payload = { ...(req.query || {}), ...(req.body || {}) };
      const result = await getPersonerosUseCase.execute(payload);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getConfirmationsBySchool(req, res) {
    try {
      const payload = { ...(req.query || {}), ...(req.body || {}) };
      const colegio = payload.colegio || payload.local || '';
      const result = await getConfirmationsUseCase.execute(colegio);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAllCoordinators(req, res) {
    try {
      const list = await sqlCoordinatorRepo.getAllCoordinators();
      return res.status(200).json({ success: true, coordinadores: list });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new CoordinatorController();
