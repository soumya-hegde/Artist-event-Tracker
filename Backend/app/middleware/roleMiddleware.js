const roleMiddleware = (roles = []) => (req, res, next) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: unauthorized role' });
  }

  next();
};

module.exports = roleMiddleware;
