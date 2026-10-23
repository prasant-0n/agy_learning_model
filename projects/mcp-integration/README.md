# Model Context Protocol (MCP) Integration Guide

## 1. What is MCP?
The **Model Context Protocol (MCP)** is an open standard that connects Antigravity to live development databases, telemetry endpoints, and custom tool runners without hardcoding secrets or cluttering conversation context.

## 2. Registering MCP in Antigravity

In Antigravity, MCP servers are declared in `~/.gemini/config/mcp_config.json` (global) or within workspace plugins:

```json
{
  "mcpServers": {
    "mongodb-inspector": {
      "command": "node",
      "args": ["/absolute/path/to/projects/mcp-integration/mock-db-mcp-server.mjs"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

## 3. How the Agent Uses Discovered Tools
Once declared:
1. Antigravity spawns the server process over stdio.
2. Runs the JSON-RPC `initialize` and `tools/list` handshake.
3. Automatically adds the discovered tools (`db_list_collections`, `db_describe_schema`, `db_execute_query`) into the agent's available tool palette.
4. When you ask: *"What indexes exist on the orders collection?"*, the agent calls `db_describe_schema(collection: "orders")` directly.

## 4. Verification
Run the automated MCP JSON-RPC protocol test:
```bash
node projects/mcp-integration/test-mcp-client.mjs
```
