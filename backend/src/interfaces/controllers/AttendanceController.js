const registerAttendanceUseCase = require('../../application/use-cases/attendance/RegisterAttendanceUseCase');
const confirmArrivalUseCase = require('../../application/use-cases/attendance/ConfirmArrivalUseCase');
const sqlAttendanceRepo = require('../../infrastructure/repositories/SqlAttendanceRepository');

class AttendanceController {
  async registerAttendance(req, res) {
    try {
      const payload = { ...(req.query || {}), ...(req.body || {}) };
      const result = await registerAttendanceUseCase.execute(payload);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async confirmArrival(req, res) {
    try {
      const payload = { ...(req.query || {}), ...(req.body || {}) };
      const result = await confirmArrivalUseCase.execute(payload);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAllAttendance(req, res) {
    try {
      const list = await sqlAttendanceRepo.getAllAttendance();
      return res.status(200).json({ success: true, asistencia: list });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAttendanceByDni(req, res) {
    try {
      const payload = { ...(req.query || {}), ...(req.body || {}) };
      const dni = payload.dni;
      const att = await sqlAttendanceRepo.getAttendanceByDni(dni);
      return res.status(200).json({ success: true, asistencia: att });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AttendanceController();
