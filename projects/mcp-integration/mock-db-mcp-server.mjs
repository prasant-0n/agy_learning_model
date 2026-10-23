#!/usr/bin/env node
import readline from 'node:readline';

// In-memory mock MongoDB cluster
const collections = {
  orders: {
    indexes: ['_id', 'customerId', 'organizationId', 'createdAt'],
    documentCount: 1420,
    schema: { id: 'string', customerId: 'string', organizationId: 'string', totalAmount: 'number', status: 'string' },
    sampleData: [
      { id: 'ord_1', customerId: 'cust_10', organizationId: 'org_99', totalAmount: 1499.00, status: 'CONFIRMED' },
      { id: 'ord_2', customerId: 'cust_20', organizationId: 'org_99', totalAmount: 99.50, status: 'PENDING' }
    ]
  },
  webhooks: {
    indexes: ['_id', 'eventId', 'status', 'createdAt'],
    documentCount: 5280,
    schema: { eventId: 'string', eventType: 'string', status: 'string', attempts: 'number' },
    sampleData: [
      { eventId: 'evt_100', eventType: 'order.created', status: 'DELIVERED', attempts: 1 }
    ]
  }
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

rl.on('line', line => {
  if (!line.trim()) return;

  try {
    const request = JSON.parse(line);
    const { id, method, params } = request;

    if (method === 'initialize') {
      sendResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'mock-mongo-mcp', version: '1.0.0' }
      });
      return;
    }

    if (method === 'tools/list') {
      sendResponse(id, {
        tools: [
          {
            name: 'db_list_collections',
            description: 'List all collections in the active database',
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'db_describe_schema',
            description: 'Get schema, indexes, and document count for a collection',
            inputSchema: {
              type: 'object',
              properties: { collection: { type: 'string', description: 'Collection name' } },
              required: ['collection']
            }
          },
          {
            name: 'db_execute_query',
            description: 'Run safe parameterized query against collection',
            inputSchema: {
              type: 'object',
              properties: {
                collection: { type: 'string' },
                filter: { type: 'object', description: 'Filter query' }
              },
              required: ['collection']
            }
          }
        ]
      });
      return;
    }

    if (method === 'tools/call') {
      const toolName = params && params.name;
      const args = (params && params.arguments) || {};

      if (toolName === 'db_list_collections') {
        sendResponse(id, {
          content: [{ type: 'text', text: JSON.stringify(Object.keys(collections)) }]
        });
        return;
      }

      if (toolName === 'db_describe_schema') {
        const coll = collections[args.collection];
        if (!coll) {
          sendResponse(id, { isError: true, content: [{ type: 'text', text: `Collection '${args.collection}' not found` }] });
        } else {
          sendResponse(id, {
            content: [{
              type: 'text',
              text: JSON.stringify({
                collection: args.collection,
                documentCount: coll.documentCount,
                indexes: coll.indexes,
                schema: coll.schema
              }, null, 2)
            }]
          });
        }
        return;
      }

      if (toolName === 'db_execute_query') {
        const coll = collections[args.collection];
        if (!coll) {
          sendResponse(id, { isError: true, content: [{ type: 'text', text: `Collection '${args.collection}' not found` }] });
        } else {
          sendResponse(id, {
            content: [{ type: 'text', text: JSON.stringify(coll.sampleData, null, 2) }]
          });
        }
        return;
      }

      sendResponse(id, { isError: true, content: [{ type: 'text', text: `Unknown tool: ${toolName}` }] });
      return;
    }

    // Default response for unhandled notifications/methods
    sendResponse(id, {});
  } catch (err) {
    console.error('Error handling MCP frame:', err.message);
  }
});

function sendResponse(id, result) {
  const payload = JSON.stringify({ jsonrpc: '2.0', id, result });
  process.stdout.write(payload + '\n');
}
