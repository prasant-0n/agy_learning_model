import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BatchInventoryService } from '../src/batch-inventory.service.js';

describe('Batch Inventory Service Regression Suite', () => {
  it('1. MUST properly await all asynchronous deductions before returning', async () => {
    const db = new Map([
      ['SKU_LAPTOP', 10],
      ['SKU_MOUSE', 20]
    ]);

    const service = new BatchInventoryService(db);
    const result = await service.processBatchDeductions([
      { sku: 'SKU_LAPTOP', quantity: 2 },
      { sku: 'SKU_MOUSE', quantity: 5 }
    ]);

    // The bug causes deductedCount to be 0 at return time
    assert.strictEqual(result.deductedCount, 2, 'Must report exact number of deducted items');
    assert.strictEqual(db.get('SKU_LAPTOP'), 8, 'Database must be updated before function returns');
    assert.strictEqual(db.get('SKU_MOUSE'), 15, 'Database must be updated before function returns');
  });

  it('2. MUST propagate errors when stock is insufficient instead of returning success', async () => {
    const db = new Map([
      ['SKU_LAPTOP', 1]
    ]);

    const service = new BatchInventoryService(db);

    await assert.rejects(
      async () => {
        await service.processBatchDeductions([
          { sku: 'SKU_LAPTOP', quantity: 5 } // Exceeds available stock (1)
        ]);
      },
      /Insufficient stock/
    );
  });
});
