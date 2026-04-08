// ──────────────────────────────────────────────
// Role Middleware — Factory function for role-based access control
// Usage: authorize('Admin', 'Mentor') restricts to those roles only
// ──────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized — authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied — ${req.user.role} role is not authorized for this resource`,
      });
    }

    next();
  };
};

module.exports = { authorize };
