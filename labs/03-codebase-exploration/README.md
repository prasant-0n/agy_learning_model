# Lab 3.1: Architectural Reverse-Engineering with the Research Subagent

## Objective
Demonstrate how to analyze an unfamiliar codebase in minutes using:
1. Fast surface reconnaissance.
2. The `research` subagent to isolate deep reading from the parent conversation.
3. Generating architectural flow diagrams without polluting your primary context window.

## The Target Codebase
The target codebase is located in:
[`sample-monolith/`](file:///home/prasanta/Documents/agy_learning_model/labs/03-codebase-exploration/sample-monolith/)

Key files:
- [package.json](file:///home/prasanta/Documents/agy_learning_model/labs/03-codebase-exploration/sample-monolith/package.json)
- [app.js](file:///home/prasanta/Documents/agy_learning_model/labs/03-codebase-exploration/sample-monolith/src/app.js)
- [order.routes.js](file:///home/prasanta/Documents/agy_learning_model/labs/03-codebase-exploration/sample-monolith/src/routes/order.routes.js)
- [order.controller.js](file:///home/prasanta/Documents/agy_learning_model/labs/03-codebase-exploration/sample-monolith/src/controllers/order.controller.js)
- [order.service.js](file:///home/prasanta/Documents/agy_learning_model/labs/03-codebase-exploration/sample-monolith/src/services/order.service.js)
- [order.repository.js](file:///home/prasanta/Documents/agy_learning_model/labs/03-codebase-exploration/sample-monolith/src/repositories/order.repository.js)

## Subagent Delegation
We will dispatch a `research` subagent to audit:
- The exact request execution lifecycle for `POST /api/v1/orders`.
- The multi-tenant security boundary (`organizationId` isolation).
- Architectural strengths and potential missing boundaries (e.g. Zod boundary schema validation).
