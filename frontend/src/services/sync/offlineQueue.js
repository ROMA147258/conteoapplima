const OFFLINE_KEY = 'votoReal_offlineVotes';

export const offlineQueue = {
  getQueue() {
    try {
      const raw = localStorage.getItem(OFFLINE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  enqueue(item) {
    const queue = this.getQueue();
    queue.push(item);
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
    return queue;
  },

  setQueue(queue) {
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
  },

  clear() {
    localStorage.removeItem(OFFLINE_KEY);
  },

  count() {
    return this.getQueue().length;
  }
};
