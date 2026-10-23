import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller.js';
import { verifyWebhookSignature } from '../middleware/signature.middleware.js';
import { validateWebhookPayload } from '../schemas/webhook.schema.js';

export const webhookRouter = Router();

// Ingestion Pipeline: Signature -> Schema Validation -> Controller
webhookRouter.post('/ingest', verifyWebhookSignature, validateWebhookPayload, webhookController.ingest);

// Inspection & DLQ monitoring
webhookRouter.get('/events/:eventId', webhookController.getEventStatus);
webhookRouter.get('/dead-letter', webhookController.getDeadLetterQueue);
