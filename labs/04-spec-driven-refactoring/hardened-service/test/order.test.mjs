process.env.NODE_ENV = 'test';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app } from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  await new Promise(resolve => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

describe('Hardened Order Service Test Suite', () => {
  it('1. Rejects request without authentication token with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ sku: 'SKU_PROD_LAPTOP', quantity: 1 }] })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.title, 'Unauthorized');
  });

  it('2. Zod boundary blocks empty items payload with 422', async () => {
    const res = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-customer-token'
      },
      body: JSON.stringify({ items: [] })
    });

    assert.strictEqual(res.status, 422);
    const body = await res.json();
    assert.strictEqual(body.status, 422);
    assert.ok(body.invalidParams.some(p => p.field === 'items'));
  });

  it('3. Zod boundary rejects client injecting forged unitPrice (strict mode)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-customer-token'
      },
      body: JSON.stringify({
        items: [
          { sku: 'SKU_PROD_LAPTOP', quantity: 1, unitPrice: 0.99 } // Forged price injection
        ]
      })
    });

    assert.strictEqual(res.status, 422);
    const body = await res.json();
    assert.ok(body.invalidParams.some(p => p.code === 'unrecognized_keys' || p.message.includes('Unrecognized key')));
  });

  it('4. Rejects unknown SKU with 404', async () => {
    const res = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-customer-token'
      },
      body: JSON.stringify({
        items: [
          { sku: 'NON_EXISTENT_SKU', quantity: 1 }
        ]
      })
    });

    assert.strictEqual(res.status, 404);
  });

  it('5. Successfully creates order and computes canonical price from DB catalog', async () => {
    const res = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-customer-token'
      },
      body: JSON.stringify({
        items: [
          { sku: 'SKU_PROD_LAPTOP', quantity: 1 }, // $1499.00
          { sku: 'SKU_PROD_MOUSE', quantity: 2 }   // 2 * $49.50 = $99.00
        ]
      })
    });

    assert.strictEqual(res.status, 201);
    const result = await res.json();
    const order = result.data;

    assert.ok(order.id.startsWith('ord_'));
    assert.strictEqual(order.customerId, 'usr_cust_456');
    assert.strictEqual(order.organizationId, 'org_enterprise_99');
    assert.strictEqual(order.totalAmount, 1598.00); // $1499 + $99 = $1598
    assert.strictEqual(order.status, 'CONFIRMED');
    assert.strictEqual(order.items.length, 2);
  });
});
