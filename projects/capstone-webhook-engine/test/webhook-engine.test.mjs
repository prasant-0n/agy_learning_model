import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app } from '../src/app.js';
import { CryptoService } from '../src/services/crypto.service.js';
import { config } from '../src/config.js';
import { idempotencyRepository } from '../src/repositories/idempotency.repository.js';
import { webhookRepository } from '../src/repositories/webhook.repository.js';
import { dispatcherService } from '../src/services/dispatcher.service.js';

let server;
let baseUrl;

before(async () => {
  await new Promise(resolve => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

beforeEach(async () => {
  await idempotencyRepository.clear();
  await webhookRepository.clear();
});

describe('Capstone: Enterprise Webhook Ingestion & Dispatch Engine', () => {
  // Helper to construct signed request headers
  function createSignedHeaders(body, timestampSeconds = null, secret = config.webhookSecret) {
    const timestamp = timestampSeconds !== null ? timestampSeconds : Math.floor(Date.now() / 1000);
    const signature = CryptoService.computeSignature(secret, timestamp, body);
    return {
      'Content-Type': 'application/json',
      'X-Signature-SHA256': signature,
      'X-Webhook-Timestamp': String(timestamp),
      'X-Tenant-Id': 'tenant_acme_corp'
    };
  }

  const validPayload = {
    eventId: 'evt_order_created_98765',
    eventType: 'order.created',
    payload: { orderId: 'ord_123', totalAmount: 499.00 },
    destinationUrl: 'https://webhook.site/test-receiver'
  };

  describe('1. Cryptographic Signature & Anti-Replay Gate', () => {
    it('1.1 Rejects request when signature headers are missing with 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/webhooks/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload)
      });

      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.title, 'Unauthorized');
    });

    it('1.2 Rejects tampered/forged HMAC signature with 401', async () => {
      const headers = createSignedHeaders(validPayload, null, 'wrong-attacker-secret');

      const res = await fetch(`${baseUrl}/api/v1/webhooks/ingest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(validPayload)
      });

      assert.strictEqual(res.status, 401);
      const json = await res.json();
      assert.strictEqual(json.detail, 'Cryptographic signature verification failed');
    });

    it('1.3 Rejects replay attack with expired timestamp (> 300s) with 400', async () => {
      const staleTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
      const headers = createSignedHeaders(validPayload, staleTimestamp);

      const res = await fetch(`${baseUrl}/api/v1/webhooks/ingest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(validPayload)
      });

      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.ok(json.detail.includes('Timestamp tolerance exceeded'));
    });
  });

  describe('2. Zod Boundary Schema Validation', () => {
    it('2.1 Rejects invalid dot-notation in eventType with 422', async () => {
      const invalidPayload = { ...validPayload, eventType: 'invalid_no_dot' };
      const headers = createSignedHeaders(invalidPayload);

      const res = await fetch(`${baseUrl}/api/v1/webhooks/ingest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(invalidPayload)
      });

      assert.strictEqual(res.status, 422);
      const json = await res.json();
      assert.ok(json.invalidParams.some(p => p.field === 'eventType'));
    });

    it('2.2 Rejects malformed destinationUrl with 422', async () => {
      const invalidPayload = { ...validPayload, destinationUrl: 'not-a-valid-url' };
      const headers = createSignedHeaders(invalidPayload);

      const res = await fetch(`${baseUrl}/api/v1/webhooks/ingest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(invalidPayload)
      });

      assert.strictEqual(res.status, 422);
      const json = await res.json();
      assert.ok(json.invalidParams.some(p => p.field === 'destinationUrl'));
    });
  });

  describe('3. Idempotency & Ingestion Flow', () => {
    it('3.1 Successfully ingests valid webhook and returns 202 Accepted', async () => {
      const headers = createSignedHeaders(validPayload);

      const res = await fetch(`${baseUrl}/api/v1/webhooks/ingest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(validPayload)
      });

      assert.strictEqual(res.status, 202);
      const json = await res.json();
      assert.strictEqual(json.status, 'ACCEPTED');
      assert.strictEqual(json.data.eventId, validPayload.eventId);
      assert.strictEqual(json.data.status, 'PENDING');
    });

    it('3.2 Rejects duplicate eventId with 409 Conflict', async () => {
      const headers = createSignedHeaders(validPayload);

      // First call succeeds
      const firstRes = await fetch(`${baseUrl}/api/v1/webhooks/ingest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(validPayload)
      });
      assert.strictEqual(firstRes.status, 202);

      // Duplicate delivery attempt is rejected
      const dupRes = await fetch(`${baseUrl}/api/v1/webhooks/ingest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(validPayload)
      });
      assert.strictEqual(dupRes.status, 409);
      const json = await dupRes.json();
      assert.ok(json.detail.includes('already been received'));
    });
  });

  describe('4. Resilient Exponential Backoff Dispatcher & DLQ', () => {
    it('4.1 Successfully dispatches event on first attempt', async () => {
      await webhookRepository.saveEvent(validPayload);

      // Mock destination returning 200 OK
      const mockPoster = async () => ({ status: 200 });

      const result = await dispatcherService.dispatch(validPayload.eventId, mockPoster);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.status, 'DELIVERED');
      assert.strictEqual(result.attempts, 1);

      // Verify repository status
      const saved = await webhookRepository.findById(validPayload.eventId);
      assert.strictEqual(saved.status, 'DELIVERED');
      assert.strictEqual(saved.deliveryLogs.length, 1);
    });

    it('4.2 Retries with exponential backoff on transient failure and recovers', async () => {
      const transientEvent = { ...validPayload, eventId: 'evt_transient_retry_1' };
      await webhookRepository.saveEvent(transientEvent);

      let callCount = 0;
      // Fails on attempt 1 & 2, succeeds on attempt 3
      const mockFlakyPoster = async () => {
        callCount++;
        if (callCount < 3) {
          return { status: 503 }; // Service Unavailable
        }
        return { status: 200 };
      };

      const result = await dispatcherService.dispatch(transientEvent.eventId, mockFlakyPoster);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.status, 'DELIVERED');
      assert.strictEqual(result.attempts, 3);
      assert.strictEqual(callCount, 3);

      const saved = await webhookRepository.findById(transientEvent.eventId);
      assert.strictEqual(saved.deliveryLogs.length, 3);
      assert.strictEqual(saved.deliveryLogs[0].statusCode, 503);
      assert.strictEqual(saved.deliveryLogs[2].statusCode, 200);
    });

    it('4.3 Moves to Dead-Letter Queue (DLQ) after exceeding max retries', async () => {
      const doomedEvent = { ...validPayload, eventId: 'evt_doomed_dlq_999' };
      await webhookRepository.saveEvent(doomedEvent);

      // Always returns HTTP 500
      const mockFailingPoster = async () => ({ status: 500 });

      const result = await dispatcherService.dispatch(doomedEvent.eventId, mockFailingPoster);
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.status, 'DEAD_LETTER');
      assert.strictEqual(result.attempts, 3);

      // Check DLQ endpoint
      const dlqRes = await fetch(`${baseUrl}/api/v1/webhooks/dead-letter`);
      assert.strictEqual(dlqRes.status, 200);
      const dlqBody = await dlqRes.json();
      assert.ok(dlqBody.data.some(e => e.eventId === 'evt_doomed_dlq_999'));
    });
  });
});
