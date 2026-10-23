import express from 'express';
import { orderRouter } from './routes/order.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

import { fileURLToPath } from 'node:url';

export const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/v1/orders', orderRouter);
app.use(errorHandler);

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}
