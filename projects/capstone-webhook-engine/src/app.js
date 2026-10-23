import express from 'express';
import { fileURLToPath } from 'node:url';
import { webhookRouter } from './routes/webhook.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

export const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime() });
});

// Mount webhook engine routes
app.use('/api/v1/webhooks', webhookRouter);

// Centralized RFC 7807 error handler
app.use(errorHandler);

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Webhook Engine active on port ${PORT}`);
  });
}
