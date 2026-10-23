# Module 5: Test-Driven Development, Root-Cause Debugging & AI Code Auditing

## 1. The Cardinal Rule: Failing Regression Test First

When dealing with bugs or defect reports, junior engineers often ask the AI:
> *"Here is an error log, please fix my code."*

The AI will happily modify 50 lines of code, tell you it's "fixed", but introduce 3 new regressions because there was no automated harness proving the issue.

### The Antigravity TDD Bug-Fixing Protocol:
```
┌────────────────────────────────────────────────────────┐
│ Step 1: Write Failing Regression Test                  │ -> Proves the bug exists; sets the acceptance bar
├────────────────────────────────────────────────────────┤
│ Step 2: Execute Test (Observe RED)                     │ -> Verifies test triggers the exact failure mode
├────────────────────────────────────────────────────────┤
│ Step 3: Implement Minimal Surgical Fix                 │ -> Only touch the specific lines responsible
├────────────────────────────────────────────────────────┤
│ Step 4: Re-execute Test (Observe GREEN)                │ -> Proves resolution with zero guesswork
└────────────────────────────────────────────────────────┘
```

---

## 2. Anatomy of AI Code Smells in Node.js

LLMs are prone to specific, subtle antipatterns in asynchronous JavaScript:

| Code Smell | How AI Writes It | The Production Danger | Idiomatic Fix |
|---|---|---|---|
| **Async `forEach`** | `items.forEach(async item => { await update(item); })` | `forEach` ignores promises. Function returns before DB writes finish; unhandled rejections crash process. | Use `for (const item of items)` or `Promise.all(items.map(...))` |
| **Silent Catch Blocks** | `try { ... } catch (err) {}` | Hides root cause; leaves request hanging or returns 200 on failure. | Re-throw domain error or pass to centralized `next(err)`. |
| **Shallow Cache Mutation** | `const user = cache.get(id); user.role = 'admin';` | Mutates the cached object directly, affecting all future requests globally. | Deep clone or use immutable updates: `{ ...user, role: 'admin' }`. |
| **Zombie Handles** | Forgetting to close DB pools, HTTP agents, or test servers. | Test suites hang indefinitely or run out of file descriptors. | Register lifecycle teardowns in `after()` hooks. |

---

## 3. Adversarial Red-Team Code Reviews

Before committing code generated or modified by an agent, instruct the agent to run an **adversarial review**:

> *"Act as a principal security engineer and performance architect. Red-team this diff. What edge cases, memory leaks, concurrency races, or unhandled exceptions could cause a production incident?"*

This flips the model's objective function from agreeable completion to rigorous criticism.
