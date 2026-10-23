---
name: node-service-generator
description: >-
  Use this skill when scaffolding or generating a new Node.js/Express service, route, or business module.
  Enforces Clean Architecture layers: Route -> Controller -> Service -> Repository/Model with Zod validation.
---

# Node.js Service Generator Runbook

This skill outlines the strict architectural steps for creating production-ready Express services within this workspace.

## Layer Separation Protocol

Every new domain feature must be divided into four distinct layers:

1. **Schema & Types (`<feature>.schema.ts` / `.js`)**:
   - Define input validation using **Zod** (`body`, `params`, `query`).
   - Export inferred TypeScript types or JSDoc types.

2. **Controller (`<feature>.controller.ts` / `.js`)**:
   - HTTP transport only.
   - Extracts validated payload from `req`.
   - Calls the Service layer.
   - Maps Service results or domain errors to standard HTTP response payloads.
   - Never contains database queries or raw business rules.

3. **Service (`<feature>.service.ts` / `.js`)**:
   - Pure domain business logic.
   - Framework-agnostic (no `req`, `res`, `next` objects).
   - Coordinates repository calls and cross-entity validation.
   - Throws domain errors (e.g. `NotFoundError`, `ConflictError`).

4. **Repository (`<feature>.repository.ts` / `.js`)**:
   - Direct database access (Mongoose / MongoDB client).
   - Encapsulates queries, projections, indexes, and session transaction logic.

## Verification Checklist
- [ ] Zod schema validates all incoming boundary inputs.
- [ ] No `res.status()` calls exist inside Service or Repository layers.
- [ ] Multi-document writes use `session.withTransaction()` for ACID guarantees.
- [ ] Centralized error handler catches domain errors and transforms them into standard RFC 7807 problem details.
