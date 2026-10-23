# Antigravity Engineer's Flight Manual

> **Core Law**: Antigravity amplifies your engineering judgment; it never replaces it. You remain the Lead Architect responsible for system design, security boundaries, database integrity, and production correctness.

---

## 1. The 4 Laws of Context Window Hygiene

Context Rot is the #1 cause of AI hallucinations, degraded reasoning, and slow turns. Protect your context window relentlessly:

1. **Law of Targeted Reads**: Never ask the agent to "read the whole folder". Use targeted line ranges (`read_file` with `StartLine` and `EndLine`).
2. **Law of Subagent Offloading**: When researching unfamiliar codebases or third-party libraries, dispatch the `research` subagent. Let it read 50 files in its isolated context and return a 10-line architectural summary.
3. **Law of Rule Parsimony**: Keep [GEMINI.md](file:///home/prasanta/Documents/agy_learning_model/GEMINI.md) lean (under 20,000 tokens). Put high-signal invariants in `GEMINI.md`; move multi-step procedures into progressive **Skills** (`.agents/skills/`).
4. **Law of Timely Compaction**: When a session reaches 30+ turns or complex troubleshooting finishes, run `/compact` to free up token capacity.

---

## 2. Slash Command Decision Tree

```
Are you starting a task?
├── Need to align on contracts & design trade-offs? ────► /plan
├── Want to stress-test architecture & edge cases? ──────► /grill-me
├── Long-running overnight autonomous refactor? ────────► /goal
├── Corrected the agent & want convention saved? ───────► /learn
└── Deep algorithmic or concurrency challenge? ─────────► /boost
```

---

## 3. The 3-Tier Enforcement Hierarchy

Never rely on prompts alone for security or database integrity:

```
┌────────────────────────────────────────────────────────┐
│ 1. Deterministic Hooks (.agents/hooks.json)             │ -> Hard OS barriers (block rm -rf, git force-push, .env)
├────────────────────────────────────────────────────────┤
│ 2. Progressive Skills (.agents/skills/*/SKILL.md)       │ -> On-demand runbooks (0 token bloat when idle)
├────────────────────────────────────────────────────────┤
│ 3. Ambient Rules (GEMINI.md)                            │ -> Always-on architectural guidelines & standards
└────────────────────────────────────────────────────────┘
```

---

## 4. Production Prompt Templates

### Template A: Spec-Driven Feature Scaffolding
```text
We are adding [Feature Name].
Follow our Clean Architecture standards (Routes -> Controllers -> Services -> Repositories).
1. First, define the boundary contract in src/schemas/[feature].schema.js using Zod with .strict().
2. Implement the Service with domain errors (no HTTP objects in service).
3. Do not touch production code until you create an automated integration test in test/[feature].test.mjs.
4. Run the test and verify all assertions pass.
```

### Template B: The Strict TDD Bug-Fix Protocol
```text
We have a bug: [Describe unexpected behavior or paste error].
DO NOT touch any implementation code yet.
1. Write a failing regression test in test/[feature].test.mjs that reproduces this exact issue.
2. Execute the test and prove it fails (RED).
3. Apply the minimal surgical fix in the service/repository layer.
4. Re-execute the test and prove it passes (GREEN).
```

### Template C: Adversarial Red-Team Code Review
```text
Act as a Principal Security Engineer and Performance Architect.
Red-team this git diff.
Identify:
1. Concurrency races, unhandled promise rejections, or memory leaks.
2. Missing authorization boundaries or tenant data leakage risks.
3. Cryptographic timing attacks or unvalidated boundary inputs.
```

---

## 5. Instant Guardrail Installation for Any Repository

To equip any new or existing Node.js repository with production guardrails in 5 seconds:

```bash
node /home/prasanta/Documents/agy_learning_model/projects/production-toolkit/init-antigravity.mjs /path/to/target-repo
```

This installs:
- Root [GEMINI.md](file:///home/prasanta/Documents/agy_learning_model/GEMINI.md) with backend & database standards.
- Pre-tool safety hook blocking `rm -rf`, `git push --force`, and credential leaks (`.env`).
- Zero-downtime database migration skill.

---

## 6. Verification Checklist Before Marking Any Task Complete

- [ ] All inputs validated at the boundary with Zod (`.strict()`).
- [ ] No database queries or `res.status()` calls inside the Service layer.
- [ ] Multi-document database writes wrapped in atomic transactions (`session.withTransaction`).
- [ ] No asynchronous operations inside `Array.prototype.forEach`.
- [ ] Full test suite executes cleanly via `npm test` with 0 failures and 0 hanging handles.
