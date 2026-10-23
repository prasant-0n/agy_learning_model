import { webhookRepository } from '../repositories/webhook.repository.js';
import { config } from '../config.js';

export class DispatcherService {
  constructor(repo = webhookRepository) {
    this.repo = repo;
  }

  async dispatch(eventId, httpPoster = null) {
    const event = await this.repo.findById(eventId);
    if (!event) {
      throw new Error(`Event '${eventId}' not found for dispatch`);
    }

    const poster = httpPoster || this.defaultPoster;

    while (event.attempts < config.maxRetries) {
      try {
        const response = await poster(event.destinationUrl, {
          eventId: event.eventId,
          eventType: event.eventType,
          payload: event.payload
        });

        if (response.status >= 200 && response.status < 300) {
          await this.repo.updateStatus(eventId, 'DELIVERED', {
            statusCode: response.status,
            success: true
          });
          return { success: true, status: 'DELIVERED', attempts: event.attempts };
        }

        // Destination returned non-2xx
        await this.handleFailure(event, `Destination returned HTTP ${response.status}`, response.status);
      } catch (err) {
        // Network timeout / connection refused
        await this.handleFailure(event, `Network error: ${err.message}`, 0);
      }

      if (event.status === 'DEAD_LETTER') {
        break;
      }

      // Exponential backoff
      const delay = config.initialBackoffMs * Math.pow(2, event.attempts - 1);
      await new Promise(r => setTimeout(r, delay));
    }

    return { success: false, status: event.status, attempts: event.attempts };
  }

  async handleFailure(event, errorDetail, statusCode) {
    const isFinalAttempt = (event.attempts + 1) >= config.maxRetries;
    const nextStatus = isFinalAttempt ? 'DEAD_LETTER' : 'RETRYING';

    await this.repo.updateStatus(event.eventId, nextStatus, {
      statusCode,
      success: false,
      error: errorDetail
    });
  }

  async defaultPoster(url, body) {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
}

export const dispatcherService = new DispatcherService();
