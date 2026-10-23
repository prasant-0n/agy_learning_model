export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      type: 'https://api.example.com/errors/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail: 'Missing or malformed Authorization header'
    });
  }

  const token = authHeader.split(' ')[1];
  // Simulated token decoding
  if (token === 'valid-admin-token') {
    req.user = { id: 'usr_admin_123', role: 'admin', organizationId: 'org_enterprise_99' };
    return next();
  } else if (token === 'valid-customer-token') {
    req.user = { id: 'usr_cust_456', role: 'customer', organizationId: 'org_enterprise_99' };
    return next();
  }

  return res.status(403).json({
    type: 'https://api.example.com/errors/forbidden',
    title: 'Forbidden',
    status: 403,
    detail: 'Invalid or expired authentication token'
  });
}
