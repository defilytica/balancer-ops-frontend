class RateLimiter {
  windowStart: number;
  windowSize: number;
  maxRequests: number;
  idToRequestCount: Map<string, number>;

  constructor(config: { windowSize: number; maxRequests: number }) {
    this.windowStart = Date.now();
    this.windowSize = config.windowSize;
    this.maxRequests = config.maxRequests;
    this.idToRequestCount = new Map<string, number>();
  }

  limit(id: string) {
    const now = Date.now();

    // Check and update current window
    const isNewWindow = now - this.windowStart > this.windowSize;
    if (isNewWindow) {
      this.windowStart = now;
      this.idToRequestCount.set(id, 0);
    }

    // Check and update current request limits
    const currentRequestCount = this.idToRequestCount.get(id) ?? 0;

    if (currentRequestCount >= this.maxRequests) return true;

    this.idToRequestCount.set(id, currentRequestCount + 1);

    return false;
  }
}

export { RateLimiter };
