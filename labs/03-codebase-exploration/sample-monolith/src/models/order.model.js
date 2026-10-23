export class OrderModel {
  static schema = {
    id: 'string',
    customerId: 'string',
    organizationId: 'string',
    items: [
      {
        sku: 'string',
        quantity: 'number',
        unitPrice: 'number'
      }
    ],
    totalAmount: 'number',
    status: 'string', // PENDING, CONFIRMED, CANCELLED
    createdAt: 'date',
    updatedAt: 'date'
  };
}
