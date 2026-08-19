const sqlAttendanceRepo = require('../../../infrastructure/repositories/SqlAttendanceRepository');

class RegisterAttendanceUseCase {
  constructor(attendanceRepo = sqlAttendanceRepo) {
    this.attendanceRepo = attendanceRepo;
  }

  async execute(payload) {
    return await this.attendanceRepo.saveAttendance(payload);
  }
}

module.exports = new RegisterAttendanceUseCase();
