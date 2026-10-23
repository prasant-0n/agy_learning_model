# Project Rules & Engineering Standards

Welcome to the **Antigravity Productivity Mastery** workspace. The following rules govern all development, refactoring, and AI-assisted workflows within this repository.

## 1. Engineering Philosophy
- **Verification First**: Never mark a task complete without running and validating automated tests or verification scripts.
- **Amplification, Not Automation**: AI agents assist and implement, but technical architecture, security checks, and data schemas require strict human review and engineering validation.
- **Minimal Context Footprint**: Keep conversations and context lean. Do not read entire directories when targeted line ranges or selective file reads suffice.

## 2. Backend Coding Standards (Node.js / Express)
- **Runtime & Language**: Node.js (LTS), modern ES Modules / TypeScript.
- **Architecture**: Layered separation of concerns (`routes` -> `controllers` -> `services` -> `repositories` / `models`).
- **Validation**: All incoming requests (params, body, query) must be strictly validated at the boundary using schema validators (e.g., Zod).
- **Error Handling**: Use centralized error handling middleware. Never leave unhandled promise rejections or empty `catch` blocks.
- **Security**:
  - Always sanitize inputs and use parameterized database queries to prevent injection attacks.
  - Implement rate limiting, CORS configuration, and security headers (Helmet).
  - Never commit hardcoded secrets, API keys, or credentials. Use `.env` with environment variable validation.

## 3. Database Standards (MongoDB / Mongoose)
- Define strict schemas with validation, indexes, and timestamps.
- Use explicit database transactions (`session.withTransaction`) for multi-document operations that require ACID guarantees.
- Always handle connection retry logic and graceful shutdown.

## 4. Testing Standards
- **Unit & Integration Tests**: Use modern test runners (Vitest / Jest) with Supertest for HTTP assertions.
- **TDD Workflow**: For bug fixes, write a failing regression test first to prove the bug, apply the fix, and verify the test passes.
