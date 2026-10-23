export class ProductRepository {
  constructor() {
    this.catalog = new Map([
      ['SKU_PROD_LAPTOP', { sku: 'SKU_PROD_LAPTOP', name: 'Developer Laptop', price: 1499.00, stock: 25 }],
      ['SKU_PROD_MOUSE', { sku: 'SKU_PROD_MOUSE', name: 'Ergonomic Mouse', price: 49.50, stock: 100 }],
      ['SKU_PROD_KEYBOARD', { sku: 'SKU_PROD_KEYBOARD', name: 'Mechanical Keyboard', price: 129.99, stock: 50 }]
    ]);
  }

  async findBySku(sku, session = null) {
    return this.catalog.get(sku) || null;
  }

  async decrementStock(sku, quantity, session = null) {
    const product = this.catalog.get(sku);
    if (!product || product.stock < quantity) {
      return false;
    }
    product.stock -= quantity;
    return true;
  }
}

export const productRepository = new ProductRepository();
