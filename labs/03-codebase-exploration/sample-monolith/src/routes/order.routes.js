import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

export const orderRouter = Router();

// Middleware: all order routes require authenticated user
orderRouter.use(authenticate);

// POST /api/v1/orders
orderRouter.post('/', orderController.createOrder);

// GET /api/v1/orders/:id
orderRouter.get('/:id', orderController.getOrderById);
