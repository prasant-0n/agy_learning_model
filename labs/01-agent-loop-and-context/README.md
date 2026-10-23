# Lab 1.1: Inspecting the Antigravity Agent Execution Loop & Context Footprint

## Objective
Gain direct visibility into how Antigravity processes your prompts, generates chain-of-thought thinking, emits tool calls, and records execution logs.

## Background: What happens under the hood?
Every interaction with Antigravity is recorded as a sequence of discrete steps in a JSON Lines (`.jsonl`) transcript.

Each step in `transcript.jsonl` contains:
- `step_index`: Sequential integer tracking the trajectory.
- `source`: Who initiated the step (`USER_EXPLICIT`, `MODEL`, `SYSTEM`).
- `type`: Step type (`USER_INPUT`, `PLANNER_RESPONSE`).
- `thinking`: The model's raw reasoning and internal planning.
- `tool_calls`: The structured calls emitted to bash, filesystem, or search.
- `content`: Text response or tool execution output.

## The Lab Tool: `inspect-session.mjs`
This Node.js script reads the live transcript of the current session and outputs an engineering summary:
- Step distribution across users and agents.
- Tools called, parameters passed, and execution time.
- Context data volume and truncation status.

## How to Run
```bash
node labs/01-agent-loop-and-context/inspect-session.mjs
```
