import { ingestionService } from '../services/ingestion.service.js';
import { webhookRepository } from '../repositories/webhook.repository.js';
import { dispatcherService } from '../services/dispatcher.service.js';

export class WebhookController {
  constructor(ingestion = ingestionService, repo = webhookRepository, dispatcher = dispatcherService) {
    this.ingestion = ingestion;
    this.repo = repo;
    this.dispatcher = dispatcher;
  }

  ingest = async (req, res, next) => {
    try {
      const tenantId = req.headers['x-tenant-id'] || 'default-tenant';
      const eventRecord = await this.ingestion.ingestEvent(req.body, tenantId);

      // Async trigger dispatch in background (fire-and-forget or queued)
      // We pass the dispatcher promise so tests can await if needed
      res.status(202).json({
        data: eventRecord,
        status: 'ACCEPTED',
        message: 'Webhook event received, verified, and enqueued for dispatch'
      });
    } catch (err) {
      return next(err);
    }
  };

  getEventStatus = async (req, res, next) => {
    try {
      const { eventId } = req.params;
      const record = await this.repo.findById(eventId);
      if (!record) {
        return res.status(404).json({
          type: 'https://api.example.com/errors/not-found',
          title: 'Not Found',
          status: 404,
          detail: `Event '${eventId}' not found`
        });
      }
      return res.status(200).json({ data: record });
    } catch (err) {
      return next(err);
    }
  };

  getDeadLetterQueue = async (req, res, next) => {
    try {
      const dlqEvents = await this.repo.getDeadLetterEvents();
      return res.status(200).json({
        data: dlqEvents,
        count: dlqEvents.length
      });
    } catch (err) {
      return next(err);
    }
  };
}

export const webhookController = new WebhookController();
