import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { createOrderBodySchema, validateBody } from '../schemas/order.schema.js';

export const orderRouter = Router();

// Middleware: all order routes require authenticated user
orderRouter.use(authenticate);

// POST /api/v1/orders - Protected by Zod boundary validation
orderRouter.post('/', validateBody(createOrderBodySchema), orderController.createOrder);

// GET /api/v1/orders/:id
orderRouter.get('/:id', orderController.getOrderById);
