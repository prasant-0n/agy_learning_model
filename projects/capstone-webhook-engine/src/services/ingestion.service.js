import { idempotencyRepository } from '../repositories/idempotency.repository.js';
import { webhookRepository } from '../repositories/webhook.repository.js';

export class IngestionConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'IngestionConflictError';
    this.statusCode = 409;
    this.type = 'https://api.example.com/errors/duplicate-event';
  }
}

export class IngestionService {
  constructor(idempotencyRepo = idempotencyRepository, webhookRepo = webhookRepository) {
    this.idempotencyRepo = idempotencyRepo;
    this.webhookRepo = webhookRepo;
  }

  async ingestEvent(data, tenantId = 'default') {
    // 1. Idempotency Lock Enforcement
    const acquired = await this.idempotencyRepo.acquireLock(data.eventId);
    if (!acquired) {
      throw new IngestionConflictError(`Event with ID '${data.eventId}' has already been received and processed`);
    }

    // 2. Persist to Event Store
    const eventRecord = await this.webhookRepo.saveEvent({
      ...data,
      tenantId
    });

    return eventRecord;
  }
}

export const ingestionService = new IngestionService();
