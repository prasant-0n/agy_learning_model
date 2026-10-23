export class OrderRepository {
  constructor() {
    this.orders = new Map();
  }

  async create(orderData, session = null) {
    // Simulating MongoDB multi-document ACID write
    const order = {
      ...orderData,
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.set(order.id, order);
    return order;
  }

  async findByIdAndOrg(orderId, organizationId) {
    const order = this.orders.get(orderId);
    if (!order || order.organizationId !== organizationId) {
      return null;
    }
    return order;
  }

  async listByCustomer(customerId, organizationId) {
    return Array.from(this.orders.values()).filter(
      o => o.customerId === customerId && o.organizationId === organizationId
    );
  }
}

export const orderRepository = new OrderRepository();
