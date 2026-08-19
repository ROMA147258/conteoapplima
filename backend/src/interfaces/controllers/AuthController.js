const loginUseCase = require('../../application/use-cases/auth/LoginUseCase');

class AuthController {
  async login(req, res) {
    try {
      const payload = { ...(req.query || {}), ...(req.body || {}) };
      const result = await loginUseCase.execute(payload);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, status: 'error', message: err.message });
    }
  }
}

module.exports = new AuthController();
