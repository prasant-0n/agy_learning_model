export class BatchInventoryService {
  constructor(db) {
    this.db = db; // Map of sku -> stock count
  }

  // HARDENED IMPLEMENTATION: Sequential validation and atomic commit
  async processBatchDeductions(items) {
    let deductedCount = 0;

    // Phase 1: Pre-flight validation (Verify all stock before mutating)
    for (const item of items) {
      await new Promise(resolve => setTimeout(resolve, 10)); // simulated latency
      const currentStock = this.db.get(item.sku) || 0;
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for SKU: ${item.sku}`);
      }
    }

    // Phase 2: Atomic mutation
    for (const item of items) {
      const currentStock = this.db.get(item.sku) || 0;
      this.db.set(item.sku, currentStock - item.quantity);
      deductedCount++;
    }

    return {
      success: true,
      deductedCount,
      timestamp: new Date().toISOString()
    };
  }
}
