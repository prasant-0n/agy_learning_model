# Lab 4.1: Spec-Driven Feature Refactoring & Security Hardening

## Objective
Take the flawed legacy order service identified in Phase 3 and refactor it into an enterprise-grade, hardened service using **Spec-Driven Development**.

## Hardening Implemented

1. **Boundary Schema**: [`src/schemas/order.schema.js`](file:///home/prasanta/Documents/agy_learning_model/labs/04-spec-driven-refactoring/hardened-service/src/schemas/order.schema.js)
   - Strict Zod schema enforcing `min(1)` items, `quantity` limits, and disallowing unrecognized keys like forged `unitPrice`.
   - Reusable `validateBody(schema)` middleware producing RFC 7807 problem details.

2. **Authoritative Price & Inventory Catalog**: [`src/repositories/product.repository.js`](file:///home/prasanta/Documents/agy_learning_model/labs/04-spec-driven-refactoring/hardened-service/src/repositories/product.repository.js)
   - Order service looks up prices directly from the repository. Client-supplied prices are completely ignored.

3. **Domain Error Separation**: [`src/services/order.service.js`](file:///home/prasanta/Documents/agy_learning_model/labs/04-spec-driven-refactoring/hardened-service/src/services/order.service.js)
   - Business rules separated from HTTP transport.
   - Throws `DomainError` mapped to standard HTTP statuses by centralized error middleware.

## Verification
Run the automated test suite:
```bash
node --test labs/04-spec-driven-refactoring/hardened-service/test/order.test.mjs
```
