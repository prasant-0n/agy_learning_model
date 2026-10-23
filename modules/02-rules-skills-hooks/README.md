# Module 2: Rules, Skills, Lifecycle Hooks & MCP Integration

## 1. The Customization Hierarchy

When working with Antigravity, you control the agent across three distinct enforcement layers:

```
┌────────────────────────────────────────────────────────┐
│ 1. Deterministic Hooks (hooks.json)                    │ -> Hard gates (block/allow scripts before tools run)
├────────────────────────────────────────────────────────┤
│ 2. Progressive Skills (.agents/skills/*/SKILL.md)       │ -> On-demand runbooks & procedural workflows
├────────────────────────────────────────────────────────┤
│ 3. Ambient Rules (GEMINI.md & .agents/rules/*.md)      │ -> Architectural guidelines & coding standards
└────────────────────────────────────────────────────────┘
```

| Customization Type | File / Location | Loading Strategy | Purpose |
|---|---|---|---|
| **Always-On Rules** | `GEMINI.md`, `AGENTS.md` | Inlined on every turn (20k token shared budget) | Core architectural invariants, naming conventions, safety boundaries. |
| **Triggered Rules** | `.agents/rules/*.md` with `model_decision` | Injected only when relevant to the prompt | Domain-specific standards (e.g., Stripe integration rules, migration rules). |
| **Skills** | `.agents/skills/<name>/SKILL.md` | Progressive disclosure (1-line description index -> full runbook on demand) | Multi-step repeatable procedures (test execution, benchmark runs, migrations). |
| **Lifecycle Hooks** | `.agents/hooks.json` | Deterministic OS-level shell interceptor | Gating tool execution (`PreToolUse`), validating results (`PostToolUse`), stopping conditions (`Stop`). |
| **MCP Servers** | `mcp_config.json` | Protocol-based tool server | Connecting agents to external databases (MongoDB, PostgreSQL), APIs, or internal tools. |

---

## 2. Token Budgeting: Progressive Disclosure

Why not put everything into `GEMINI.md`?
- **Context Budget**: Always-on rules share a **20,000-token budget**. If you exceed 24 KB per file or 20,000 tokens in total, Antigravity demotes your rules to file path pointers. The agent must then spend an extra turn reading them.
- **Attention Dilution**: Even within context limits, LLMs pay less attention to specific instructions when surrounded by thousands of irrelevant lines.

### The Solution:
- Put **critical, non-negotiable architectural boundaries** in `GEMINI.md`.
- Put **context-specific procedures** into **Skills**.
- Put **hard security gates** into **Hooks**.

---

## 3. Deterministic Protection: Lifecycle Hooks (`hooks.json`)

Prompt instructions are probabilistic: you tell the agent "never delete database collections", but under complex instructions it might still attempt a drop.

**Lifecycle Hooks are deterministic shell scripts** executed by the Antigravity runtime before or after any tool call.

### The `PreToolUse` Contract
1. Antigravity receives a tool request from the model.
2. Antigravity passes the request JSON to your hook script on `stdin`.
3. Your hook script inspects the tool call (e.g., checking `CommandLine` for `rm -rf`, `dropDatabase()`, or schema changes).
4. Your script outputs JSON to `stdout`:
   - `{"decision": "allow"}` -> Tool runs immediately.
   - `{"decision": "deny", "reason": "Blocked by policy"}` -> Hard abort with an error message to the model.
   - `{"decision": "ask", "reason": "Requires human approval"}` -> Prompts you in the UI.
