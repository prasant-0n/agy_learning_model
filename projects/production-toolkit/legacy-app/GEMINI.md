# Project Rules & Production Standards

## 1. Engineering Philosophy
- **Verification First**: Never mark a task complete without running and validating automated tests.
- **Amplification, Not Automation**: AI agents assist, but technical architecture, security checks, and data schemas require strict human review.
- **Minimal Context Footprint**: Keep context lean. Use targeted line ranges and subagents.

## 2. Backend Coding Standards (Node.js / Express)
- Architecture: Layered separation (Routes -> Controllers -> Services -> Repositories).
- Validation: All incoming requests must be strictly validated using Zod.
- Error Handling: Use centralized RFC 7807 error middleware. Never swallow errors.
- Security: Sanitize inputs, enforce rate limiting, use Helmet, and NEVER commit secrets.

## 3. Database Standards (MongoDB / Mongoose)
- Strict schemas with indexes and timestamps.
- Use explicit database transactions (session.withTransaction) for multi-document ACID operations.
- Zero-downtime migrations (expand -> dual-write -> backfill -> contract).
