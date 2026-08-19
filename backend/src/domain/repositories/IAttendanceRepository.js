class IAttendanceRepository {
  async saveAttendance(attendanceData) {
    throw new Error('Method saveAttendance() must be implemented.');
  }

  async saveArrival(arrivalData) {
    throw new Error('Method saveArrival() must be implemented.');
  }

  async getAllAttendance() {
    throw new Error('Method getAllAttendance() must be implemented.');
  }

  async getAttendanceByDni(dni) {
    throw new Error('Method getAttendanceByDni() must be implemented.');
  }
}

module.exports = IAttendanceRepository;
