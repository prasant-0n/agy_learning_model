import { CryptoService } from '../services/crypto.service.js';
import { config } from '../config.js';

export function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-signature-sha256'];
  const timestampHeader = req.headers['x-webhook-timestamp'];

  if (!signature || !timestampHeader) {
    return res.status(401).json({
      type: 'https://api.example.com/errors/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail: 'Missing required signature or timestamp headers'
    });
  }

  const timestamp = parseInt(timestampHeader, 10);
  if (isNaN(timestamp)) {
    return res.status(400).json({
      type: 'https://api.example.com/errors/bad-request',
      title: 'Bad Request',
      status: 400,
      detail: 'Malformed timestamp header'
    });
  }

  // Anti-Replay: check skew (default 300s)
  const now = Math.floor(Date.now() / 1000);
  const skew = Math.abs(now - timestamp);
  if (skew > config.maxTimestampSkewSeconds) {
    return res.status(400).json({
      type: 'https://api.example.com/errors/replay-detected',
      title: 'Bad Request',
      status: 400,
      detail: `Timestamp tolerance exceeded (skew: ${skew}s, max: ${config.maxTimestampSkewSeconds}s)`
    });
  }

  // Cryptographic HMAC Verification
  const isValid = CryptoService.verifySignature(config.webhookSecret, timestamp, req.body, signature);
  if (!isValid) {
    return res.status(401).json({
      type: 'https://api.example.com/errors/invalid-signature',
      title: 'Unauthorized',
      status: 401,
      detail: 'Cryptographic signature verification failed'
    });
  }

  next();
}
