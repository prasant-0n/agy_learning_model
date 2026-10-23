export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  res.status(status).json({
    type: err.type || 'https://api.example.com/errors/internal-server-error',
    title: err.title || 'Internal Server Error',
    status,
    detail: err.message || 'An unexpected error occurred',
    invalidParams: err.errors || undefined,
    instance: req.originalUrl,
    timestamp: new Date().toISOString()
  });
}
