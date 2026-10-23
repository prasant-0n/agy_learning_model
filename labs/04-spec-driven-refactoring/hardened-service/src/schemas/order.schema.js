import { z } from 'zod';

export const createOrderItemSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Max quantity per item is 100')
}).strict(); // Disallows unapproved fields like forged unitPrice

export const createOrderBodySchema = z.object({
  items: z.array(createOrderItemSchema).min(1, 'Order must contain at least 1 item')
}).strict();

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = new Error('Request payload validation failed');
      error.statusCode = 422;
      error.type = 'https://api.example.com/errors/validation-failed';
      error.title = 'Unprocessable Entity';
      error.errors = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        code: issue.code,
        message: issue.message
      }));
      return next(error);
    }
    // Replace with validated, stripped data
    req.body = result.data;
    next();
  };
}
