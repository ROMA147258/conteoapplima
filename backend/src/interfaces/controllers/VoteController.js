const registerVotesUseCase = require('../../application/use-cases/votes/RegisterVotesUseCase');

class VoteController {
  async registerVotes(req, res) {
    try {
      const payload = { ...(req.query || {}), ...(req.body || {}) };
      const result = await registerVotesUseCase.execute(payload);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new VoteController();
