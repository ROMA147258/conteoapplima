const sqlVoteRepo = require('../../../infrastructure/repositories/SqlVoteRepository');

class RegisterVotesUseCase {
  constructor(voteRepo = sqlVoteRepo) {
    this.voteRepo = voteRepo;
  }

  async execute(payload) {
    return await this.voteRepo.saveVotes(payload);
  }
}

module.exports = new RegisterVotesUseCase();
