export class WebhookRepository {
  constructor() {
    this.events = new Map();
    this.deadLetterQueue = new Map();
  }

  async saveEvent(event) {
    const record = {
      ...event,
      status: 'PENDING',
      attempts: 0,
      deliveryLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.events.set(record.eventId, record);
    return record;
  }

  async findById(eventId) {
    return this.events.get(eventId) || null;
  }

  async updateStatus(eventId, status, logEntry = null) {
    const record = this.events.get(eventId);
    if (!record) return null;

    record.status = status;
    record.updatedAt = new Date().toISOString();
    if (logEntry) {
      record.attempts++;
      record.deliveryLogs.push({
        attempt: record.attempts,
        timestamp: new Date().toISOString(),
        ...logEntry
      });
    }

    if (status === 'DEAD_LETTER') {
      this.deadLetterQueue.set(eventId, { ...record });
    }

    return record;
  }

  async getDeadLetterEvents() {
    return Array.from(this.deadLetterQueue.values());
  }

  async clear() {
    this.events.clear();
    this.deadLetterQueue.clear();
  }
}

export const webhookRepository = new WebhookRepository();
