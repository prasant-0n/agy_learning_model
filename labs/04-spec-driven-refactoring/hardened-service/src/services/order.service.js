import { orderRepository } from '../repositories/order.repository.js';
import { productRepository } from '../repositories/product.repository.js';

export class DomainError extends Error {
  constructor(message, statusCode = 400, type = 'https://api.example.com/errors/bad-request') {
    super(message);
    this.name = 'DomainError';
    this.statusCode = statusCode;
    this.type = type;
  }
}

export class OrderService {
  constructor(orderRepo = orderRepository, productRepo = productRepository) {
    this.orderRepo = orderRepo;
    this.productRepo = productRepo;
  }

  async placeOrder({ customerId, organizationId, items }) {
    // Verified items schema already enforced by Zod middleware
    const resolvedItems = [];
    let totalAmount = 0;

    // Simulated ACID transaction boundary
    for (const item of items) {
      const product = await this.productRepo.findBySku(item.sku);
      if (!product) {
        throw new DomainError(`Product with SKU '${item.sku}' not found`, 404, 'https://api.example.com/errors/not-found');
      }

      if (product.stock < item.quantity) {
        throw new DomainError(`Insufficient stock for SKU '${item.sku}' (Available: ${product.stock})`, 409, 'https://api.example.com/errors/conflict');
      }

      // Decrement stock
      await this.productRepo.decrementStock(item.sku, item.quantity);

      // Use authoritative catalog price - NEVER client input
      const unitPrice = product.price;
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;

      resolvedItems.push({
        sku: product.sku,
        name: product.name,
        quantity: item.quantity,
        unitPrice,
        subtotal
      });
    }

    const orderData = {
      customerId,
      organizationId,
      items: resolvedItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: 'CONFIRMED'
    };

    return await this.orderRepo.create(orderData);
  }

  async getOrder(orderId, organizationId) {
    const order = await this.orderRepo.findByIdAndOrg(orderId, organizationId);
    if (!order) {
      throw new DomainError(`Order ${orderId} not found`, 404, 'https://api.example.com/errors/not-found');
    }
    return order;
  }
}

export const orderService = new OrderService();
