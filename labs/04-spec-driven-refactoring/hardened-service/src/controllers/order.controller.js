import { orderService } from '../services/order.service.js';

export class OrderController {
  constructor(service = orderService) {
    this.service = service;
  }

  createOrder = async (req, res, next) => {
    try {
      const { items } = req.body;
      const { id: customerId, organizationId } = req.user;

      const order = await this.service.placeOrder({
        customerId,
        organizationId,
        items
      });

      return res.status(201).json({
        data: order,
        meta: { timestamp: new Date().toISOString() }
      });
    } catch (err) {
      return next(err);
    }
  };

  getOrderById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const order = await this.service.getOrder(id, organizationId);

      return res.status(200).json({
        data: order
      });
    } catch (err) {
      return next(err);
    }
  };
}

export const orderController = new OrderController();
