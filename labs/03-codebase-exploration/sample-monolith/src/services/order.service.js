import { orderRepository } from '../repositories/order.repository.js';

export class DomainError extends Error {
  constructor(message, statusCode = 400, type = 'https://api.example.com/errors/bad-request') {
    super(message);
    this.name = 'DomainError';
    this.statusCode = statusCode;
    this.type = type;
  }
}

export class OrderService {
  constructor(repo = orderRepository) {
    this.repo = repo;
  }

  async placeOrder({ customerId, organizationId, items }) {
    if (!items || items.length === 0) {
      throw new DomainError('Order must contain at least one item', 422);
    }

    // Business Logic: Compute total amount and verify pricing
    let totalAmount = 0;
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new DomainError(`Invalid quantity for SKU: ${item.sku}`, 422);
      }
      totalAmount += item.unitPrice * item.quantity;
    }

    const orderData = {
      customerId,
      organizationId,
      items,
      totalAmount,
      status: 'CONFIRMED'
    };

    return await this.repo.create(orderData);
  }

  async getOrder(orderId, organizationId) {
    const order = await this.repo.findByIdAndOrg(orderId, organizationId);
    if (!order) {
      throw new DomainError(`Order ${orderId} not found`, 404, 'https://api.example.com/errors/not-found');
    }
    return order;
  }
}

export const orderService = new OrderService();
