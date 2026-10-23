# Lab 6.1: Multi-Agent Parallelism via Contract-First Decomposition

## Objective
Demonstrate how full-stack features can be divided cleanly between backend and frontend subagents using an explicit **Contract-First** architecture.

## Structure

```
labs/06-multi-agent-parallelism/
├── contracts/
│   └── notification.contract.js   # Single source of truth (Zod schemas)
├── backend/
│   └── notification.service.js    # Backend implementation
├── frontend/
│   └── notification-client.js     # Frontend consumer adapter
└── test/
    └── notification-integration.test.mjs # Cross-layer integration verification
```

## Why This Prevents Integration Failure
- Neither the backend nor the frontend agent is allowed to invent custom JSON keys.
- Both layers validate against [notification.contract.js](file:///home/prasanta/Documents/agy_learning_model/labs/06-multi-agent-parallelism/contracts/notification.contract.js).
- Even when developed in separate workspaces (`Workspace: 'branch'`), merging them produces zero contract mismatch.

## Verification
```bash
node --test labs/06-multi-agent-parallelism/test/notification-integration.test.mjs
```
