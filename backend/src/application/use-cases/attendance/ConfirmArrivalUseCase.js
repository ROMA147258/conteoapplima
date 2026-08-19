const sqlAttendanceRepo = require('../../../infrastructure/repositories/SqlAttendanceRepository');

class ConfirmArrivalUseCase {
  constructor(attendanceRepo = sqlAttendanceRepo) {
    this.attendanceRepo = attendanceRepo;
  }

  async execute(payload) {
    return await this.attendanceRepo.saveArrival(payload);
  }
}

module.exports = new ConfirmArrivalUseCase();
