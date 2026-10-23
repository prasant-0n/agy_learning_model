export class IdempotencyRepository {
  constructor() {
    this.locks = new Map();
  }

  // Atomic check-and-set
  async acquireLock(key, ttlSeconds = 3600) {
    const existing = this.locks.get(key);
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      return false; // Lock collision: already processed or currently processing
    }

    this.locks.set(key, {
      acquiredAt: now,
      expiresAt: now + (ttlSeconds * 1000)
    });
    return true;
  }

  async isProcessed(key) {
    const existing = this.locks.get(key);
    if (!existing) return false;
    return existing.expiresAt > Date.now();
  }

  async clear() {
    this.locks.clear();
  }
}

export const idempotencyRepository = new IdempotencyRepository();
