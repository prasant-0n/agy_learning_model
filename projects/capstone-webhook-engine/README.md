# Capstone Project: Enterprise Webhook Ingestion & Resilient Dispatch Engine

## Overview
A production-grade, multi-tenant webhook ingestion and dispatch engine built to demonstrate complete mastery of Google Antigravity and Clean Architecture in Node.js.

## Key Capabilities

1. **Cryptographic Anti-Replay Gate**:
   - [`src/services/crypto.service.js`](file:///home/prasanta/Documents/agy_learning_model/projects/capstone-webhook-engine/src/services/crypto.service.js): HMAC-SHA256 signature verification with `crypto.timingSafeEqual` protecting against timing attacks.
   - [`src/middleware/signature.middleware.js`](file:///home/prasanta/Documents/agy_learning_model/projects/capstone-webhook-engine/src/middleware/signature.middleware.js): Timestamp tolerance check (< 300s) preventing replay attacks.

2. **Boundary Validation & RFC 7807 Error Handling**:
   - [`src/schemas/webhook.schema.js`](file:///home/prasanta/Documents/agy_learning_model/projects/capstone-webhook-engine/src/schemas/webhook.schema.js): Zod schemas strictly enforcing event types and payload structures.

3. **Concurrency & Idempotency Lock**:
   - [`src/repositories/idempotency.repository.js`](file:///home/prasanta/Documents/agy_learning_model/projects/capstone-webhook-engine/src/repositories/idempotency.repository.js): Atomic check-and-set preventing duplicate webhook processing.

4. **Exponential Backoff Dispatcher & Dead-Letter Queue (DLQ)**:
   - [`src/services/dispatcher.service.js`](file:///home/prasanta/Documents/agy_learning_model/projects/capstone-webhook-engine/src/services/dispatcher.service.js): Retries transient HTTP errors with exponential backoff.
   - Transitions permanently failing deliveries to a Dead-Letter Queue for alerting and manual intervention.

## Automated Verification Suite
Run the capstone suite directly:
```bash
node --test projects/capstone-webhook-engine/test/webhook-engine.test.mjs
```
Or run all workspace test suites:
```bash
npm test
```
