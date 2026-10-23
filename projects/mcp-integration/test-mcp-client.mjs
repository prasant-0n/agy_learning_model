#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline';
import assert from 'node:assert';

const SERVER_PATH = path.resolve('projects/mcp-integration/mock-db-mcp-server.mjs');

class MCPClient {
  constructor() {
    this.child = spawn('node', [SERVER_PATH], { stdio: ['pipe', 'pipe', 'inherit'] });
    this.rl = readline.createInterface({ input: this.child.stdout, terminal: false });
    this.pending = new Map();
    this.reqId = 1;

    this.rl.on('line', line => {
      try {
        const res = JSON.parse(line);
        if (this.pending.has(res.id)) {
          const { resolve, reject } = this.pending.get(res.id);
          this.pending.delete(res.id);
          if (res.error) reject(new Error(res.error.message));
          else resolve(res.result);
        }
      } catch (e) {
        console.error('Client JSON parse error:', e);
      }
    });
  }

  request(method, params = {}) {
    const id = this.reqId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  close() {
    this.child.kill();
  }
}

async function runTest() {
  console.log('='.repeat(70));
  console.log('🔌 Testing Antigravity Model Context Protocol (MCP) Stdio Integration');
  console.log('='.repeat(70));

  const client = new MCPClient();

  // 1. Initialize
  process.stdout.write('• Step 1: MCP Initialize Handshake ... ');
  const initRes = await client.request('initialize', { clientInfo: { name: 'test-client', version: '1.0' } });
  assert.strictEqual(initRes.serverInfo.name, 'mock-mongo-mcp');
  console.log('✅ PASSED');

  // 2. Discover Tools
  process.stdout.write('• Step 2: Query tools/list ... ');
  const toolsRes = await client.request('tools/list');
  assert.ok(toolsRes.tools.some(t => t.name === 'db_list_collections'));
  assert.ok(toolsRes.tools.some(t => t.name === 'db_describe_schema'));
  console.log(`✅ PASSED (${toolsRes.tools.length} tools discovered)`);

  // 3. Execute Tool: db_list_collections
  process.stdout.write('• Step 3: Invoke tool: db_list_collections ... ');
  const listRes = await client.request('tools/call', { name: 'db_list_collections' });
  const collections = JSON.parse(listRes.content[0].text);
  assert.deepStrictEqual(collections, ['orders', 'webhooks']);
  console.log(`✅ PASSED (Collections: ${collections.join(', ')})`);

  // 4. Execute Tool: db_describe_schema
  process.stdout.write('• Step 4: Invoke tool: db_describe_schema for "orders" ... ');
  const schemaRes = await client.request('tools/call', {
    name: 'db_describe_schema',
    arguments: { collection: 'orders' }
  });
  const schemaData = JSON.parse(schemaRes.content[0].text);
  assert.strictEqual(schemaData.collection, 'orders');
  assert.ok(schemaData.indexes.includes('customerId'));
  assert.strictEqual(schemaData.documentCount, 1420);
  console.log(`✅ PASSED (Indexes: ${schemaData.indexes.join(', ')})`);

  client.close();
  console.log('='.repeat(70));
  console.log('🎉 MCP Integration verified! All 4 JSON-RPC frames passed.');
  console.log('='.repeat(70));
}

runTest().catch(err => {
  console.error('MCP test failed:', err);
  process.exit(1);
});
