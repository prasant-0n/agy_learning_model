export const config = {
  webhookSecret: process.env.WEBHOOK_SECRET || 'super-secret-tenant-hmac-key-99',
  maxTimestampSkewSeconds: 300, // 5 minutes
  maxRetries: 3,
  initialBackoffMs: 20 // accelerated for testing
};
