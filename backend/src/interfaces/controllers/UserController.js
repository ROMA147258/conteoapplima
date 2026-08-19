const getUsersUseCase = require('../../application/use-cases/users/GetUsersUseCase');

class UserController {
  async getUsers(req, res) {
    try {
      const result = await getUsersUseCase.execute();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new UserController();
