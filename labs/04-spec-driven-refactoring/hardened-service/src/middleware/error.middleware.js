export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  const response = {
    type: err.type || 'https://api.example.com/errors/internal-server-error',
    title: err.title || 'Internal Server Error',
    status,
    detail: err.message || 'An unexpected error occurred',
    instance: req.originalUrl,
    timestamp: new Date().toISOString()
  };

  if (err.errors) {
    response.invalidParams = err.errors;
  }

  if (!isProd && status === 500) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}
