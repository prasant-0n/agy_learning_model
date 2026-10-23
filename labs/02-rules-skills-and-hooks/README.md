# Lab 2.1: Implementing Custom Rules, Skills, and Deterministic Lifecycle Hooks

## Objective
Experience how Antigravity combines **probabilistic steering** (rules & skills) with **deterministic runtime enforcement** (lifecycle hooks).

## Key Components in this Lab

1. **Ambient Rule**: [GEMINI.md](file:///home/prasanta/Documents/agy_learning_model/GEMINI.md)
   - Automatically loaded into Antigravity context.
   - Enforces clean architecture (Routes -> Controllers -> Services -> Repositories) and Zod boundary validation.

2. **Custom Progressive Skill**: [.agents/skills/node-service-generator/SKILL.md](file:///home/prasanta/Documents/agy_learning_model/.agents/skills/node-service-generator/SKILL.md)
   - Only its description is loaded into memory by default.
   - When you prompt Antigravity to scaffold a new service, it pulls the complete step-by-step checklist on demand.

3. **Deterministic Safety Hook**: [.agents/hooks.json](file:///home/prasanta/Documents/agy_learning_model/.agents/hooks.json) & [.agents/scripts/pre-tool-safety.js](file:///home/prasanta/Documents/agy_learning_model/.agents/scripts/pre-tool-safety.js)
   - Executes at the OS level before any `run_command` tool is dispatched.
   - Intercepts destructive commands (`rm -rf`, `git reset --hard`) and blocks them deterministically.

## Verification
Run the verification test:
```bash
node labs/02-rules-skills-and-hooks/test-hook.mjs
```
