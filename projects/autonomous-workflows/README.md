# Autonomous Background Workflows & Scheduling

## 1. The `/goal` Workflow for Deep Refactoring

When you have a large task that requires multiple hours of autonomous iteration (e.g. converting 30 Express controllers to TypeScript, or refactoring an entire database layer):
- Type `/goal` in the chat followed by your acceptance criteria.
- **Why it is different**: In `/goal` mode, the agent does not stop after single-turn completions. It continually refactors, runs test suites, inspects failures, and iterates until the acceptance criteria (e.g. all unit tests green) are 100% satisfied.

## 2. Recurring Background Jobs (`schedule`)

Antigravity features a native background scheduler that executes independent tasks on a cron schedule or timer without keeping an interactive prompt open.

### Scheduling an Autonomous Nightly Audit
You can schedule recurring jobs using cron expressions:
- **Cron Expression**: `0 2 * * *` (Runs every morning at 2:00 AM)
- **Prompt**: `"Run projects/autonomous-workflows/nightly-audit.mjs, verify test suite health, and notify me if vulnerabilities or regressions are detected."`

### Verification
Run the autonomous audit locally:
```bash
node projects/autonomous-workflows/nightly-audit.mjs
```
Inspect the output report in [last-audit-report.json](file:///home/prasanta/Documents/agy_learning_model/projects/autonomous-workflows/last-audit-report.json).
