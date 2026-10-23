---
name: db-migration-runbook
description: >-
  Use this skill when modifying database models, adding columns/fields, or performing MongoDB schema migrations.
  Enforces zero-downtime expand-contract protocol.
---

# Zero-Downtime Database Migration Runbook

Whenever migrating database models or schema structures, follow the 4-phase Expand-Contract pattern:

## Phase 1: Expand
- Add new fields to the Mongoose/Mongo schema as optional.
- Service reads from new field if present, otherwise falls back to old field.
- Deploy Phase 1.

## Phase 2: Dual-Write
- Application writes updates to BOTH the old field and the new field simultaneously.
- Deploy Phase 2.

## Phase 3: Backfill Batch Job
- Run a throttled background script to populate the new field for legacy documents.
- Process in batches (e.g. 500 documents per batch) with delay to avoid replica set saturation.

## Phase 4: Contract
- Update service to read exclusively from the new field.
- Remove old field from schema writes.
- Drop or archive the deprecated field.
- Deploy Phase 4.
