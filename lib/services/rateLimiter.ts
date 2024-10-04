class RateLimiter {
  windowSize: number;
  maxRequests: number;
  idToRequests: Map<string, { count: number; timestamp: number }>;

  constructor(config: { windowSize: number; maxRequests: number }) {
    this.windowSize = config.windowSize;
    this.maxRequests = config.maxRequests;
    this.idToRequests = new Map<string, { count: number; timestamp: number }>();
  }

  limit(id: string): boolean {
    const now = Date.now();
    const userRequests = this.idToRequests.get(id) || { count: 0, timestamp: now };

    if (now - userRequests.timestamp > this.windowSize) {
      // Reset if the window has passed
      userRequests.count = 1;
      userRequests.timestamp = now;
    } else {
      userRequests.count++;
    }

    this.idToRequests.set(id, userRequests);

    return userRequests.count > this.maxRequests;
  }
}

export { RateLimiter };