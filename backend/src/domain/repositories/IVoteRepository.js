class IVoteRepository {
  async saveVotes(voteData) {
    throw new Error('Method saveVotes() must be implemented.');
  }
}

module.exports = IVoteRepository;
