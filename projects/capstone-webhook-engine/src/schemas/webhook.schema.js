import { z } from 'zod';

export const webhookPayloadSchema = z.object({
  eventId: z.string().min(5, 'Event ID must be at least 5 characters'),
  eventType: z.string().regex(/^[a-z]+(\.[a-z_]+)+$/, 'Event type must be dot-notated (e.g., payment.succeeded)'),
  payload: z.record(z.any()),
  destinationUrl: z.string().url('Destination must be a valid HTTP/HTTPS URL')
}).strict();

export function validateWebhookPayload(req, res, next) {
  const result = webhookPayloadSchema.safeParse(req.body);
  if (!result.success) {
    const error = new Error('Invalid webhook payload schema');
    error.statusCode = 422;
    error.type = 'https://api.example.com/errors/invalid-payload';
    error.errors = result.error.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message
    }));
    return next(error);
  }
  req.body = result.data;
  next();
}
